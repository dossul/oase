"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PinGuard = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("../auth.service");
let PinGuard = class PinGuard {
    constructor(authService) {
        this.authService = authService;
    }
    async canActivate(ctx) {
        const req = ctx.switchToHttp().getRequest();
        const user = req.user;
        const pin = req.body?.pin;
        if (!pin) {
            throw new common_1.UnauthorizedException({ code: 'PIN_REQUIS' });
        }
        const valid = await this.authService.verifyPin(user.id, pin);
        if (!valid) {
            throw new common_1.UnauthorizedException({ code: 'PIN_INVALIDE' });
        }
        return true;
    }
};
exports.PinGuard = PinGuard;
exports.PinGuard = PinGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], PinGuard);
//# sourceMappingURL=pin.guard.js.map