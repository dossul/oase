/**
 * OASE — Seed démo v3.3
 * 
 * Peuple la base MySQL avec :
 * - 15 rôles canoniques (upsert)
 * - 2 institutions
 * - 3 utilisateurs (admin, agent CI, agent instructeur)
 * - 5 bases juridiques avec version active (SCD2)
 * - 3 bénéficiaires
 * - 5 demandes
 *
 * Le script est idempotent (UUID fixes + upsert SQL).
 * Usage : node prisma/seed.js
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const DATABASE_URL = process.env.DATABASE_URL || 'mysql://root:@localhost:3306/oase';
const DEFAULT_PASSWORD = 'Oase@2026!';
const dbUrl = new URL(DATABASE_URL);

const UUIDS = {
  // Utilisateurs
  admin: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  agentCI: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  instructeur: 'cccccccc-cccc-cccc-cccc-cccccccccccc',

  // Bases juridiques
  bjExoGenerale: 'b0000000-0000-0000-0000-000000000001',
  bjZFI: 'b0000000-0000-0000-0000-000000000002',
  bjCodeInvest: 'b0000000-0000-0000-0000-000000000003',
  bjTauxReduit: 'b0000000-0000-0000-0000-000000000004',
  bjCreditImpot: 'b0000000-0000-0000-0000-000000000005',

  // Versions
  bjvExoGenerale: 'b1000000-0000-0000-0000-000000000001',
  bjvZFI: 'b1000000-0000-0000-0000-000000000002',
  bjvCodeInvest: 'b1000000-0000-0000-0000-000000000003',
  bjvTauxReduit: 'b1000000-0000-0000-0000-000000000004',
  bjvCreditImpot: 'b1000000-0000-0000-0000-000000000005',

  // Bénéficiaires
  benefA: 'c0000000-0000-0000-0000-000000000001',
  benefB: 'c0000000-0000-0000-0000-000000000002',
  benefC: 'c0000000-0000-0000-0000-000000000003',

  // Demandes
  demA: 'd0000000-0000-0000-0000-000000000001',
  demB: 'd0000000-0000-0000-0000-000000000002',
  demC: 'd0000000-0000-0000-0000-000000000003',
  demD: 'd0000000-0000-0000-0000-000000000004',
  demE: 'd0000000-0000-0000-0000-000000000005',
};

const ROLES = [
  { code: 'admin', libelle: 'Administrateur système', description: 'Configuration, supervision, accès complet' },
  { code: 'agent_cddi', libelle: 'Agent CDDI', description: 'Instruction et validation des dossiers CDDI' },
  { code: 'agent_ci', libelle: 'Agent Cellule Impact', description: 'Évaluation de l\'impact des exonérations' },
  { code: 'agent_dgbf', libelle: 'Agent DGBF', description: 'Contrôle budgétaire et financier' },
  { code: 'agent_dgtcp', libelle: 'Agent DGTCP', description: 'Contrôle des dépenses publiques' },
  { code: 'agent_ministere', libelle: 'Agent Ministère sectoriel', description: 'Validation technique sectorielle' },
  { code: 'agent_agence', libelle: 'Agent Agence d\'promotion', description: 'Accompagnement des investisseurs' },
  { code: 'agent_otr', libelle: 'Agent OTR', description: 'Traitement des demandes liées aux OTR' },
  { code: 'receveur', libelle: 'Receveur', description: 'Enregistrement et suivi des paiements' },
  { code: 'instructeur', libelle: 'Instructeur', description: 'Instruction des demandes' },
  { code: 'validateur', libelle: 'Validateur', description: 'Validation finale des décisions' },
  { code: 'controleur', libelle: 'Contrôleur', description: 'Audits et contrôles' },
  { code: 'beneficiaire', libelle: 'Bénéficiaire', description: 'Dépôt et suivi des demandes' },
  { code: 'visiteur', libelle: 'Visiteur', description: 'Accès lecture restreint' },
  { code: 'system', libelle: 'Compte système', description: 'Compte technique pour imports et jobs' },
];

const INSTITUTION_IDS = {
  upf: 'inst-006',
  dgbf: 'inst-003',
};

const INSTITUTIONS = [
  { id: INSTITUTION_IDS.upf, code: 'UPF', nom: 'Unité de Politique Fiscale', typeCode: 'ministere', estActive: true },
  { id: INSTITUTION_IDS.dgbf, code: 'DGBF', nom: 'Direction Générale du Budget et des Finances', typeCode: 'ministere', estActive: true },
];

const USERS = [
  { id: UUIDS.admin, nom: 'Sy', prenom: 'Admin', email: 'admin@oase.ci', passwordHash: '$2b$10$hash', role: 'admin', institutionId: INSTITUTION_IDS.upf, statutCode: 'actif' },
  { id: UUIDS.agentCI, nom: 'Kouassi', prenom: 'Marie', email: 'agent.ci@oase.ci', passwordHash: '$2b$10$hash', role: 'agent_ci', institutionId: INSTITUTION_IDS.upf, statutCode: 'actif' },
  { id: UUIDS.instructeur, nom: 'Bamba', prenom: 'Kofi', email: 'instructeur@oase.ci', passwordHash: '$2b$10$hash', role: 'instructeur', institutionId: INSTITUTION_IDS.dgbf, statutCode: 'actif' },
];

const BASES_JURIDIQUES = [
  { id: UUIDS.bjExoGenerale, codeMesure: 'EXO_GEN', codeMesureMrd: 1 },
  { id: UUIDS.bjZFI, codeMesure: 'ZFI', codeMesureMrd: 2 },
  { id: UUIDS.bjCodeInvest, codeMesure: 'CODE_INV', codeMesureMrd: 3 },
  { id: UUIDS.bjTauxReduit, codeMesure: 'TX_REDUIT', codeMesureMrd: 4 },
  { id: UUIDS.bjCreditImpot, codeMesure: 'CRED_IMP', codeMesureMrd: 5 },
];

const VERSIONS = [
  {
    id: UUIDS.bjvExoGenerale,
    baseJuridiqueId: UUIDS.bjExoGenerale,
    version: 1,
    libelle: 'Exonération générale des bénéfices à la réinvestissement',
    impotConcerne: 'IS',
    natureMesureCode: 'Exoneration',
    porteeCategorieCode: 'Permanente',
    modeInstructionCode: 'manuel',
    organeGestionCode: 'CI',
  },
  {
    id: UUIDS.bjvZFI,
    baseJuridiqueId: UUIDS.bjZFI,
    version: 1,
    libelle: 'Zone Franche Industrielle',
    impotConcerne: 'IS',
    natureMesureCode: 'Exoneration',
    porteeCategorieCode: 'Temporaire_Determinee',
    modeInstructionCode: 'semi_automatique',
    organeGestionCode: 'CDDI',
  },
  {
    id: UUIDS.bjvCodeInvest,
    baseJuridiqueId: UUIDS.bjCodeInvest,
    version: 1,
    libelle: 'Code des investissements',
    impotConcerne: 'IS',
    natureMesureCode: 'Reduction_impot',
    porteeCategorieCode: 'Temporaire_Phase',
    modeInstructionCode: 'semi_automatique',
    organeGestionCode: 'CDDI_CI',
  },
  {
    id: UUIDS.bjvTauxReduit,
    baseJuridiqueId: UUIDS.bjTauxReduit,
    version: 1,
    libelle: 'Taux réduit d\'imposition',
    impotConcerne: 'IS',
    natureMesureCode: 'Taux_reduit',
    porteeCategorieCode: 'Permanente',
    modeInstructionCode: 'manuel',
    organeGestionCode: 'CI',
  },
  {
    id: UUIDS.bjvCreditImpot,
    baseJuridiqueId: UUIDS.bjCreditImpot,
    version: 1,
    libelle: 'Crédit d\'impôt',
    impotConcerne: 'IS',
    natureMesureCode: 'Credit_impot',
    porteeCategorieCode: 'Permanente',
    modeInstructionCode: 'manuel',
    organeGestionCode: 'CI',
  },
];

const BENEFICIAIRES = [
  {
    id: UUIDS.benefA,
    raisonSociale: 'Societe Cacao Cote d\'Ivoire',
    nif: 'NIF000001',
    typeBeneficiaireCode: 'entreprise_privee',
    statutFiscalCode: 'conforme',
    secteur: 'agriculture',
    region: 'sud_ouest',
    emailContact: 'contact@cacao.ci',
  },
  {
    id: UUIDS.benefB,
    raisonSociale: 'Industrie Abidjan SAS',
    nif: 'NIF000002',
    typeBeneficiaireCode: 'entreprise_privee',
    statutFiscalCode: 'conforme',
    secteur: 'industrie',
    region: 'abidjan',
    emailContact: 'contact@abidjan.ci',
  },
  {
    id: UUIDS.benefC,
    raisonSociale: 'Agro Export CI',
    nif: 'NIF000003',
    typeBeneficiaireCode: 'entreprise_privee',
    statutFiscalCode: 'conforme',
    secteur: 'agriculture',
    region: 'sud',
    emailContact: 'contact@agroexport.ci',
  },
];

const DEMANDES = [
  { id: UUIDS.demA, reference: 'DEM-2026-0001', baseJuridiqueVersionId: UUIDS.bjvExoGenerale, beneficiaireId: UUIDS.benefA, statutCode: 'brouillon', montantFcfa: 50000000 },
  { id: UUIDS.demB, reference: 'DEM-2026-0002', baseJuridiqueVersionId: UUIDS.bjvZFI, beneficiaireId: UUIDS.benefB, statutCode: 'soumis', montantFcfa: 120000000 },
  { id: UUIDS.demC, reference: 'DEM-2026-0003', baseJuridiqueVersionId: UUIDS.bjvCodeInvest, beneficiaireId: UUIDS.benefC, statutCode: 'en_instruction', instructeurId: UUIDS.instructeur, montantFcfa: 75000000 },
  { id: UUIDS.demD, reference: 'DEM-2026-0004', baseJuridiqueVersionId: UUIDS.bjvTauxReduit, beneficiaireId: UUIDS.benefA, statutCode: 'approuve', montantFcfa: 30000000 },
  { id: UUIDS.demE, reference: 'DEM-2026-0005', baseJuridiqueVersionId: UUIDS.bjvCreditImpot, beneficiaireId: UUIDS.benefB, statutCode: 'brouillon', montantFcfa: 45000000 },
];

async function main() {
  const connection = await mysql.createConnection({
    host: dbUrl.hostname || 'localhost',
    user: dbUrl.username || 'root',
    password: dbUrl.password || '',
    database: dbUrl.pathname.slice(1) || 'oase',
    port: dbUrl.port || 3306,
    multipleStatements: true,
  });

  console.log('Connexion OK');

  try {
    await connection.beginTransaction();

    // 1. Rôles
    for (const role of ROLES) {
      await connection.execute(
        `INSERT INTO ref_roles (code, libelle, description, est_actif, created_at)
         VALUES (?, ?, ?, true, NOW())
         ON DUPLICATE KEY UPDATE libelle = VALUES(libelle), description = VALUES(description), est_actif = VALUES(est_actif)`,
        [role.code, role.libelle, role.description]
      );
    }
    console.log(`✅ Rôles: ${ROLES.length}`);

    // 2. Types d'institution
    await connection.execute(
      `INSERT INTO ref_types_institution (code, libelle, description, est_actif, created_at)
       VALUES (?, ?, ?, true, NOW())
       ON DUPLICATE KEY UPDATE libelle = VALUES(libelle), description = VALUES(description), est_actif = VALUES(est_actif)`,
      ['ministere', 'Ministère', 'Ministère ou institution gouvernementale']
    );

    // 2b. Statuts utilisateur
    await connection.execute(
      `INSERT INTO ref_statuts_utilisateur (code, libelle, description, est_actif, created_at)
       VALUES (?, ?, ?, true, NOW())
       ON DUPLICATE KEY UPDATE libelle = VALUES(libelle), description = VALUES(description), est_actif = VALUES(est_actif)`,
      ['actif', 'Actif', 'Utilisateur actif']
    );

    // 2c. Référentiels pour les bases juridiques
    const refModes = [
      ['manuel', 'Manuel', 'Instruction manuelle'],
      ['semi_automatique', 'Semi-automatique', 'Instruction semi-automatique'],
      ['automatique', 'Automatique', 'Instruction automatique'],
    ];
    for (const m of refModes) {
      await connection.execute(
        `INSERT INTO ref_modes_instruction (code, libelle, description, est_actif, created_at)
         VALUES (?, ?, ?, true, NOW())
         ON DUPLICATE KEY UPDATE libelle = VALUES(libelle), description = VALUES(description), est_actif = VALUES(est_actif)`,
        m
      );
    }

    const refOrganes = [
      ['CI', 'Cellule Impact', 'Cellule Impact'],
      ['CDDI', 'CDDI', 'Comité de Dépôt et de Développement des Investissements'],
      ['UPF', 'UPF', 'Unité de Politique Fiscale'],
    ];
    for (const o of refOrganes) {
      await connection.execute(
        `INSERT INTO ref_organes_gestion (code, libelle, description, est_actif, created_at)
         VALUES (?, ?, ?, true, NOW())
         ON DUPLICATE KEY UPDATE libelle = VALUES(libelle), description = VALUES(description), est_actif = VALUES(est_actif)`,
        o
      );
    }

    // 3. Institutions
    for (const inst of INSTITUTIONS) {
      await connection.execute(
        `INSERT INTO institutions (id, code, nom, type_code, est_active, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE code = VALUES(code), nom = VALUES(nom), type_code = VALUES(type_code), est_active = VALUES(est_active)`,
        [inst.id, inst.code, inst.nom, inst.typeCode, inst.estActive]
      );
    }
    console.log(`✅ Institutions: ${INSTITUTIONS.length}`);

    // 3. Utilisateurs
    for (const user of USERS) {
      const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
      await connection.execute(
        `INSERT INTO utilisateurs (id, nom, prenom, email, password_hash, role, institution_id, statut_code, mfa_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, true, NOW(), NOW())
         ON DUPLICATE KEY UPDATE nom = VALUES(nom), prenom = VALUES(prenom), password_hash = VALUES(password_hash), role = VALUES(role), institution_id = VALUES(institution_id), statut_code = VALUES(statut_code)`,
        [user.id, user.nom, user.prenom, user.email, passwordHash, user.role, user.institutionId, user.statutCode]
      );
    }
    console.log(`✅ Utilisateurs: ${USERS.length} (mot de passe : ${DEFAULT_PASSWORD})`);

    // 4. Bases juridiques
    for (const bj of BASES_JURIDIQUES) {
      await connection.execute(
        `INSERT INTO bases_juridiques (id, code_mesure, code_mesure_mrd, created_at, updated_at)
         VALUES (?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE code_mesure = VALUES(code_mesure), code_mesure_mrd = VALUES(code_mesure_mrd)`,
        [bj.id, bj.codeMesure, bj.codeMesureMrd]
      );
    }
    console.log(`✅ Bases juridiques: ${BASES_JURIDIQUES.length}`);

    // 5. Versions (SCD2)
    for (const v of VERSIONS) {
      await connection.execute(
        `INSERT INTO base_juridique_versions (
          id, base_juridique_id, version, libelle, impot_concerne, nature_mesure_code,
          portee_categorie_code, mode_instruction_code, organe_gestion_code,
          est_active, valid_from, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, true, NOW(), NOW(), NOW())
         ON DUPLICATE KEY UPDATE
          libelle = VALUES(libelle), impot_concerne = VALUES(impot_concerne),
          nature_mesure_code = VALUES(nature_mesure_code), portee_categorie_code = VALUES(portee_categorie_code),
          mode_instruction_code = VALUES(mode_instruction_code), organe_gestion_code = VALUES(organe_gestion_code)`,
        [v.id, v.baseJuridiqueId, v.version, v.libelle, v.impotConcerne, v.natureMesureCode, v.porteeCategorieCode, v.modeInstructionCode, v.organeGestionCode]
      );
    }
    console.log(`✅ Versions base juridique: ${VERSIONS.length}`);

    // 6. Bénéficiaires
    for (const b of BENEFICIAIRES) {
      await connection.execute(
        `INSERT INTO beneficiaires (id, raison_sociale, nif, type_beneficiaire_code, statut_fiscal_code, secteur, region, email_contact, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE raison_sociale = VALUES(raison_sociale), type_beneficiaire_code = VALUES(type_beneficiaire_code), statut_fiscal_code = VALUES(statut_fiscal_code)`,
        [b.id, b.raisonSociale, b.nif, b.typeBeneficiaireCode, b.statutFiscalCode, b.secteur, b.region, b.emailContact]
      );
    }
    console.log(`✅ Bénéficiaires: ${BENEFICIAIRES.length}`);

    // 7. Demandes
    for (const d of DEMANDES) {
      await connection.execute(
        `INSERT INTO demandes (id, reference, base_juridique_version_id, beneficiaire_id, instructeur_id, statut_code, montant_fcfa, devise, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'XOF', NOW(), NOW())
         ON DUPLICATE KEY UPDATE reference = VALUES(reference), statut_code = VALUES(statut_code), montant_fcfa = VALUES(montant_fcfa), instructeur_id = VALUES(instructeur_id)`,
        [d.id, d.reference, d.baseJuridiqueVersionId, d.beneficiaireId, d.instructeurId || null, d.statutCode, d.montantFcfa]
      );
    }
    console.log(`✅ Demandes: ${DEMANDES.length}`);

    await connection.commit();
    console.log('\n✅ Seed terminé avec succès');
  } catch (err) {
    await connection.rollback();
    console.error('\n❌ Erreur seed:', err.message);
    throw err;
  } finally {
    await connection.end();
  }
}

main().catch(() => process.exit(1));
