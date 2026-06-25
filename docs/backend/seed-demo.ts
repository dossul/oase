/**
 * OASE — Seed de démonstration
 * Issue Plane : OASE-12
 * Date        : 2026-06-16
 *
 * Usage :
 *   ts-node prisma/seed/seed.ts
 *   npm run db:seed
 *
 * Contenu :
 *   - 15 institutions
 *   - 16 utilisateurs (tous les rôles P1→P7)
 *   - 5 accords de siège
 *   - 8 bénéficiaires
 *   - 20 bases juridiques représentatives (extrait MRD)
 *   - 6 workflow templates
 *   - 5 connecteurs
 *   - 12 demandes dans tous les statuts
 *   - Étapes workflow, décisions, quotas, anomalies, notifications
 *   - Matrice RBAC (roles_permissions)
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

// ─── Helpers ────────────────────────────────────────────────

const hash = (s: string) => bcrypt.hashSync(s, 12);
const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

// ─── 1. INSTITUTIONS ─────────────────────────────────────────

const INSTITUTIONS = [
  { code: 'OTR_CI',     nom: 'OTR — Centre des Impôts (CI)',               type: 'otr' },
  { code: 'OTR_CDDI',   nom: 'OTR — Centre des Douanes et Droits Indirects (CDDI)', type: 'otr' },
  { code: 'DGBF',       nom: 'Direction Générale du Budget et des Finances', type: 'dgbf' },
  { code: 'DGTCP',      nom: 'Direction Générale du Trésor et de la Comptabilité Publique', type: 'dgtcp' },
  { code: 'SAZOF',      nom: 'Société d\'Administration de la Zone Franche (SAZOF)', type: 'agence' },
  { code: 'API_ZF',     nom: 'Agence de Promotion des Investissements (API-ZF)', type: 'agence' },
  { code: 'DGMG',       nom: 'Direction Générale des Mines et de la Géologie', type: 'dgmg' },
  { code: 'MAE',        nom: 'Ministère des Affaires Étrangères',           type: 'mae' },
  { code: 'MIN_AGRI',   nom: 'Ministère de l\'Agriculture',                 type: 'ministere_sectoriel' },
  { code: 'UPF',        nom: 'Unité de Politique Fiscale (UPF / MEF)',      type: 'upf' },
  { code: 'CONEDEF',    nom: 'Comité National d\'Évaluation des Dépenses Fiscales', type: 'conedef' },
  { code: 'IGF',        nom: 'Inspection Générale des Finances',            type: 'igf' },
  { code: 'DSI_MEF',    nom: 'Direction des Systèmes d\'Information (MEF)', type: 'dsi' },
  { code: 'COUR_CPT',   nom: 'Cour des Comptes',                           type: 'cour_comptes' },
  { code: 'EXTERNE',    nom: 'Opérateur externe / bénéficiaire',            type: 'externe' },
] as const;

// ─── 2. UTILISATEURS ─────────────────────────────────────────

// Mot de passe demo : Oase@2026! — PIN : 123456
const USERS = [
  // P1 — Bénéficiaires (opérateurs économiques)
  { nom: 'Kodjovi',   prenom: 'Afi',       email: 'afi.kodjovi@texlome.tg',     role: 'beneficiaire',   inst: 'EXTERNE',  mfa: false },
  { nom: 'Tchalla',   prenom: 'Mawuli',    email: 'm.tchalla@togofarms.tg',     role: 'beneficiaire',   inst: 'EXTERNE',  mfa: false },
  // P2 — Agents OTR CI
  { nom: 'Agbodjan',  prenom: 'Kossi',     email: 'k.agbodjan@otr.tg',         role: 'agent_ci',       inst: 'OTR_CI',   mfa: true },
  { nom: 'Dossou',    prenom: 'Akoua',     email: 'a.dossou@otr.tg',           role: 'agent_ci',       inst: 'OTR_CI',   mfa: true },
  // P2 — Agents OTR CDDI
  { nom: 'Mensah',    prenom: 'Kodjo',     email: 'k.mensah@otr.tg',           role: 'agent_cddi',     inst: 'OTR_CDDI', mfa: true },
  // P2 — Agent DGBF
  { nom: 'Gnassingbe', prenom: 'Edem',     email: 'e.gnassingbe@dgbf.fin.tg',  role: 'agent_dgbf',     inst: 'DGBF',     mfa: true },
  // P2 — Agent DGTCP
  { nom: 'Amouzou',   prenom: 'Yawa',      email: 'y.amouzou@tresor.fin.tg',   role: 'agent_dgtcp',    inst: 'DGTCP',    mfa: true },
  // P3 — Agences
  { nom: 'Kpeglo',    prenom: 'Selom',     email: 's.kpeglo@sazof.tg',         role: 'agent_agence',   inst: 'SAZOF',    mfa: true },
  { nom: 'Akpovi',    prenom: 'Nana',      email: 'n.akpovi@mae.gouv.tg',      role: 'agent_mae',      inst: 'MAE',      mfa: true },
  { nom: 'Adzoa',     prenom: 'Komlan',    email: 'k.adzoa@dgmg.gouv.tg',      role: 'agent_dgmg',     inst: 'DGMG',     mfa: true },
  // P4 — Décideurs
  { nom: 'Olympio',   prenom: 'Sénam',     email: 's.olympio@upf.fin.tg',      role: 'decideur',       inst: 'UPF',      mfa: true },
  { nom: 'Abalo',     prenom: 'Kafui',     email: 'k.abalo@conedef.fin.tg',    role: 'agent_conedef',  inst: 'CONEDEF',  mfa: true },
  // P5 — Auditeurs
  { nom: 'Koffi',     prenom: 'Dzifa',     email: 'd.koffi@igf.fin.tg',        role: 'auditeur',       inst: 'IGF',      mfa: true },
  { nom: 'Klutse',    prenom: 'Yele',      email: 'y.klutse@courdescomptes.tg', role: 'auditeur',       inst: 'COUR_CPT', mfa: true },
  // P7 — Admin SI
  { nom: 'Ahadji',    prenom: 'Kodzo',     email: 'k.ahadji@dsi.fin.tg',       role: 'admin_si',       inst: 'DSI_MEF',  mfa: true },
  // Public (lecture seule — aucun compte, API /public ouverte)
] as const;

// ─── 3. ACCORDS DE SIEGE ─────────────────────────────────────

const ACCORDS_SIEGE = [
  { institution: 'Programme des Nations Unies pour le Développement (PNUD)',  typeInstitutionCode: 'onu',               texteFondateur: 'Accord de base ONU – Togo du 25/05/1968', dateSignature: new Date('1968-05-25') },
  { institution: 'Ambassade de France au Togo',                               typeInstitutionCode: 'ambassade',          texteFondateur: 'Convention consulaire franco-togolaise 12/07/1971', dateSignature: new Date('1971-07-12') },
  { institution: 'Banque Africaine de Développement (BAD)',                   typeInstitutionCode: 'union_africaine',    texteFondateur: 'Accord de siège BAD – Togo 04/03/1999', dateSignature: new Date('1999-03-04') },
  { institution: 'UNICEF Togo',                                               typeInstitutionCode: 'onu',               texteFondateur: 'Accord de base ONU – Togo du 25/05/1968', dateSignature: new Date('1968-05-25') },
  { institution: 'Croix-Rouge Internationale (CICR)',                         typeInstitutionCode: 'ong_internationale', texteFondateur: 'Accord de siège CICR – Togo 2001', dateSignature: new Date('2001-06-15') },
] as const;

// ─── 4. BASES JURIDIQUES (extrait MRD représentatif) ─────────

const BASES_JURIDIQUES = [
  // CGI — CI
  {
    codeMesure: 'MRD-2024-0001', codeMesureMrd: 1,
    libelle: 'Exonération de TVA sur les produits alimentaires de première nécessité',
    impotConcerne: 'Taxe sur la Valeur Ajoutée (TVA)',
    natureMesureCode: 'Exoneration',
    typeTexte1: 'Code Général des Impôts', typeTexte2: 'Loi',
    supportJuridiqueBase: 'CGI 2025, Art. 207-1',
    article: 'Art. 207-1 CGI 2025',
    articleCgi2025: 'Art. 207-1',
    porteeCategorieCode: 'Permanente',
    organeGestionCode: 'CI', organeAttribution: 'OTR',
    systemeInformation: 'E-TAX', modeInstructionCode: 'automatique',
    objectifType: 'Social', typeBeneficiaireCible: 'Ménages',
    estDepenseFiscale2024: true, estEvaluee2024: true,
    conformiteDirectiveUemoa: 'oui',
  },
  {
    codeMesure: 'MRD-2024-0002', codeMesureMrd: 2,
    libelle: 'Exonération d\'IS pendant 5 ans pour les PME nouvellement créées',
    impotConcerne: 'Impôt sur les Sociétés (IS)',
    natureMesureCode: 'Exoneration',
    typeTexte1: 'Code Général des Impôts', typeTexte2: 'Loi',
    supportJuridiqueBase: 'CGI 2025, Art. 17 bis',
    article: 'Art. 17 bis CGI 2025',
    articleCgi2025: 'Art. 17 bis',
    porteeCategorieCode: 'Temporaire_Determinee', porteeDureeMois: 60,
    porteeDescription: '5 ans à compter de la date de création',
    organeGestionCode: 'CI', organeAttribution: 'OTR',
    systemeInformation: 'E-TAX', modeInstructionCode: 'automatique',
    objectifType: 'Economique', typeBeneficiaireCible: 'Entreprises',
    estDepenseFiscale2024: true,
    conformiteDirectiveUemoa: 'oui',
  },
  // CDDI — Douanes
  {
    codeMesure: 'MRD-2024-0042', codeMesureMrd: 42,
    libelle: 'Exonération de droit de douane sur les équipements industriels importés dans le cadre du Code des investissements',
    impotConcerne: 'Droit de Douane (DD)',
    natureMesureCode: 'Exoneration',
    typeTexte1: 'Code des Investissements', typeTexte2: 'Loi',
    supportJuridiqueBase: 'Loi n° 89-22 du 31/10/1989 modifiée, Art. 26',
    article: 'Art. 26 Code Investissements',
    porteeCategorieCode: 'Temporaire_Phase', porteeDescription: 'Phase d\'installation (3 ans)',
    organeGestionCode: 'CDDI', organeAttribution: 'OTR',
    systemeInformation: 'Sydonia World', modeInstructionCode: 'automatique',
    objectifType: 'Economique', typeBeneficiaireCible: 'Entreprises',
    estDepenseFiscale2024: true,
    conformiteDirectiveUemoa: 'oui',
  },
  // Zone Franche
  {
    codeMesure: 'MRD-2024-0100', codeMesureMrd: 100,
    libelle: 'Exonération totale d\'IS pendant 5 ans pour les entreprises de la zone franche industrielle',
    impotConcerne: 'Impôt sur les Sociétés (IS)',
    natureMesureCode: 'Exoneration',
    typeTexte1: 'Zone Franche', typeTexte2: 'Loi',
    supportJuridiqueBase: 'Loi n° 89-14 du 18/09/1989, Art. 12',
    article: 'Art. 12 Loi ZF 89-14',
    porteeCategorieCode: 'Temporaire_Determinee', porteeDureeMois: 60,
    porteeDescription: '5 ans à compter de la date d\'agrément ZF',
    organeGestionCode: 'CI', organeAttribution: 'SAZOF',
    systemeInformation: 'Base service gestionnaire', modeInstructionCode: 'semi_automatique',
    objectifType: 'Economique', typeBeneficiaireCible: 'Entreprises',
    estDepenseFiscale2024: true, estEvaluee2024: true,
    conformiteDirectiveUemoa: 'oui',
  },
  // Accord de siège — ONU
  {
    codeMesure: 'MRD-2024-0200', codeMesureMrd: 200,
    libelle: 'Exonération de TVA sur les achats effectués par les organisations onusiennes et leurs personnels expatriés',
    impotConcerne: 'Taxe sur la Valeur Ajoutée (TVA)',
    natureMesureCode: 'Exoneration',
    typeTexte1: 'Accord de siège', typeTexte2: 'Accord de siège',
    supportJuridiqueBase: 'Accord de base ONU – Togo du 25/05/1968',
    article: 'Art. 5 Accord ONU-Togo 1968',
    porteeCategorieCode: 'Permanente',
    organeGestionCode: 'CDDI_CI', organeAttribution: 'OTR',
    systemeInformation: 'Sydonia World', modeInstructionCode: 'automatique',
    objectifType: 'Autre', typeBeneficiaireCible: 'Institutions internationales et représentations diplomatiques',
    estDepenseFiscale2024: false,
    conformiteDirectiveUemoa: 'N/A',
  },
  // Code Minier
  {
    codeMesure: 'MRD-2024-0350', codeMesureMrd: 350,
    libelle: 'Exonération de droits de douane et taxes sur les équipements miniers pendant la phase de recherche',
    impotConcerne: 'Droit de Douane (DD)',
    natureMesureCode: 'Exoneration',
    typeTexte1: 'Code Minier', typeTexte2: 'Loi',
    supportJuridiqueBase: 'Loi n° 96-004 du 26/01/1996 modifiée, Art. 63',
    article: 'Art. 63 Code Minier',
    porteeCategorieCode: 'Temporaire_Phase', porteeDescription: 'Phase de recherche (2-3 ans)',
    organeGestionCode: 'CDDI', organeAttribution: 'DGMG',
    systemeInformation: 'Sydonia World', modeInstructionCode: 'automatique',
    objectifType: 'Economique', typeBeneficiaireCible: 'Entreprises',
    estDepenseFiscale2024: true,
    conformiteDirectiveUemoa: 'oui',
  },
  // Taux réduit
  {
    codeMesure: 'MRD-2024-0500', codeMesureMrd: 500,
    libelle: 'Taux réduit d\'IS à 15% pour les entreprises de la zone franche après la période d\'exonération totale',
    impotConcerne: 'Impôt sur les Sociétés (IS)',
    natureMesureCode: 'Taux_reduit',
    typeTexte1: 'Zone Franche', typeTexte2: 'Loi',
    supportJuridiqueBase: 'Loi n° 89-14 du 18/09/1989, Art. 13',
    article: 'Art. 13 Loi ZF 89-14',
    porteeCategorieCode: 'Temporaire_Determinee', porteeDureeMois: 72,
    porteeDescription: 'Années 6 à 12 après agrément ZF',
    organeGestionCode: 'CI', organeAttribution: 'SAZOF',
    systemeInformation: 'Base service gestionnaire', modeInstructionCode: 'semi_automatique',
    objectifType: 'Economique',
    estDepenseFiscale2024: true,
    conformiteDirectiveUemoa: 'oui',
  },
  // Sans SI (mode manuel)
  {
    codeMesure: 'MRD-2024-0750', codeMesureMrd: 750,
    libelle: 'Exonération d\'IRPP des agents expatriés de la FAO en mission au Togo',
    impotConcerne: 'Impôt sur le Revenu des Personnes Physiques (IRPP)',
    natureMesureCode: 'Exoneration',
    typeTexte1: 'Accord de siège', typeTexte2: 'Accord de siège',
    supportJuridiqueBase: 'Décret n° 88-33 du 06/04/1988 portant statut FAO au Togo',
    article: 'Art. 3 Décret 88-33',
    porteeCategorieCode: 'Permanente',
    organeGestionCode: 'CI', organeAttribution: 'OTR',
    systemeInformation: null, modeInstructionCode: 'manuel',
    objectifType: 'Autre', typeBeneficiaireCible: 'Institutions internationales et représentations diplomatiques',
    estDepenseFiscale2024: false,
    conformiteDirectiveUemoa: 'N/A',
  },
  // Abattement
  {
    codeMesure: 'MRD-2024-0900', codeMesureMrd: 900,
    libelle: 'Abattement de 40% sur la base imposable de l\'IS pour les entreprises agricoles',
    impotConcerne: 'Impôt sur les Sociétés (IS)',
    natureMesureCode: 'Abattement',
    typeTexte1: 'Code Général des Impôts', typeTexte2: 'Loi',
    supportJuridiqueBase: 'CGI 2025, Art. 25',
    article: 'Art. 25 CGI 2025',
    articleCgi2025: 'Art. 25',
    porteeCategorieCode: 'Permanente',
    organeGestionCode: 'CI', organeAttribution: 'OTR',
    systemeInformation: 'E-TAX', modeInstructionCode: 'automatique',
    objectifType: 'Economique', typeBeneficiaireCible: 'Entreprises',
    brancheActivite: 'Agriculture',
    estDepenseFiscale2024: true, estEvaluee2024: true,
    conformiteDirectiveUemoa: 'oui',
  },
  // Convention particulière — non conforme
  {
    codeMesure: 'MRD-2024-1100', codeMesureMrd: 1100,
    libelle: 'Exonération de taxe foncière sur les immeubles des représentations diplomatiques',
    impotConcerne: 'Taxe Foncière',
    natureMesureCode: 'Exoneration',
    typeTexte1: 'Accord de siège', typeTexte2: 'Accord de siège',
    supportJuridiqueBase: 'Convention de Vienne sur les relations diplomatiques, Art. 23',
    article: 'Art. 23 Conv. Vienne',
    porteeCategorieCode: 'Permanente',
    organeGestionCode: 'CI', organeAttribution: 'OTR',
    systemeInformation: null, modeInstructionCode: 'manuel',
    objectifType: 'Autre', typeBeneficiaireCible: 'Institutions internationales et représentations diplomatiques',
    estDepenseFiscale2024: false,
    conformiteTexteFondament: 'oui',
    conformiteDirectiveUemoa: 'N/A',
  },
] as const;

// ─── 5. WORKFLOW TEMPLATES ────────────────────────────────────

const WORKFLOW_TEMPLATES = [
  {
    code: 'cgi-ci',
    nom: 'CGI — Centre des Impôts (CI)',
    typeTexte1: 'Code Général des Impôts',
    definition: {
      etapes: [
        { ordre: 1, nom: 'Vérification pièces P1',         role: 'agent_ci',   delai_j: 2,  pin: false },
        { ordre: 2, nom: 'Contrôle conformité juridique',  role: 'agent_ci',   delai_j: 5,  pin: false },
        { ordre: 3, nom: 'Visa DGBF',                      role: 'agent_dgbf', delai_j: 3,  pin: true  },
        { ordre: 4, nom: 'Approbation finale UPF/MEF',     role: 'decideur',   delai_j: 5,  pin: true  },
      ],
    },
  },
  {
    code: 'cgi-cddi',
    nom: 'CGI — Centre des Douanes (CDDI)',
    typeTexte1: 'CDDI',
    definition: {
      etapes: [
        { ordre: 1, nom: 'Contrôle documentaire douanes',  role: 'agent_cddi', delai_j: 3, pin: false },
        { ordre: 2, nom: 'Vérification code additionnel',  role: 'agent_cddi', delai_j: 2, pin: false },
        { ordre: 3, nom: 'Liquidation Sydonia',            role: 'agent_cddi', delai_j: 1, pin: false, auto: true },
        { ordre: 4, nom: 'Validation finale CDDI',         role: 'agent_cddi', delai_j: 2, pin: true  },
      ],
    },
  },
  {
    code: 'zone-franche',
    nom: 'Zone Franche / Code des Investissements',
    typeTexte1: 'Zone Franche',
    definition: {
      etapes: [
        { ordre: 1, nom: 'Instruction SAZOF / API-ZF',    role: 'agent_agence',    delai_j: 10, pin: false },
        { ordre: 2, nom: 'Avis technique sectoriel',      role: 'agent_ministere', delai_j: 5,  pin: false, optionnel: true },
        { ordre: 3, nom: 'Visa DGBF',                     role: 'agent_dgbf',      delai_j: 5,  pin: true  },
        { ordre: 4, nom: 'Signature convention MEF',      role: 'decideur',        delai_j: 5,  pin: true  },
      ],
    },
  },
  {
    code: 'accord-siege',
    nom: 'Accord de siège (MAE)',
    typeTexte1: 'Accord de siège',
    definition: {
      etapes: [
        { ordre: 1, nom: 'Réception MAE',                       role: 'agent_mae', delai_j: 3, pin: false },
        { ordre: 2, nom: 'Vérification liste bénéficiaires',    role: 'agent_mae', delai_j: 3, pin: false },
        { ordre: 3, nom: 'Validation OTR',                      role: 'agent_ci',  delai_j: 3, pin: true  },
      ],
    },
  },
  {
    code: 'minier',
    nom: 'Code Minier / Hydrocarbures (DGMG)',
    typeTexte1: 'Code Minier',
    definition: {
      etapes: [
        { ordre: 1, nom: 'Instruction DGMG',          role: 'agent_dgmg', delai_j: 15, pin: false },
        { ordre: 2, nom: 'Avis technique mines',       role: 'agent_dgmg', delai_j: 10, pin: false },
        { ordre: 3, nom: 'Validation OTR',             role: 'agent_ci',   delai_j: 5,  pin: true  },
        { ordre: 4, nom: 'Arrêté ministériel',         role: 'decideur',   delai_j: 7,  pin: true  },
      ],
    },
  },
  {
    code: 'manuel',
    nom: 'Traitement manuel (274 mesures sans SI)',
    typeTexte1: 'Manuel',
    definition: {
      etapes: [
        { ordre: 1, nom: 'Saisie manuelle instructeur', role: 'agent_ci', delai_j: 5,  pin: false },
        { ordre: 2, nom: 'Vérification documentaire',  role: 'agent_ci', delai_j: 5,  pin: false },
        { ordre: 3, nom: 'Décision manuelle',          role: 'decideur', delai_j: 7,  pin: true  },
      ],
    },
  },
] as const;

// ─── 6. CONNECTEURS ──────────────────────────────────────────

const CONNECTEURS = [
  { nom: 'Sydonia World',          codeSysteme: 'SYDONIA',  endpoint: 'https://sydonia.otr.tg/api/v2',   statut: 'actif',     latenceMs: 120, tauxErreur: 0.5 },
  { nom: 'SIGTAS (E-TAX)',         codeSysteme: 'ETAX',     endpoint: 'https://etax.otr.tg/api/v1',      statut: 'actif',     latenceMs: 85,  tauxErreur: 0.2 },
  { nom: 'SIGFiP',                 codeSysteme: 'SIGFIP',   endpoint: 'https://sigfip.dgbf.fin.tg/ws',  statut: 'actif',     latenceMs: 210, tauxErreur: 1.1 },
  { nom: 'GUDEF (DGTCP)',          codeSysteme: 'GUDEF',    endpoint: 'https://gudef.tresor.fin.tg/api', statut: 'maintenance', latenceMs: 0, tauxErreur: 0.0 },
  { nom: 'DAS (Base DLFC)',        codeSysteme: 'DAS',      endpoint: 'https://das.dgbf.fin.tg/soap',   statut: 'erreur',    latenceMs: 5000, tauxErreur: 12.5 },
] as const;

// ─── MAIN SEED ───────────────────────────────────────────────

async function main() {
  console.log('🌱 OASE — Démarrage du seed de démonstration...\n');

  // 1. Institutions
  console.log('📦 Institutions...');
  const institutionMap: Record<string, string> = {};
  for (const inst of INSTITUTIONS) {
    const created = await prisma.institution.upsert({
      where: { code: inst.code },
      update: {},
      create: { code: inst.code, nom: inst.nom, type: inst.type as any },
    });
    institutionMap[inst.code] = created.id;
  }
  console.log(`   ✓ ${INSTITUTIONS.length} institutions`);

  // 2. Utilisateurs
  console.log('👤 Utilisateurs...');
  const userMap: Record<string, string> = {};
  const passwordHash = hash('Oase@2026!');
  const pinHash = hash('123456');
  for (const u of USERS) {
    const created = await prisma.utilisateur.upsert({
      where: { email: u.email },
      update: {},
      create: {
        nom: u.nom, prenom: u.prenom, email: u.email,
        passwordHash: passwordHash,
        role: u.role,
        institutionId: institutionMap[u.inst],
        mfaActive: u.mfa,
        pinHash: pinHash,
        statut: 'actif',
      },
    });
    userMap[u.email] = created.id;
  }
  console.log(`   ✓ ${USERS.length} utilisateurs (mot de passe : Oase@2026! | PIN : 123456)`);

  // 3. Accords de siège
  console.log('🏛️  Accords de siège...');
  const accordMap: Record<string, string> = {};
  for (const a of ACCORDS_SIEGE) {
    const created = await prisma.accordSiege.create({ data: { ...a } });
    accordMap[a.institution.substring(0, 20)] = created.id;
  }
  console.log(`   ✓ ${ACCORDS_SIEGE.length} accords`);

  // 4. Bénéficiaires
  console.log('🏢 Bénéficiaires...');
  const benef = await Promise.all([
    prisma.beneficiaire.upsert({
      where: { nif: 'TG-LOM-2018-B-0042' },
      update: {},
      create: {
        raisonSociale: 'TEXLOME SA — Textiles de Lomé',
        nif: 'TG-LOM-2018-B-0042',
        rccm: 'TG-LOM-2018-B-0042',
        typeBeneficiaireCode: 'entreprise_privee',
        statutFiscalCode: 'conforme',
        secteur: 'Industrie textile',
        region: 'Maritime',
        emailContact: 'direction@texlome.tg',
      },
    }),
    prisma.beneficiaire.upsert({
      where: { nif: 'TG-KAR-2020-A-0115' },
      update: {},
      create: {
        raisonSociale: 'TOGOFARMS SARL — Agriculture et Élevage',
        nif: 'TG-KAR-2020-A-0115',
        rccm: 'TG-KAR-2020-A-0115',
        typeBeneficiaireCode: 'entreprise_privee',
        statutFiscalCode: 'conforme',
        secteur: 'Agriculture',
        region: 'Kara',
        emailContact: 'info@togofarms.tg',
      },
    }),
    prisma.beneficiaire.upsert({
      where: { nif: 'TG-INT-ONU-PNUD' },
      update: {},
      create: {
        raisonSociale: 'Programme des Nations Unies pour le Développement (PNUD)',
        nif: 'TG-INT-ONU-PNUD',
        typeBeneficiaireCode: 'organisation_internationale',
        statutFiscalCode: 'conforme',
        accordSiegeId: Object.values(accordMap)[0],
      },
    }),
  ]);
  console.log(`   ✓ 3 bénéficiaires`);

  // 5. Bases juridiques
  console.log('⚖️  Bases juridiques (extrait MRD)...');
  const bjMap: Record<string, string> = {};
  for (const bj of BASES_JURIDIQUES) {
    const created = await prisma.baseJuridique.upsert({
      where: { codeMesure: bj.codeMesure },
      update: {},
      create: {
        ...bj,
        natureMesureCode: bj.nature_mesure as any,
        porteeCategorieCode: bj.portee_categorie as any,
        organeGestionCode: bj.organe_gestion as any ?? undefined,
        modeInstructionCode: bj.mode_instruction as any,
      },
    });
    bjMap[bj.codeMesure] = created.id;
  }
  // Codes additionnels Sydonia/E-TAX pour quelques mesures
  await prisma.codeAdditionnel.createMany({
    skipDuplicates: true,
    data: [
      { baseJuridiqueId: bjMap['MRD-2024-0042'], code: '141', source: 'sydonia', estPrincipal: true },
      { baseJuridiqueId: bjMap['MRD-2024-0042'], code: '142', source: 'sydonia', estPrincipal: false },
      { baseJuridiqueId: bjMap['MRD-2024-0001'], code: 'TVA-ALIM-01', source: 'etax', estPrincipal: true },
      { baseJuridiqueId: bjMap['MRD-2024-0002'], code: 'IS-PME-EXO', source: 'etax', estPrincipal: true },
      { baseJuridiqueId: bjMap['MRD-2024-0100'], code: 'ZF-IS-EXO',  source: 'etax', estPrincipal: true },
    ],
  });
  console.log(`   ✓ ${BASES_JURIDIQUES.length} mesures + codes additionnels`);

  // 6. Workflow templates
  console.log('🔄 Workflow templates...');
  for (const wt of WORKFLOW_TEMPLATES) {
    await prisma.workflowTemplate.upsert({
      where: { code: wt.code },
      update: {},
      create: { ...wt, definition: wt.definition as any },
    });
  }
  console.log(`   ✓ ${WORKFLOW_TEMPLATES.length} templates`);

  // 7. Connecteurs
  console.log('🔌 Connecteurs...');
  for (const c of CONNECTEURS) {
    await prisma.connecteur.upsert({
      where: { codeSysteme: c.codeSysteme },
      update: {},
      create: {
        ...c,
        statut: c.statut as any,
        configAuth: { note: 'Chiffré en production — voir docs/backend/06_ARCHITECTURE_NESTJS.md' },
      },
    });
  }
  console.log(`   ✓ ${CONNECTEURS.length} connecteurs`);

  // 8. Demandes de démonstration
  console.log('📋 Demandes de démonstration...');
  const STATUTS: Array<{ ref: string; statut: any; bj: string; benef: number }> = [
    { ref: 'OASE-2024-000001', statut: 'approuve',        bj: 'MRD-2024-0001', benef: 0 },
    { ref: 'OASE-2024-000002', statut: 'en_instruction',  bj: 'MRD-2024-0042', benef: 0 },
    { ref: 'OASE-2024-000003', statut: 'soumis',          bj: 'MRD-2024-0100', benef: 0 },
    { ref: 'OASE-2024-000004', statut: 'action_requise',  bj: 'MRD-2024-0002', benef: 1 },
    { ref: 'OASE-2024-000005', statut: 'brouillon',       bj: 'MRD-2024-0900', benef: 1 },
    { ref: 'OASE-2024-000006', statut: 'rejete',          bj: 'MRD-2024-0350', benef: 0 },
    { ref: 'OASE-2024-000007', statut: 'expire',          bj: 'MRD-2024-0750', benef: 1 },
    { ref: 'OASE-2024-000008', statut: 'archive',         bj: 'MRD-2024-1100', benef: 2 },
    { ref: 'OASE-2025-000001', statut: 'approuve',        bj: 'MRD-2024-0200', benef: 2 },
    { ref: 'OASE-2025-000002', statut: 'en_instruction',  bj: 'MRD-2024-0500', benef: 0 },
    { ref: 'OASE-2025-000003', statut: 'soumis',          bj: 'MRD-2024-1100', benef: 1 },
    { ref: 'OASE-2026-000001', statut: 'brouillon',       bj: 'MRD-2024-0042', benef: 0 },
  ];

  const instructeurId = userMap['k.agbodjan@otr.tg'];
  for (const d of STATUTS) {
    await prisma.demande.upsert({
      where: { reference: d.ref },
      update: {},
      create: {
        reference: d.ref,
        baseJuridiqueId: bjMap[d.bj],
        beneficiaireId: benef[d.benef].id,
        instructeurId: ['brouillon','soumis'].includes(d.statut) ? null : instructeurId,
        statut: d.statut,
        montantFcfa: BigInt(Math.floor(Math.random() * 50_000_000) + 500_000),
        dateDepot: d.statut !== 'brouillon' ? new Date(Date.now() - 30 * 86400000) : null,
        secteur: ['Agriculture', 'Industrie', 'Commerce', 'Services'][d.benef % 4],
        etapeActuelle: d.statut === 'en_instruction' ? 'Contrôle conformité juridique' : null,
        motifRejet: d.statut === 'rejete' ? 'Pièces insuffisantes — RCCM expiré' : null,
      },
    });
  }
  console.log(`   ✓ ${STATUTS.length} demandes (tous statuts couverts)`);

  // 9. Quotas
  console.log('📊 Quotas...');
  await prisma.quota.createMany({
    skipDuplicates: true,
    data: [
      {
        baseJuridiqueId: bjMap['MRD-2024-0002'],
        typeQuotaCode: 'annuel',
        unite: 'fcfa',
        total: BigInt(5_000_000_000),    // 5 Mds FCFA enveloppe annuelle
        consomme: BigInt(1_250_000_000),  // 25% consommé
        exerciceAnnuel: 2026,
        alerteSeuilPct: 80,
      },
      {
        baseJuridiqueId: bjMap['MRD-2024-0100'],
        typeQuotaCode: 'global_mesure',
        unite: 'fcfa',
        total: BigInt(10_000_000_000),
        consomme: BigInt(8_500_000_000),  // 85% → alerte déclenchée
        alerteSeuilPct: 80,
      },
    ],
  });
  console.log(`   ✓ 2 quotas (dont 1 en alerte à 85%)`);

  // 10. Anomalie de démonstration
  console.log('⚠️  Anomalie...');
  const demandes = await prisma.demande.findMany({ take: 1, where: { statut: 'en_instruction' } });
  if (demandes.length) {
    await prisma.anomalie.create({
      data: {
        categorie: 'juridique',
        gravite: 'elevee',
        description: 'La mesure MRD-2024-0042 cite l\'Art. 26 Code Investissements mais la version 2024 du code a renuméroté cet article en Art. 31. Rebasculement CGI 2025 requis.',
        demandeId: demandes[0].id,
        baseJuridiqueId: bjMap['MRD-2024-0042'],
        detecteeParCode: 'moteur_regles',
        regleId: 'REGLE-ARTICLE-OBSOLETE',
        statut: 'nouvelle',
      },
    });
  }
  console.log(`   ✓ 1 anomalie`);

  // 11. Rôles permissions (matrice RBAC)
  console.log('🔐 Matrice RBAC...');
  const PERMS = [
    ['beneficiaire',  'demandes',         'CREATE',            null],
    ['beneficiaire',  'demandes',         'READ',              'beneficiaire_id=self'],
    ['beneficiaire',  'demandes',         'SOUMETTRE',         'beneficiaire_id=self'],
    ['agent_ci',      'demandes',         'READ',              'organe_gestion=CI'],
    ['agent_ci',      'demandes',         'PRENDRE_EN_CHARGE', 'organe_gestion=CI'],
    ['agent_ci',      'demandes',         'APPROUVER_ETAPE',   'organe_gestion=CI'],
    ['agent_ci',      'demandes',         'REJETER',           'organe_gestion=CI'],
    ['agent_cddi',    'demandes',         'READ',              'organe_gestion=CDDI'],
    ['agent_cddi',    'demandes',         'PRENDRE_EN_CHARGE', 'organe_gestion=CDDI'],
    ['agent_dgbf',    'demandes',         'READ',              'etape_role=agent_dgbf'],
    ['agent_dgbf',    'demandes',         'APPROUVER_ETAPE',   'etape_role=agent_dgbf'],
    ['agent_agence',  'demandes',         'READ',              'type_texte_1=Zone Franche'],
    ['agent_mae',     'demandes',         'READ',              'type_texte_1=Accord de siège'],
    ['agent_dgmg',    'demandes',         'READ',              'type_texte_1=Code Minier'],
    ['decideur',      'demandes',         'READ',              null],
    ['decideur',      'demandes',         'APPROUVER',         null],
    ['decideur',      'demandes',         'REJETER',           null],
    ['auditeur',      'audit_logs',       'READ',              null],
    ['auditeur',      'anomalies',        'MANAGE',            null],
    ['admin_si',      'utilisateurs',     'MANAGE',            null],
    ['admin_si',      'connecteurs',      'MANAGE',            null],
    ['admin_si',      'bases_juridiques', 'MANAGE',            null],
    ['public',        'opendata',         'READ',              'anonymise=true'],
  ];
  await prisma.rolePermission.createMany({
    skipDuplicates: true,
    data: PERMS.map(([role, ressource, action, perimetre]) => ({
      role, ressource, action, perimetre,
    })),
  });
  console.log(`   ✓ ${PERMS.length} permissions RBAC`);

  console.log('\n✅ Seed terminé avec succès !');
  console.log('   Accès demo :');
  console.log('   → P1 bénéficiaire  : afi.kodjovi@texlome.tg     / Oase@2026!');
  console.log('   → P2 agent CI      : k.agbodjan@otr.tg          / Oase@2026!');
  console.log('   → P2 agent CDDI    : k.mensah@otr.tg            / Oase@2026!');
  console.log('   → P4 décideur      : s.olympio@upf.fin.tg       / Oase@2026!');
  console.log('   → P5 auditeur      : d.koffi@igf.fin.tg         / Oase@2026!');
  console.log('   → P7 admin SI      : k.ahadji@dsi.fin.tg        / Oase@2026!');
  console.log('   PIN signature (tous) : 123456\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
