import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiBearerAuth()
@ApiTags('users')
@Controller('users')
@Roles(Role.ADMIN) // Section 21: user management is Admin-only
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.usersService.findAll(req.user.companyId);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateUserDto) {
    return this.usersService.create(req.user.companyId, req.user.sub, dto);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(req.user.companyId, req.user.sub, id, dto);
  }
}
