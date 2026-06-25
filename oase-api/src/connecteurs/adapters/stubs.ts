export const STUB_STATUTS_FISCAUX: Record<
  string,
  {
    statut: 'conforme' | 'dette_active' | 'inconnu';
    dette_fcfa?: number;
    raisonSociale: string;
  }
> = {
  'TG-LOM-2018-B-0042': { statut: 'conforme', raisonSociale: 'TEXLOME SA — Textiles de Lomé' },
  'TG-KAR-2020-A-0115': { statut: 'conforme', raisonSociale: 'TOGOFARMS SARL' },
  'TG-INT-ONU-PNUD': { statut: 'conforme', raisonSociale: 'PNUD Togo' },
  'TG-LOM-2019-B-9999': { statut: 'dette_active', raisonSociale: 'Société fictive dette', dette_fcfa: 8_500_000 },
  'TG-DAP-2022-X-0001': { statut: 'inconnu', raisonSociale: 'NIF non trouvé dans E-TAX' },
};

export const STUB_DECLARATIONS_SYDONIA = [
  {
    numero_declaration: 'SYD-2026-00441',
    nif_importateur: 'TG-LOM-2018-B-0042',
    code_exoneration: '141',
    montant_droits: 4_500_000,
    date_declaration: '2026-03-15',
    bureau_douane: 'Lomé Port',
    statut: 'validee',
  },
  {
    numero_declaration: 'SYD-2026-00442',
    nif_importateur: 'TG-LOM-2018-B-0042',
    code_exoneration: '142',
    montant_droits: 2_100_000,
    date_declaration: '2026-05-02',
    bureau_douane: 'Lomé Port',
    statut: 'validee',
  },
  {
    numero_declaration: 'SYD-2025-08821',
    nif_importateur: 'TG-KAR-2020-A-0115',
    code_exoneration: '143',
    montant_droits: 950_000,
    date_declaration: '2025-11-20',
    bureau_douane: 'Kara Terre',
    statut: 'validee',
  },
];

export const STUB_LIGNES_SIGFIP = [
  {
    code_programme: 'P037',
    code_action: 'A04',
    libelle: 'Promotion des investissements privés',
    dotation_initiale_fcfa: 5_000_000_000,
    dotation_actuelle_fcfa: 4_800_000_000,
    consomme_fcfa: 1_250_000_000,
    taux_consommation_pct: 26,
    exercice: 2026,
  },
  {
    code_programme: 'P012',
    code_action: 'A01',
    libelle: 'Gestion des exonérations douanières',
    dotation_initiale_fcfa: 10_000_000_000,
    dotation_actuelle_fcfa: 10_000_000_000,
    consomme_fcfa: 8_500_000_000,
    taux_consommation_pct: 85,
    exercice: 2026,
  },
];

export const STUB_ECRITURES_GUDEF = [
  {
    reference_oase: 'OASE-2024-000001',
    montantFcfa: 15_000_000,
    nature: 'Exonération TVA produits alimentaires',
    date_comptabilisation: '2024-09-15',
    journal: 'Dépenses fiscales',
    statut: 'comptabilise',
  },
  {
    reference_oase: 'OASE-2025-000001',
    montantFcfa: 8_250_000,
    nature: 'Exonération TVA accord de siège PNUD',
    date_comptabilisation: '2025-03-20',
    journal: 'Dépenses fiscales',
    statut: 'comptabilise',
  },
];

export const DEMO_SCENARIOS = {
  HAPPY_PATH: {
    sydonia: { latenceMs: 120, succes: true },
    etax: { latenceMs: 85, succes: true },
    sigfip: { latenceMs: 210, succes: true },
    gudef: { latenceMs: 180, succes: true },
    das: { latenceMs: 95, succes: true },
  },
  DEGRADED: {
    sydonia: { latenceMs: 120, succes: true },
    etax: { latenceMs: 85, succes: true },
    sigfip: { latenceMs: 210, succes: true },
    gudef: { latenceMs: 0, succes: false, erreur: 'MAINTENANCE' },
    das: { latenceMs: 5000, succes: false, erreur: 'TIMEOUT' },
  },
  DETTE_FISCALE: {
    nif: 'TG-LOM-2019-B-9999',
    etax: { statut: 'dette_active', dette_fcfa: 8_500_000 },
    message: 'Soumission bloquée — statut fiscal non conforme',
  },
  QUOTA_EPUISE: {
    base_juridique: 'MRD-2024-0100',
    quota: { consomme: 9_950_000_000, total: 10_000_000_000, pct: 99.5 },
    message: 'Quota épuisé — approbation impossible sans révision du plafond',
  },
};
