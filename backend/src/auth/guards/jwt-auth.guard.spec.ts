import { JwtAuthGuard } from './jwt-auth.guard';
import { ExecutionContext } from '@nestjs/common';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('canActivate should call super.canActivate', async () => {
    const context = {} as ExecutionContext;
    const result = guard.canActivate(context);
    expect(result).toBeInstanceOf(Promise); // AuthGuard is async
  });
});
