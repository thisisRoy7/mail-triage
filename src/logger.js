import fs from 'fs';
import path from 'path';

const LOG_DIR = './logs';
const LOG_FILE = path.join(LOG_DIR, 'system.log');

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });

function writeLog(level, moduleName, message, data = null) {
  const timestamp = new Date().toISOString();
  let logLine = `[${timestamp}] [${level}] [${moduleName}] ${message}`;

  if (data) {
    if (data instanceof Error) {
      logLine += ` | Error: ${data.message}\nStack: ${data.stack}`;
    } else if (typeof data === 'object') {
      try {
        logLine += ` | Data: ${JSON.stringify(data)}`;
      } catch {
        logLine += ` | Data: [Unserializable Object]`;
      }
    } else {
      logLine += ` | ${data}`;
    }
  }

  logLine += '\n';

  logStream.write(logLine);

  if (level === 'ERROR') {
    console.error(logLine.trim());
  } else if (level === 'WARN') {
    console.warn(logLine.trim());
  } else {
    console.log(logLine.trim());
  }
}

export const logger = {
  info: (moduleName, message, data) => writeLog('INFO', moduleName, message, data),
  warn: (moduleName, message, data) => writeLog('WARN', moduleName, message, data),
  error: (moduleName, message, data) => writeLog('ERROR', moduleName, message, data),
  debug: (moduleName, message, data) => writeLog('DEBUG', moduleName, message, data)
};