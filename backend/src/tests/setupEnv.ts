// Runs before every test file. Gives the code the settings it expects, with fake values.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-only-used-by-unit-tests';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CLIENT_URL = 'http://localhost:5173';
