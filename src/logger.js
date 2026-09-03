import fs from 'fs';
import path from 'path';

const LOG_DIR = './logs';

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Format local date and time: YYYY-MM-DD_HH-mm-ss
function getFormattedTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());

  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

// Generate a fresh log filename on each application startup
const LOG_FILE = path.join(LOG_DIR, `system-${getFormattedTimestamp()}.log`);
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