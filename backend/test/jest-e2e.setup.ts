process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret';
process.env.MONGO_URI =
  process.env.MONGO_URI_TEST ?? 'mongodb://127.0.0.1:27017/kanban_test';
