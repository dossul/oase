import { RbacMatriceService } from './rbac-matrice.service';
import { Role } from '../common/enums/generated';

describe('RbacMatriceService', () => {
  let service: RbacMatriceService;

  beforeEach(() => {
    service = new RbacMatriceService();
  });

  it('expose les endpoints protégés avec leurs rôles réels', () => {
    const { entrees } = service.matrice();
    expect(entrees.length).toBeGreaterThan(80);

    // Les routes publiques (login) ne doivent pas figurer dans la matrice
    const login = entrees.find((e) => e.chemin.includes('/auth/login'));
    expect(login).toBeUndefined();

    const approuver = entrees.find((e) => e.http === 'POST' && e.chemin === '/demandes/:id/approuver');
    expect(approuver).toBeDefined();
    expect(approuver!.roles).toEqual([Role.DECIDEUR, Role.ADMIN_SI]);
  });

  it('inclut les modules récents (accords de siège, rapprochements)', () => {
    const { entrees } = service.matrice();
    const accords = entrees.find((e) => e.http === 'POST' && e.chemin === '/accords-siege');
    expect(accords).toBeDefined();
    expect(accords!.roles).toEqual([Role.AGENT_MAE, Role.ADMIN_SI]);

    const rapprochements = entrees.find((e) => e.chemin === '/rapprochements');
    expect(rapprochements).toBeDefined();
    expect(rapprochements!.roles).toContain(Role.AGENT_DGTCP);
    expect(rapprochements!.roles).not.toContain(Role.CONTRIBUABLE);
  });

  it('la liste des rôles est l’union réelle des rôles utilisés (pas de public/system)', () => {
    const { roles } = service.matrice();
    expect(roles).toContain(Role.CONTRIBUABLE);
    expect(roles).toContain(Role.ADMIN_SI);
    expect(roles).not.toContain(Role.PUBLIC);
    expect(roles).not.toContain(Role.SYSTEM);
  });

  it('chemins normalisés sans double slash', () => {
    const { entrees } = service.matrice();
    for (const e of entrees) {
      expect(e.chemin).toMatch(/^\//);
      expect(e.chemin).not.toContain('//');
    }
  });
});
