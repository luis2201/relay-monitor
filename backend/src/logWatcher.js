const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { EventEmitter } = require('events');
const { parsePostfixLine } = require('./postfixParser');
const eventRepository = require('./eventRepository');

function splitCompleteLines(buffer) {
  const lines = buffer.split(/\r?\n/);
  const remainder = lines.pop() || '';
  return { lines, remainder };
}

class LogWatcher extends EventEmitter {
  constructor(options = {}) {
    super();
    this.source = options.source || process.env.LOG_SOURCE || 'file';
    this.logFile = options.logFile || process.env.LOG_FILE || './logs/postfix.log';
    this.journalUnit = options.journalUnit || process.env.JOURNAL_UNIT || 'postfix';
    this.offset = 0;
    this.remainder = '';
    this.fileWatcher = null;
    this.journalProcess = null;
  }

  async start() {
    if (this.source === 'journalctl') {
      this.startJournalctl();
      return;
    }

    await this.startFileWatcher();
  }

  async stop() {
    if (this.fileWatcher) {
      this.fileWatcher.close();
    }

    if (this.journalProcess) {
      this.journalProcess.kill('SIGTERM');
    }
  }

  async startFileWatcher() {
    fs.mkdirSync(path.dirname(this.logFile), { recursive: true });

    if (!fs.existsSync(this.logFile)) {
      fs.writeFileSync(this.logFile, '');
    }

    await this.readNewFileBytes();

    this.fileWatcher = fs.watch(this.logFile, async (eventType) => {
      if (eventType !== 'change') {
        return;
      }

      try {
        await this.readNewFileBytes();
      } catch (error) {
        this.emit('error', error);
      }
    });
  }

  async readNewFileBytes() {
    const stats = await fs.promises.stat(this.logFile);

    if (stats.size < this.offset) {
      this.offset = 0;
      this.remainder = '';
    }

    if (stats.size === this.offset) {
      return;
    }

    const stream = fs.createReadStream(this.logFile, {
      start: this.offset,
      end: stats.size - 1,
      encoding: 'utf8'
    });

    let chunk = '';

    for await (const part of stream) {
      chunk += part;
    }

    this.offset = stats.size;
    await this.processText(chunk);
  }

  startJournalctl() {
    this.journalProcess = spawn('journalctl', ['-f', '-u', this.journalUnit], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    this.journalProcess.stdout.setEncoding('utf8');
    this.journalProcess.stdout.on('data', (chunk) => {
      this.processText(chunk).catch((error) => this.emit('error', error));
    });

    this.journalProcess.stderr.setEncoding('utf8');
    this.journalProcess.stderr.on('data', (chunk) => {
      this.emit('error', new Error(chunk.trim()));
    });

    this.journalProcess.on('error', (error) => {
      this.emit('error', error);
    });
  }

  async processText(text) {
    const { lines, remainder } = splitCompleteLines(`${this.remainder}${text}`);
    this.remainder = remainder;

    for (const line of lines) {
      await this.processLine(line);
    }
  }

  async processLine(line) {
    const event = parsePostfixLine(line);

    if (!event) {
      return;
    }

    const savedEvent = await eventRepository.createEvent(event);

    if (savedEvent) {
      this.emit('event', savedEvent);
    }
  }
}

module.exports = {
  LogWatcher
};
