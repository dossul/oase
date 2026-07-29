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
import { DemandesModule } from './demandes/demandes.module';
import { PiecesJointesModule } from './pieces-jointes/pieces-jointes.module';
import { WorkflowModule } from './workflow/workflow.module';
import { ReglesBlocageModule } from './regles-blocage/regles-blocage.module';
import { DecisionsModule } from './decisions/decisions.module';
import { AttestationsModule } from './attestations/attestations.module';
import { NotificationsModule } from './notifications/notifications.module';
import { BasesJuridiquesModule } from './bases-juridiques/bases-juridiques.module';
import { QuotasModule } from './quotas/quotas.module';
import { AnomaliesModule } from './anomalies/anomalies.module';
import { ConventionsModule } from './conventions/conventions.module';
import { DashboardsModule } from './dashboards/dashboards.module';
import { RapportsModule } from './rapports/rapports.module';
import { JobsModule } from './jobs/jobs.module';
import { OtpModule } from './otp/otp.module';
import { AdminModule } from './admin/admin.module';
import { RegistreCentralModule } from './registre-central/registre-central.module';
import { MissionsModule } from './missions/missions.module';
import { ContribuablesModule } from './contribuables/contribuables.module';
import { PermisMiniersModule } from './permis-miniers/permis-miniers.module';

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
    DemandesModule,
    PiecesJointesModule,
    WorkflowModule,
    ReglesBlocageModule,
    DecisionsModule,
    AttestationsModule,
    NotificationsModule,
    BasesJuridiquesModule,
    QuotasModule,
    AnomaliesModule,
    ConventionsModule,
    DashboardsModule,
    RapportsModule,
    JobsModule,
    OtpModule,
    AdminModule,
    RegistreCentralModule,
    MissionsModule,
    ContribuablesModule,
    PermisMiniersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
