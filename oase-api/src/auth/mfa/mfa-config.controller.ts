import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/generated';
import { MfaPolicyService } from './mfa-policy.service';
import { UpdateMfaConfigDto } from './dto/update-mfa-config.dto';

@Controller('admin/mfa')
@UseGuards(JwtAuthGuard, RbacGuard)
export class MfaConfigController {
  constructor(private policy: MfaPolicyService) {}

  @Get('config')
  @Roles(Role.ADMIN_SI)
  async getConfig() {
    return this.policy.getConfig();
  }

  @Patch('config')
  @Roles(Role.ADMIN_SI)
  async updateConfig(@Body() dto: UpdateMfaConfigDto) {
    const updates: Record<string, unknown> = {};
    if (dto.enabled !== undefined) updates.enabled = dto.enabled;
    if (dto.channels !== undefined) updates.channels = dto.channels;
    if (dto.defaultChannel !== undefined) updates.defaultChannel = dto.defaultChannel;
    if (dto.ttlSeconds !== undefined) updates.ttlSeconds = dto.ttlSeconds;
    if (dto.maxAttempts !== undefined) updates.maxAttempts = dto.maxAttempts;
    if (dto.emailEnabled !== undefined) updates.emailEnabled = dto.emailEnabled;
    if (dto.whatsappEnabled !== undefined) updates.whatsappEnabled = dto.whatsappEnabled;
    if (dto.whatsappTemplate !== undefined) updates.whatsappTemplate = dto.whatsappTemplate;
    return this.policy.updateConfig(updates as any);
  }
}
