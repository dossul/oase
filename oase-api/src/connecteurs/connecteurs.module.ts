import { Module, Global } from '@nestjs/common';
import { CircuitBreakerService } from './circuit-breaker.service';
import { EtaxAdapter } from './adapters/etax.adapter';
import { SydoniaAdapter } from './adapters/sydonia.adapter';
import { ConnecteursService } from './connecteurs.service';
import { ConnecteursController } from './connecteurs.controller';

@Global()
@Module({
  controllers: [ConnecteursController],
  providers: [CircuitBreakerService, EtaxAdapter, SydoniaAdapter, ConnecteursService],
  exports: [CircuitBreakerService, EtaxAdapter, SydoniaAdapter, ConnecteursService],
})
export class ConnecteursModule {}
