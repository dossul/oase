# OASE-52 — Definition of Done frontend / backend

> **Issue Plane :** OASE-52  
> **Date :** 2026-06-16

---

## Definition of Done — Toute User Story

### ✅ Conditions obligatoires (DoD commune)

Avant qu'une US soit considérée comme terminée, **toutes** les conditions suivantes doivent être satisfaites :

1. **Code révisé** : Peer review approuvé sur la Pull Request
2. **Tests unitaires passent** : `npm test` → 0 échec · couverture ≥ 80% des lignes modifiées
3. **Lint passant** : `npm run lint` → 0 erreur · 0 warning critique
4. **Build réussi** : `npm run build` → 0 erreur TypeScript
5. **Migration DB incluse** : Si schéma modifié → fichier Prisma migration versionné
6. **API documentée** : Nouveaux endpoints Swagger + exemples request/response
7. **Audit log** : Toutes les mutations sensibles tracées (automatique via interceptor)
8. **Pas de credential en dur** : Vérification via `git grep -i "password\|secret\|key"`
9. **Pas de console.log en production** : Vérification via `grep -r "console.log" src/` → 0 résultat
10. **Plane mis à jour** : Issue déplacée en `Done` avec référence PR

---

## DoD spécifique — Backend (NestJS)

| # | Critère | Vérification |
|---|---------|------------|
| B1 | `class-validator` sur tous les DTOs | Review fichiers `*.dto.ts` |
| B2 | Service couvert par tests unitaires | `*.spec.ts` présent · coverage ≥ 80% |
| B3 | Guard / Policy appliqué sur les routes sensibles | `@UseGuards(JwtAuthGuard, PinGuard)` présent |
| B4 | Pas de requête N+1 Prisma | Vérifier via `prisma query` logs en dev |
| B5 | Variables sensibles chiffrées | `config_auth` AES-256-GCM vérifié en DB |
| B6 | Circuit Breaker sur tous les appels SI externes | `cb.execute()` utilisé dans chaque adapter |
| B7 | Rate limiting actif sur routes publiques | `@Throttle()` présent sur auth / public |
| B8 | Migration réversible | `prisma migrate deploy` OK · `prisma migrate reset` OK en staging |

---

## DoD spécifique — Frontend (Vue 3)

| # | Critère | Vérification |
|---|---------|------------|
| F1 | Formulaires validés côté client | VeeValidate / class-validator messages en FR |
| F2 | États de chargement visibles | Skeleton / spinner sur toute requête async |
| F3 | Messages d'erreur exploitables | Pas de "Erreur" brut → message métier FR explicite |
| F4 | Responsive testé | Mobile 375px · Tablet 768px · Desktop 1440px |
| F5 | Zéro erreur console | `page.on('console')` → 0 erreur Playwright |
| F6 | Focus accessible | Tabulation complète · focus visible · ARIA labels |
| F7 | Toast confirmation sur actions réussies | Vert 3s auto-dismiss |
| F8 | Bouton Soumettre désactivé pendant requête | `isSubmitting` state · prevent double-submit |
| F9 | Redirection 401 → login avec conservation données | `localStorage` draft restore après login |

---

## DoD spécifique — Tests E2E (Playwright)

| # | Critère | Vérification |
|---|---------|------------|
| E1 | Test couvre le parcours nominal complet | Début → Fin avec assertions visuelles |
| E2 | Test couvre au moins 1 flux alternatif | Erreur / complément / rejet |
| E3 | Pas de données hardcodées | Seeds fixes · pas de date en dur |
| E4 | Séquentiel (workers=1) | Pas de conflit DB entre tests |
| E5 | Screenshots / video sur échec | Config `screenshot: 'only-on-failure'` |

---

## Checklist de validation finale (avant merge)

```markdown
- [ ] PR review approuvé
- [ ] CI verte (tests + lint + build)
- [ ] Migration DB incluse et testée
- [ ] API Swagger à jour
- [ ] Audit log vérifié (mutation tracée)
- [ ] Pas de credential en dur
- [ ] Pas de console.log
- [ ] Playwright passant (si impact UI)
- [ ] Plane issue → Done
```

---

*Livrable OASE-52 — Definition of Done frontend + backend + tests.*
