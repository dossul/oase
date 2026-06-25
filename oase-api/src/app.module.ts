import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validate } from './config/config.schema';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { ConnecteursModule } from './connecteurs/connecteurs.module';
import { CommonModule } from './common/common.module';
import { UtilisateursModule } from './utilisateurs/utilisateurs.module';
import { BeneficiairesModule } from './beneficiaires/beneficiaires.module';
import { DemandesModule } from './demandes/demandes.module';
import { PiecesJointesModule } from './pieces-jointes/pieces-jointes.module';
import { WorkflowModule } from './workflow/workflow.module';
import { ReglesBlocageModule } from './regles-blocage/regles-blocage.module';
import { DecisionsModule } from './decisions/decisions.module';
import { AttestationsModule } from './attestations/attestations.module';
import { NotificationsModule } from './notifications/notifications.module';
import { BasesJuridiquesModule } from './bases-juridiques/bases-juridiques.module';
import { QuotasModule } from './quotas/quotas.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
      },
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 100,
      },
    ]),
    CommonModule,
    PrismaModule,
    HealthModule,
    AuditModule,
    AuthModule,
    ConnecteursModule,
    UtilisateursModule,
    BeneficiairesModule,
    DemandesModule,
    PiecesJointesModule,
    WorkflowModule,
    ReglesBlocageModule,
    DecisionsModule,
    AttestationsModule,
    NotificationsModule,
    BasesJuridiquesModule,
    QuotasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
