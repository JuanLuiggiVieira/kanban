import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { ConfigModule } from '@nestjs/config';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [JwtStrategy],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should validate and return the user payload', async () => {
    const payload = {
      sub: '123456',
      email: 'test@example.com',
      roles: [{ organizationId: 'org123', role: 'admin' }],
    };

    const result = await strategy.validate(payload);

    expect(result).toEqual({
      userId: '123456',
      email: 'test@example.com',
      roles: payload.roles,
    });
  });
});
