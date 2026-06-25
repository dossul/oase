"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnecteursModule = void 0;
const common_1 = require("@nestjs/common");
const circuit_breaker_service_1 = require("./circuit-breaker.service");
const etax_adapter_1 = require("./adapters/etax.adapter");
const sydonia_adapter_1 = require("./adapters/sydonia.adapter");
let ConnecteursModule = class ConnecteursModule {
};
exports.ConnecteursModule = ConnecteursModule;
exports.ConnecteursModule = ConnecteursModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [circuit_breaker_service_1.CircuitBreakerService, etax_adapter_1.EtaxAdapter, sydonia_adapter_1.SydoniaAdapter],
        exports: [circuit_breaker_service_1.CircuitBreakerService, etax_adapter_1.EtaxAdapter, sydonia_adapter_1.SydoniaAdapter],
    })
], ConnecteursModule);
//# sourceMappingURL=connecteurs.module.js.map