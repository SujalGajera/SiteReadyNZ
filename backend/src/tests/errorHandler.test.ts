import { globalErrorHandler, type AppError } from '../middleware/errorHandler';
import logger from '../config/logger';
import { fakeNext, fakeRequest, fakeResponse } from './helpers';

jest.mock('../config/logger', () => ({
  __esModule: true,
  default: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), http: jest.fn() },
}));

function run(error: Partial<AppError> & { code?: number; keyValue?: Record<string, unknown> }) {
  const res = fakeResponse();
  globalErrorHandler(Object.assign(new Error(error.message ?? 'boom'), error) as AppError, fakeRequest(), res, fakeNext());
  return res;
}

describe('globalErrorHandler', () => {
  it('turns a duplicate-key database error into 409 and names the field', () => {
    const res = run({ code: 11000, keyValue: { serialNumber: 'FE-1' } });
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'That serialNumber is already in use.' });
  });

  it('turns a badly formed id (CastError) into 400', () => {
    const res = run({ name: 'CastError' });
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('turns a database validation error into 400 with its message', () => {
    const res = run({ name: 'ValidationError', message: 'Name is required' });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Name is required' });
  });

  it('passes on the message of an expected problem, using the status the error carries', () => {
    const res = run({ statusCode: 404, message: 'Equipment not found.' });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Equipment not found.' });
    expect(logger.warn).toHaveBeenCalled();
  });

  it('understands the status field that body-parser uses for bad JSON', () => {
    const res = run({ status: 400, message: 'Unexpected token } in JSON' });
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('hides the real message of a server fault from the client, but logs it with context', () => {
    const res = run({ message: 'connect ECONNREFUSED 10.0.0.5:27017' });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'An unexpected server error occurred.' });
    expect(logger.error).toHaveBeenCalledWith('Unhandled server error', expect.objectContaining({ message: 'connect ECONNREFUSED 10.0.0.5:27017', method: 'GET', url: '/test' }));
  });
});
