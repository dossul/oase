import { AuthService, AuthUser } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { VerifyMfaDto } from './dto/verify-mfa.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SetPinDto } from './dto/set-pin.dto';
import { Request } from 'express';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(dto: LoginDto, req: Request): Promise<{
        access_token: string;
        refresh_token: string;
        expires_in: number;
        user: AuthUser;
    } | {
        mfa_required: boolean;
        mfa_token: string;
        expires_in: number;
    }>;
    verifyMfa(dto: VerifyMfaDto, req: Request): Promise<{
        access_token: string;
        refresh_token: string;
        expires_in: number;
        user: AuthUser;
    }>;
    refresh(dto: RefreshTokenDto, req: Request): Promise<{
        access_token: string;
        refresh_token: string;
        expires_in: number;
        user: AuthUser;
    }>;
    logout(dto: RefreshTokenDto): Promise<void>;
    setPin(user: AuthUser, dto: SetPinDto): Promise<void>;
    me(user: AuthUser): {
        data: AuthUser;
    };
}
