import { Injectable } from '@nestjs/common';

@Injectable()
export class TokenBlacklistService {
  private readonly blacklist = new Set<string>();

  revoke(token: string): void {
    this.blacklist.add(token);
  }

  isRevoked(token: string): boolean {
    return this.blacklist.has(token);
  }
}
