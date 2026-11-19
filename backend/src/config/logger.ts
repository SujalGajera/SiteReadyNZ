// src/config/logger.ts — The app's logger (Winston).
//
// Why a logger and not console.log: a logger stamps every line with a time and a level (error, warn,
// info, http, debug), can write to a file as well as the screen, and can be turned up or down without
// touching the code. When something goes wrong at 2am, the file in logs/ is what you read.
//
//   logs/error.log     only errors (what to look at first)
//   logs/combined.log  everything at "http" level and above, including every request
//   screen             colourful, easy to read while developing

import path from 'path';
import winston from 'winston';

const isTest = process.env.NODE_ENV === 'test';

// Tests should be quiet and should not create log files
const level = process.env.LOG_LEVEL ?? (isTest ? 'error' : 'http');

// Plain-text line for the screen: 10:42:07 info: message {extra details}
const screenFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level: lineLevel, message, ...details }) => {
    const extra = Object.keys(details).length > 0 ? ` ${JSON.stringify(details)}` : '';
    return `${timestamp} ${lineLevel}: ${message}${extra}`;
  })
);

// One JSON object per line in the files, easy to search and to feed into a log tool later
const fileFormat = winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json());

const logDirectory = path.join(__dirname, '..', '..', 'logs');

const logger = winston.createLogger({
  level,
  transports: [
    new winston.transports.Console({ format: screenFormat, silent: isTest && !process.env.LOG_LEVEL }),
    ...(isTest
      ? []
      : [
          new winston.transports.File({ filename: path.join(logDirectory, 'error.log'), level: 'error', format: fileFormat, maxsize: 5_000_000, maxFiles: 3 }),
          new winston.transports.File({ filename: path.join(logDirectory, 'combined.log'), format: fileFormat, maxsize: 5_000_000, maxFiles: 3 }),
        ]),
  ],
});

export default logger;
