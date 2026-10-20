import { Controller, Get, Inject, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { DbModule, DbService } from './db/db.module';
import { AuthModule } from './modules/auth/auth.module';
import { PostsModule } from './modules/posts/posts.module';
import { Public, SessionGuard } from './common/session';
import { PlannedModule } from './common/planned.controller';
import { fail } from './common/http';
@Controller('health')
class HealthController {
  constructor(@Inject(DbService) private readonly db: DbService) {}
  @Public() @Get() live() {
    return { data: { status: 'ok' } };
  }
  @Public() @Get('ready') async ready() {
    try {
      await this.db.$queryRaw`SELECT 1`;
    } catch {
      fail(503, 'DATABASE_UNAVAILABLE', 'Өгөгдлийн сантай холбогдоогүй');
    }
    return { data: { status: 'ready' } };
  }
}
@Module({
  imports: [DbModule, AuthModule, PostsModule, PlannedModule],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: SessionGuard }],
})
export class AppModule {}
