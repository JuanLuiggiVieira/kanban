import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';

describe('Auth & Users E2E (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  const email = `e2e-${Date.now()}@example.com`;
  const password = 'Test1234!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should return access_token with correct credentials', async () => {
    const createUserResponse = await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'E2E User',
        email,
        password,
      });

    expect(createUserResponse.status).toBe(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email,
        password,
      });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.access_token).toBeDefined();

    accessToken = loginResponse.body.access_token;
  });

  it('should deny access with invalid token', async () => {
    const res = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', 'Bearer invalid.token.here');

    expect(res.status).toBe(401);
    expect(res.body.message).toBeDefined();
  });

  it('should allow access to protected /users route with valid token', async () => {
    const res = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});
