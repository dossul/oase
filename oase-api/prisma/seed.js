/**
 * OASE — Seed démo v4.0 (Togo)
 *
 * Peuple la base MySQL avec :
 * - 15 rôles canoniques
 * - 4 institutions (UPF, DGBF, OTR, Ministère Industrie)
 * - 15 utilisateurs (1 par rôle, emails gouv.tg)
 * - 5 bases juridiques avec version active (SCD2)
 * - 4 bénéficiaires (entreprises togolaises)
 * - 6 demandes
 *
 * Le script est idempotent (UUID fixes + upsert SQL).
 * Usage : node prisma/seed.js
 *
 * Date : 2026-07-10
 * Cible : MEF Togo (Ministère de l'Economie et des Finances)
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const DATABASE_URL = process.env.DATABASE_URL || 'mysql://root:@localhost:3306/oase';
const DEFAULT_PASSWORD = 'Oase@2026!';
const dbUrl = new URL(DATABASE_URL);

// ============================================================
// UUIDS (deterministes pour idempotence)
// ============================================================
const U = {
  // Utilisateurs (1 par role, 15 total)
  admin:           'a0000001-0000-0000-0000-000000000001',
  agent_cddi:      'a0000002-0000-0000-0000-000000000002',
  agent_ci:        'a0000003-0000-0000-0000-000000000003',
  agent_dgbf:      'a0000004-0000-0000-0000-000000000004',
  agent_dgtcp:     'a0000005-0000-0000-0000-000000000005',
  agent_ministere: 'a0000006-0000-0000-0000-000000000006',
  agent_agence:    'a0000007-0000-0000-0000-000000000007',
  agent_otr:       'a0000008-0000-0000-0000-000000000008',
  receveur:        'a0000009-0000-0000-0000-000000000009',
  instructeur:     'a000000a-0000-0000-0000-00000000000a',
  validateur:      'a000000b-0000-0000-0000-00000000000b',
  controleur:      'a000000c-0000-0000-0000-00000000000c',
  beneficiaire:    'a000000d-0000-0000-0000-00000000000d',
  visiteur:        'a000000e-0000-0000-0000-00000000000e',
  system:          'a000000f-0000-0000-0000-00000000000f',

  // Bases juridiques
  bjExoGenerale:   'b0000001-0000-0000-0000-000000000001',
  bjZFI:           'b0000002-0000-0000-0000-000000000002',
  bjCodeInvest:    'b0000003-0000-0000-0000-000000000003',
  bjTauxReduit:    'b0000004-0000-0000-0000-000000000004',
  bjCreditImpot:   'b0000005-0000-0000-0000-000000000005',

  // Versions
  bjvExoGenerale:  'b1000001-0000-0000-0000-000000000001',
  bjvZFI:          'b1000002-0000-0000-0000-000000000002',
  bjvCodeInvest:   'b1000003-0000-0000-0000-000000000003',
  bjvTauxReduit:   'b1000004-0000-0000-0000-000000000004',
  bjvCreditImpot:  'b1000005-0000-0000-0000-000000000005',

  // Bénéficiaires
  benefA: 'c0000001-0000-0000-0000-000000000001',
  benefB: 'c0000002-0000-0000-0000-000000000002',
  benefC: 'c0000003-0000-0000-0000-000000000003',
  benefD: 'c0000004-0000-0000-0000-000000000004',

  // Demandes
  demA: 'd0000001-0000-0000-0000-000000000001',
  demB: 'd0000002-0000-0000-0000-000000000002',
  demC: 'd0000003-0000-0000-0000-000000000003',
  demD: 'd0000004-0000-0000-0000-000000000004',
  demE: 'd0000005-0000-0000-0000-000000000005',
  demF: 'd0000006-0000-0000-0000-000000000006',
};

// ============================================================
// ROLES (15)
// ============================================================
const ROLES = [
  { code: 'admin',            libelle: 'Administrateur système',         description: 'Configuration, supervision, accès complet' },
  { code: 'agent_cddi',       libelle: 'Agent CDDI',                    description: 'Instruction et validation des dossiers CDDI' },
  { code: 'agent_ci',         libelle: 'Agent Cellule Impact',          description: 'Évaluation de l\'impact des exonérations' },
  { code: 'agent_dgbf',       libelle: 'Agent DGBF',                    description: 'Contrôle budgétaire et financier' },
  { code: 'agent_dgtcp',      libelle: 'Agent DGTCP',                   description: 'Contrôle des dépenses publiques' },
  { code: 'agent_ministere',  libelle: 'Agent Ministère sectoriel',     description: 'Validation technique sectorielle' },
  { code: 'agent_agence',     libelle: 'Agent Agence de promotion',     description: 'Accompagnement des investisseurs' },
  { code: 'agent_otr',        libelle: 'Agent OTR',                     description: 'Traitement des demandes liées à l\'OTR' },
  { code: 'receveur',         libelle: 'Receveur',                      description: 'Enregistrement et suivi des paiements' },
  { code: 'instructeur',      libelle: 'Instructeur',                   description: 'Instruction des demandes' },
  { code: 'validateur',       libelle: 'Validateur',                    description: 'Validation finale des décisions' },
  { code: 'controleur',       libelle: 'Contrôleur',                    description: 'Audits et contrôles' },
  { code: 'beneficiaire',     libelle: 'Bénéficiaire',                  description: 'Dépôt et suivi des demandes' },
  { code: 'visiteur',         libelle: 'Visiteur',                      description: 'Accès lecture restreint' },
  { code: 'system',           libelle: 'Compte système',                description: 'Compte technique pour imports et jobs' },
];

// ============================================================
// INSTITUTIONS (4, toutes Ministère de l'Economie et des Finances - Togo)
// ============================================================
const I = {
  mef:    'inst-001',
  upf:    'inst-002',
  dgbf:   'inst-003',
  dgtcp:  'inst-004',
  otr:    'inst-005',
  minef:  'inst-006',  // Ministère de l'Industrie (sectoriel)
};

const INSTITUTIONS = [
  { id: I.mef,    code: 'MEF',    nom: 'Ministère de l\'Économie et des Finances',  typeCode: 'ministere', estActive: true },
  { id: I.upf,    code: 'UPF',    nom: 'Unité de Politique Fiscale',                  typeCode: 'ministere', estActive: true },
  { id: I.dgbf,   code: 'DGBF',   nom: 'Direction Générale du Budget et des Finances', typeCode: 'ministere', estActive: true },
  { id: I.dgtcp,  code: 'DGTCP',  nom: 'Direction Générale du Trésor et de la Comptabilité Publique', typeCode: 'ministere', estActive: true },
  { id: I.otr,    code: 'OTR',    nom: 'Office Togolais des Recettes',                 typeCode: 'agence',     estActive: true },
  { id: I.minef,  code: 'MINEF',  nom: 'Ministère de l\'Industrie (sectoriel)',         typeCode: 'ministere', estActive: true },
];

// ============================================================
// USERS (15 - 1 par role, emails gouv.tg)
// Mot de passe unique : Oase@2026!
// ============================================================
const USERS = [
  // Admin
  { id: U.admin,            nom: 'DOE',        prenom: 'Admin',         email: 'admin@gouv.tg',            role: 'admin',            institutionId: I.mef,    secteurAffecte: null },

  // Agents
  { id: U.agent_cddi,       nom: 'KOSSOU',     prenom: 'Kossou',        email: 'agent.cddi@gouv.tg',       role: 'agent_cddi',       institutionId: I.upf,    secteurAffecte: 'cddi' },
  { id: U.agent_ci,         nom: 'ADJOVI',     prenom: 'Marie',         email: 'agent.ci@gouv.tg',         role: 'agent_ci',         institutionId: I.upf,    secteurAffecte: 'ci' },
  { id: U.agent_dgbf,       nom: 'TETE',       prenom: 'Koami',         email: 'agent.dgbf@gouv.tg',       role: 'agent_dgbf',       institutionId: I.dgbf,   secteurAffecte: 'budget' },
  { id: U.agent_dgtcp,      nom: 'KUDAWU',     prenom: 'Akossiwa',      email: 'agent.dgtcp@gouv.tg',      role: 'agent_dgtcp',      institutionId: I.dgtcp,  secteurAffecte: 'tresor' },
  { id: U.agent_ministere,  nom: 'AMEWU',      prenom: 'Kokou',         email: 'agent.ministere@gouv.tg',  role: 'agent_ministere',  institutionId: I.minef,  secteurAffecte: 'industrie' },
  { id: U.agent_agence,     nom: 'AKAKPO',     prenom: 'Afi',           email: 'agent.agence@gouv.tg',     role: 'agent_agence',     institutionId: I.otr,    secteurAffecte: 'otr' },
  { id: U.agent_otr,        nom: 'DOGBE',      prenom: 'Yawa',          email: 'agent.otr@gouv.tg',        role: 'agent_otr',        institutionId: I.otr,    secteurAffecte: 'otr' },

  // Receveur + instructeur + validateur + controleur
  { id: U.receveur,         nom: 'AGBESSI',    prenom: 'Komla',         email: 'receveur@gouv.tg',         role: 'receveur',         institutionId: I.dgtcp,  secteurAffecte: null },
  { id: U.instructeur,      nom: 'AMEGNIKA',   prenom: 'Kossi',         email: 'instructeur@gouv.tg',      role: 'instructeur',      institutionId: I.dgbf,   secteurAffecte: null },
  { id: U.validateur,       nom: 'AKAKPO',     prenom: 'Yawa',          email: 'validateur@gouv.tg',       role: 'validateur',       institutionId: I.mef,    secteurAffecte: null },
  { id: U.controleur,       nom: 'KPETO',      prenom: 'Mawuena',       email: 'controleur@gouv.tg',       role: 'controleur',       institutionId: I.mef,    secteurAffecte: null },

  // Beneficiaire (compte utilisateur pour le beneficiaire)
  { id: U.beneficiaire,     nom: 'N\'GUESSAN', prenom: 'Kossiwa',       email: 'beneficiaire@gouv.tg',     role: 'beneficiaire',     institutionId: I.mef,    secteurAffecte: null },

  // Visiteur + system
  { id: U.visiteur,         nom: 'Public',      prenom: 'Visiteur',      email: 'visiteur@gouv.tg',         role: 'visiteur',         institutionId: I.mef,    secteurAffecte: null },
  { id: U.system,           nom: 'Bot',         prenom: 'Systeme',       email: 'system@gouv.tg',           role: 'system',           institutionId: I.mef,    secteurAffecte: null },
];

// ============================================================
// BASES JURIDIQUES (5)
// ============================================================
const BASES_JURIDIQUES = [
  { id: U.bjExoGenerale,  codeMesure: 'EXO_GEN',   codeMesureMrd: 1 },
  { id: U.bjZFI,          codeMesure: 'ZFI',       codeMesureMrd: 2 },
  { id: U.bjCodeInvest,   codeMesure: 'CODE_INV',  codeMesureMrd: 3 },
  { id: U.bjTauxReduit,   codeMesure: 'TX_REDUIT', codeMesureMrd: 4 },
  { id: U.bjCreditImpot,  codeMesure: 'CRED_IMP',  codeMesureMrd: 5 },
];

// ============================================================
// VERSIONS (SCD2)
// ============================================================
const VERSIONS = [
  {
    id: U.bjvExoGenerale,
    baseJuridiqueId: U.bjExoGenerale,
    version: 1,
    libelle: 'Exonération générale des bénéfices réinvestis',
    impotConcerne: 'IS',
    natureMesureCode: 'Exoneration',
    porteeCategorieCode: 'Permanente',
    modeInstructionCode: 'manuel',
    organeGestionCode: 'CI',
  },
  {
    id: U.bjvZFI,
    baseJuridiqueId: U.bjZFI,
    version: 1,
    libelle: 'Zone Franche Industrielle',
    impotConcerne: 'IS',
    natureMesureCode: 'Exoneration',
    porteeCategorieCode: 'Temporaire_Determinee',
    modeInstructionCode: 'semi_automatique',
    organeGestionCode: 'CDDI',
  },
  {
    id: U.bjvCodeInvest,
    baseJuridiqueId: U.bjCodeInvest,
    version: 1,
    libelle: 'Code des investissements du Togo',
    impotConcerne: 'IS',
    natureMesureCode: 'Reduction_impot',
    porteeCategorieCode: 'Temporaire_Phase',
    modeInstructionCode: 'semi_automatique',
    organeGestionCode: 'CDDI_CI',
  },
  {
    id: U.bjvTauxReduit,
    baseJuridiqueId: U.bjTauxReduit,
    version: 1,
    libelle: 'Taux réduit d\'imposition',
    impotConcerne: 'IR',
    natureMesureCode: 'Taux_reduit',
    porteeCategorieCode: 'Permanente',
    modeInstructionCode: 'manuel',
    organeGestionCode: 'CI',
  },
  {
    id: U.bjvCreditImpot,
    baseJuridiqueId: U.bjCreditImpot,
    version: 1,
    libelle: 'Crédit d\'impôt à l\'investissement',
    impotConcerne: 'IR',
    natureMesureCode: 'Credit_impot',
    porteeCategorieCode: 'Permanente',
    modeInstructionCode: 'manuel',
    organeGestionCode: 'CI',
  },
];

// ============================================================
// BENEFICIAIRES (4, entreprises togolaises)
// ============================================================
const BENEFICIAIRES = [
  {
    id: U.benefA,
    raisonSociale: 'Société Cotonnière du Togo (SCT)',
    nif: 'TG-0001',
    typeBeneficiaireCode: 'entreprise_privee',
    statutFiscalCode: 'conforme',
    secteur: 'agriculture',
    region: 'savanes',
    emailContact: 'contact@sct.tg',
  },
  {
    id: U.benefB,
    raisonSociale: 'Industries Chimiques du Togo (ICT)',
    nif: 'TG-0002',
    typeBeneficiaireCode: 'entreprise_privee',
    statutFiscalCode: 'conforme',
    secteur: 'industrie',
    region: 'maritime',
    emailContact: 'contact@ict.tg',
  },
  {
    id: U.benefC,
    raisonSociale: 'Agro Export Togo SA',
    nif: 'TG-0003',
    typeBeneficiaireCode: 'entreprise_privee',
    statutFiscalCode: 'conforme',
    secteur: 'agriculture',
    region: 'plateaux',
    emailContact: 'contact@agroexport.tg',
  },
  {
    id: U.benefD,
    raisonSociale: 'Togo Telecom SA',
    nif: 'TG-0004',
    typeBeneficiaireCode: 'entreprise_privee',
    statutFiscalCode: 'dette_active',
    secteur: 'telecom',
    region: 'maritime',
    emailContact: 'contact@togotelecom.tg',
  },
];

// ============================================================
// MAIN
// ============================================================
async function main() {
  const connection = await mysql.createConnection({
    host: dbUrl.hostname,
    port: parseInt(dbUrl.port || '3306'),
    user: dbUrl.username,
    password: dbUrl.password,
    database: dbUrl.pathname.replace(/^\//, ''),
    multipleStatements: false,
  });

  console.log('--- OASE Seed v4.0 (Togo) ---');
  console.log(`DB: ${dbUrl.hostname}:${dbUrl.port || 3306}/${dbUrl.pathname.replace(/^\//, '')}`);

  // 0. Nettoyage des donnees (pour eviter les conflits d'ID avec anciennes donnees)
  await connection.execute('SET FOREIGN_KEY_CHECKS=0');
  const tablesToClean = [
    'utilisateurs', 'institutions', 'base_juridique_versions', 'bases_juridiques',
    'beneficiaires', 'demandes', 'demande_workflow_etapes', 'demande_workflow_instances',
    'agrement_beneficiaires', 'agrements', 'actes', 'anomalies', 'audit_logs',
    'pieces_jointes', 'decisions', 'conventions', 'attestations',
    'ref_statuts_demande', 'ref_types_beneficiaire', 'ref_statuts_fiscal',
  ];
  for (const t of tablesToClean) {
    try { await connection.execute(`DELETE FROM ${t}`); }
    catch (e) { /* table peut ne pas exister */ }
  }
  await connection.execute('SET FOREIGN_KEY_CHECKS=1');
  console.log('Nettoyage OK');

  // 1. Roles (table ref_roles)
  for (const r of ROLES) {
    await connection.execute(
      `INSERT INTO ref_roles (code, libelle, description, est_actif, created_at)
       VALUES (?, ?, ?, true, NOW())
       ON DUPLICATE KEY UPDATE libelle = VALUES(libelle), description = VALUES(description), est_actif = VALUES(est_actif)`,
      [r.code, r.libelle, r.description]
    );
  }
  console.log(`Roles: ${ROLES.length}`);

  // 2. Ref types d'institution (FK depuis institutions.type_code)
  const refTypesInstitution = [
    ['ministere', 'Ministère', 'Ministère de tutelle'],
    ['agence', 'Agence', 'Agence sous tutelle'],
    ['direction', 'Direction', 'Direction generale ou technique'],
    ['service', 'Service', 'Service administratif'],
  ];
  for (const t of refTypesInstitution) {
    await connection.execute(
      `INSERT INTO ref_types_institution (code, libelle, description, ordre, est_actif, created_at)
       VALUES (?, ?, ?, 0, true, NOW())
       ON DUPLICATE KEY UPDATE libelle = VALUES(libelle), description = VALUES(description), est_actif = VALUES(est_actif)`,
      t
    );
  }
  console.log(`Ref types institution: ${refTypesInstitution.length}`);

  // 3. Statuts demande
  const refStatutsDemande = [
    ['brouillon', 'Brouillon', 'Demande en cours de saisie'],
    ['soumis', 'Soumis', 'Demande soumise'],
    ['en_instruction', 'En instruction', 'Demande en cours d\'instruction'],
    ['approuve', 'Approuvé', 'Demande approuvée'],
    ['rejete', 'Rejeté', 'Demande rejetée'],
  ];
  for (const s of refStatutsDemande) {
    await connection.execute(
      `INSERT INTO ref_statuts_demande (code, libelle, description, est_actif, created_at)
       VALUES (?, ?, ?, true, NOW())
       ON DUPLICATE KEY UPDATE libelle = VALUES(libelle), description = VALUES(description), est_actif = VALUES(est_actif)`,
      s
    );
  }

  // 4. Types beneficiaire
  const refTypesBeneficiaire = [
    ['entreprise_privee', 'Entreprise privée', 'Entreprise du secteur privé'],
    ['ong', 'ONG', 'Organisation non gouvernementale'],
    ['administration', 'Administration', 'Administration publique'],
  ];
  for (const t of refTypesBeneficiaire) {
    await connection.execute(
      `INSERT INTO ref_types_beneficiaire (code, libelle, description, est_actif, created_at)
       VALUES (?, ?, ?, true, NOW())
       ON DUPLICATE KEY UPDATE libelle = VALUES(libelle), description = VALUES(description), est_actif = VALUES(est_actif)`,
      t
    );
  }

  // 5. Statuts fiscal
  const refStatutsFiscal = [
    ['conforme', 'Conforme', 'Situation fiscale conforme'],
    ['dette_active', 'Dette active', 'Dette fiscale active'],
    ['inconnu', 'Inconnu', 'Situation fiscale inconnue'],
  ];
  for (const s of refStatutsFiscal) {
    await connection.execute(
      `INSERT INTO ref_statuts_fiscal (code, libelle, description, est_actif, created_at)
       VALUES (?, ?, ?, true, NOW())
       ON DUPLICATE KEY UPDATE libelle = VALUES(libelle), description = VALUES(description), est_actif = VALUES(est_actif)`,
      s
    );
  }
  console.log(`Ref statuts fiscal: ${refStatutsFiscal.length}`);

  // 3. Institutions
  for (const inst of INSTITUTIONS) {
    await connection.execute(
      `INSERT INTO institutions (id, code, nom, type_code, est_active, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE code = VALUES(code), nom = VALUES(nom), type_code = VALUES(type_code), est_active = VALUES(est_active)`,
      [inst.id, inst.code, inst.nom, inst.typeCode, inst.estActive]
    );
  }
  console.log(`Institutions: ${INSTITUTIONS.length}`);

  // 4. Utilisateurs (15)
  for (const user of USERS) {
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
    await connection.execute(
      `INSERT INTO utilisateurs (id, nom, prenom, email, password_hash, role, institution_id, statut_code, mfa_active, secteur_affecte, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, false, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE
         nom = VALUES(nom),
         prenom = VALUES(prenom),
         password_hash = VALUES(password_hash),
         role = VALUES(role),
         institution_id = VALUES(institution_id),
         statut_code = 'actif',
         mfa_active = false,
         secteur_affecte = VALUES(secteur_affecte)`,
      [user.id, user.nom, user.prenom, user.email, passwordHash, user.role, user.institutionId, 'actif', user.secteurAffecte]
    );
  }
  console.log(`Utilisateurs: ${USERS.length} (mot de passe: ${DEFAULT_PASSWORD}, MFA: desactive)`);

  // 5. Bases juridiques
  for (const bj of BASES_JURIDIQUES) {
    await connection.execute(
      `INSERT INTO bases_juridiques (id, code_mesure, code_mesure_mrd, created_at, updated_at)
       VALUES (?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE code_mesure = VALUES(code_mesure), code_mesure_mrd = VALUES(code_mesure_mrd)`,
      [bj.id, bj.codeMesure, bj.codeMesureMrd]
    );
  }
  console.log(`Bases juridiques: ${BASES_JURIDIQUES.length}`);

  // 6. Versions
  for (const v of VERSIONS) {
    await connection.execute(
      `INSERT INTO base_juridique_versions (id, base_juridique_id, version, libelle, impot_concerne, nature_mesure_code, portee_categorie_code, mode_instruction_code, organe_gestion_code, est_active, valid_from, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, true, NOW(), NOW(), NOW())
       ON DUPLICATE KEY UPDATE libelle = VALUES(libelle), impot_concerne = VALUES(impot_concerne), nature_mesure_code = VALUES(nature_mesure_code), portee_categorie_code = VALUES(portee_categorie_code), mode_instruction_code = VALUES(mode_instruction_code), organe_gestion_code = VALUES(organe_gestion_code)`,
      [v.id, v.baseJuridiqueId, v.version, v.libelle, v.impotConcerne, v.natureMesureCode, v.porteeCategorieCode, v.modeInstructionCode, v.organeGestionCode]
    );
  }
  console.log(`Versions: ${VERSIONS.length}`);

  // 7. Bénéficiaires
  for (const b of BENEFICIAIRES) {
    await connection.execute(
      `INSERT INTO beneficiaires (id, raison_sociale, nif, type_beneficiaire_code, statut_fiscal_code, secteur, region, email_contact, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE raison_sociale = VALUES(raison_sociale), type_beneficiaire_code = VALUES(type_beneficiaire_code), statut_fiscal_code = VALUES(statut_fiscal_code), secteur = VALUES(secteur), region = VALUES(region), email_contact = VALUES(email_contact)`,
      [b.id, b.raisonSociale, b.nif, b.typeBeneficiaireCode, b.statutFiscalCode, b.secteur, b.region, b.emailContact]
    );
  }
  console.log(`Beneficiaires: ${BENEFICIAIRES.length}`);

  console.log('--- Seed termine avec succes ---');
  console.log('');
  console.log('COMPTES DE TEST (mdp: Oase@2026!) :');
  USERS.forEach(u => console.log(`  ${u.role.padEnd(20)} - ${u.email}`));

  await connection.end();
}

main().catch(e => {
  console.error('ERREUR:', e);
  process.exit(1);
});
