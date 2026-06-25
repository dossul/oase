import { Module, Global } from '@nestjs/common';
import { CircuitBreakerService } from './circuit-breaker.service';
import { EtaxAdapter } from './adapters/etax.adapter';
import { SydoniaAdapter } from './adapters/sydonia.adapter';

@Global()
@Module({
  providers: [CircuitBreakerService, EtaxAdapter, SydoniaAdapter],
  exports: [CircuitBreakerService, EtaxAdapter, SydoniaAdapter],
})
export class ConnecteursModule {}
