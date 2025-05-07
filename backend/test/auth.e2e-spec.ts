import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';

describe('Auth & Users E2E (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should return access_token with correct credentials', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin2.juan@example.com',
        password: 'Test1234!',
      });

    console.log('🔐 Login response status:', loginResponse.status);
    console.log('🔐 Token:', loginResponse.body.access_token);

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
    console.log('➡️ Trying to call /users with token:', accessToken);

    const res = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${accessToken}`);

    console.log('⬅️ /users response status:', res.status);
    console.log('⬅️ /users response body:', res.body);

    expect(res.status).toBe(200);
    expect(res.text).toEqual('Protected user list');
  });

  afterAll(async () => {
    await app.close();
  });
});
