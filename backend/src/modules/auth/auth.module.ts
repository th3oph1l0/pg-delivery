import { Body, Controller, HttpCode, Ip, Headers, Module, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../shared/presentation/auth';
import { AuthService } from './auth.service';
import { LoginDto, RefreshDto, RegisterDto, TokenPair } from './dto/auth.dto';

@ApiTags('auth')
@Public()
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  register(@Body() dto: RegisterDto, @Ip() ip: string, @Headers('user-agent') ua: string): Promise<TokenPair> {
    return this.auth.register(dto, { ip, ua });
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  login(@Body() dto: LoginDto, @Ip() ip: string, @Headers('user-agent') ua: string): Promise<TokenPair> {
    return this.auth.login(dto, { ip, ua });
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshDto, @Ip() ip: string, @Headers('user-agent') ua: string): Promise<TokenPair> {
    return this.auth.refresh(dto.refreshToken, { ip, ua });
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Body() dto: RefreshDto): Promise<void> {
    return this.auth.logout(dto.refreshToken);
  }
}

@Module({ controllers: [AuthController], providers: [AuthService] })
export class AuthModule {}
