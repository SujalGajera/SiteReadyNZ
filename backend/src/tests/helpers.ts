// Small helpers shared by the tests: a fake Express request, response and next().
// Tests call controller and middleware functions directly with these, so no server or database is needed.

import type { NextFunction, Request, Response } from 'express';

export interface FakeRequestOptions {
  body?: unknown;
  params?: Record<string, string>;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  user?: { id: string; role: string; orgId: string };
}

/** A request with only the fields a test sets */
export function fakeRequest(options: FakeRequestOptions = {}): Request {
  return {
    body: options.body ?? {},
    params: options.params ?? {},
    query: options.query ?? {},
    headers: options.headers ?? {},
    cookies: options.cookies ?? {},
    user: options.user,
    method: 'GET',
    originalUrl: '/test',
  } as unknown as Request;
}

/** A response whose methods record how they were called, and can be chained like Express's */
export function fakeResponse() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    redirect: jest.fn(),
  };
  return res as typeof res & Response;
}

export function fakeNext() {
  return jest.fn() as jest.Mock & NextFunction;
}

/** Fixed ids so tests read clearly */
export const MANAGER = { id: 'manager-1', role: 'manager', orgId: 'org-1' };
export const STAFF = { id: 'staff-1', role: 'staff', orgId: 'org-1' };
