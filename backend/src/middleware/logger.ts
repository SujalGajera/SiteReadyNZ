// src/middleware/logger.ts — HTTP request logger middleware
// Uses Morgan's 'dev' preset which prints coloured, concise request summaries
// to the console. Useful during development and QA for seeing every request at a glance.

import morgan from 'morgan';

// 'dev' format: METHOD URL STATUS response-time ms - size bytes
// Example output: GET /api/equipment 200 12.345 ms - 1234
export const requestLogger = morgan('dev');
