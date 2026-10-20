import { Global, Injectable, Module, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@campusfind/database';
@Injectable()
export class DbService extends PrismaClient implements OnModuleDestroy {
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
@Global()
@Module({ providers: [DbService], exports: [DbService] })
export class DbModule {}
