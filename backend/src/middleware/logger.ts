// src/middleware/logger.ts — Writes one line per HTTP request through Winston.
// Morgan measures the request (method, address, status, time) and hands the finished line to Winston,
// so request lines end up on screen and in logs/combined.log with everything else.

import morgan from 'morgan';
import logger from '../config/logger';

// Do not log passwords or tokens: only the address and status are written, never the body or headers
const requestLogger = morgan(':method :url :status :res[content-length] - :response-time ms', {
  stream: { write: (line: string) => logger.http(line.trim()) },
});

export { requestLogger };
