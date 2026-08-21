import { Module } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { AuthGuard } from '../common/auth.guard';

@Module({
  // AuthGuard needs JwtService (globally provided by app.module JwtModule)
  // but still needs to be declared as a provider here so NestJS can inject it
  // when the controller uses @UseGuards(AuthGuard).
  providers: [ContactsService, AuthGuard],
  controllers: [ContactsController],
})
export class ContactsModule {}
