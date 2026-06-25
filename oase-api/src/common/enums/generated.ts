// ============================================================
// OASE — Enums TypeScript générés automatiquement depuis Prisma
// Source: prisma/schema.prisma (modèles Ref*)
// Date: 2026-06-25T04:29:53.241Z
// Mode: database
// ============================================================

export enum CanalNotification {
  INAPP = 'inapp',
  EMAIL = 'email',
  SMS = 'sms',
}

export enum CanalPush {
  FCM = 'fcm',
  APNS = 'apns',
  WEB_PUSH = 'web_push',
}

export enum CategorieAnomalie {
  JURIDIQUE = 'juridique',
  FINANCIERE = 'financiere',
  TEMPORELLE = 'temporelle',
  PROCEDURALE = 'procedurale',
}

export enum EtatJob {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum GraviteAnomalie {
  CRITIQUE = 'critique',
  ELEVEE = 'elevee',
  MOYENNE = 'moyenne',
  FAIBLE = 'faible',
}

export enum ModeInstruction {
  AUTOMATIQUE = 'automatique',
  SEMI_AUTOMATIQUE = 'semi_automatique',
  MANUEL = 'manuel',
}

export enum NatureMesure {
  EXONERATION = 'Exoneration',
  EXEMPTION = 'Exemption',
  ABATTEMENT = 'Abattement',
  REDUCTION_IMPOT = 'Reduction_impot',
  TAUX_REDUIT = 'Taux_reduit',
  CREDIT_IMPOT = 'Credit_impot',
}

export enum OrganeGestion {
  CI = 'CI',
  CDDI = 'CDDI',
  CDDI_CI = 'CDDI_CI',
  OTR = 'OTR',
}

export enum PorteeCategorie {
  PERMANENTE = 'Permanente',
  TEMPORAIRE_DETERMINEE = 'Temporaire_Determinee',
  TEMPORAIRE_PHASE = 'Temporaire_Phase',
  LIEE_CONVENTION = 'Liee_Convention',
}

export enum RangPiece {
  PREMIER = 'premier',
  SECOND = 'second',
}

export enum RegimeConvention {
  ZFI = 'ZFI',
  ZES = 'ZES',
  CODE_INVESTISSEMENTS = 'Code_Investissements',
  MINIER = 'Minier',
  HYDROCARBURES = 'Hydrocarbures',
  SIEGE = 'Siege',
  AUTRE = 'Autre',
}

export enum Role {
  ADMIN_SI = 'admin_si',
  AGENT_CI = 'agent_ci',
  AGENT_AGENCE = 'agent_agence',
  AGENT_CDDI = 'agent_cddi',
  AGENT_DGBF = 'agent_dgbf',
  DECIDEUR = 'decideur',
  AGENT_DGTCP = 'agent_dgtcp',
  AUDITEUR = 'auditeur',
  BENEFICIAIRE = 'beneficiaire',
  AGENT_MAE = 'agent_mae',
  AGENT_DGMG = 'agent_dgmg',
  AGENT_MINISTERE = 'agent_ministere',
  AGENT_CONEDEF = 'agent_conedef',
  PUBLIC = 'public',
  SYSTEM = 'system',
}

export enum SourceCode {
  SYDONIA = 'sydonia',
  ETAX = 'etax',
  AUTRE = 'autre',
}

export enum SourceDetection {
  MOTEUR_REGLES = 'moteur_regles',
  AUDITEUR = 'auditeur',
  CONNECTEUR = 'connecteur',
}

export enum StatutAnomalie {
  NOUVELLE = 'nouvelle',
  EN_EXAMEN = 'en_examen',
  TRAITEE = 'traitee',
  CLASSEE = 'classee',
}

export enum StatutArchivage {
  EN_ATTENTE = 'en_attente',
  ARCHIVE = 'archive',
  ERREUR = 'erreur',
}

export enum StatutConnecteur {
  ACTIF = 'actif',
  ERREUR = 'erreur',
  MAINTENANCE = 'maintenance',
  INACTIF = 'inactif',
}

export enum StatutConvention {
  ACTIVE = 'active',
  SUSPENDUE = 'suspendue',
  RESILIEE = 'resiliee',
  EXPIREE = 'expiree',
}

export enum StatutDemande {
  BROUILLON = 'brouillon',
  SOUMIS = 'soumis',
  EN_INSTRUCTION = 'en_instruction',
  ACTION_REQUISE = 'action_requise',
  APPROUVE = 'approuve',
  REJETE = 'rejete',
  EXPIRE = 'expire',
  ARCHIVE = 'archive',
}

export enum StatutEtape {
  EN_ATTENTE = 'en_attente',
  EN_COURS = 'en_cours',
  VALIDE = 'valide',
  REJETE = 'rejete',
  ANNULE = 'annule',
}

export enum StatutFiscal {
  CONFORME = 'conforme',
  DETTE_ACTIVE = 'dette_active',
  INCONNU = 'inconnu',
}

export enum StatutNotification {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  READ = 'read',
}

export enum StatutUtilisateur {
  ACTIF = 'actif',
  INACTIF = 'inactif',
  SUSPENDU = 'suspendu',
}

export enum TypeAccordSiege {
  ONU = 'onu',
  UNION_AFRICAINE = 'union_africaine',
  AMBASSADE = 'ambassade',
  CONSULAT = 'consulat',
  ONG_INTERNATIONALE = 'ong_internationale',
  AUTRE = 'autre',
}

export enum TypeActe {
  ATTESTATION = 'attestation',
  ARRETE = 'arrete',
  REJET = 'rejet',
  ATTESTATION_REJET = 'attestation_rejet',
}

export enum TypeAgrement {
  AGREMENT_FISCAL = 'agrement_fiscal',
  AGREMENT_INVESTISSEMENT = 'agrement_investissement',
  AGREMENT_ZFI = 'agrement_zfi',
  AGREMENT_MINIER = 'agrement_minier',
  AGREMENT_HYDROCARBURES = 'agrement_hydrocarbures',
  AUTRE = 'autre',
}

export enum TypeBeneficiaire {
  ENTREPRISE_PRIVEE = 'entreprise_privee',
  ORGANISME_PUBLIC = 'organisme_public',
  ONG = 'ong',
  INSTITUTION_DIPLOMATIQUE = 'institution_diplomatique',
  ORGANISATION_INTERNATIONALE = 'organisation_internationale',
  PERSONNE_PHYSIQUE = 'personne_physique',
  ENTREPRISES_ET_MENAGES = 'entreprises_et_menages',
  AUTRE = 'autre',
}

export enum TypeDecision {
  APPROBATION = 'approbation',
  REJET = 'rejet',
  DEMANDE_COMPLEMENT = 'demande_complement',
}

export enum TypeDocument {
  NIF = 'nif',
  RCCM = 'rccm',
  STATUTS = 'statuts',
  BUSINESS_PLAN = 'business_plan',
  CONVENTION = 'convention',
  FACTURE = 'facture',
  AUTRE = 'autre',
}

export enum TypeInstitution {
  OTR = 'otr',
  DGBF = 'dgbf',
  DGTCP = 'dgtcp',
  AGENCE = 'agence',
  DGMG = 'dgmg',
  MAE = 'mae',
  MINISTERE_SECTORIEL = 'ministere_sectoriel',
  IGF = 'igf',
  COUR_COMPTES = 'cour_comptes',
  UPF = 'upf',
  DSI = 'dsi',
  CONEDEF = 'conedef',
  EXTERNE = 'externe',
}

export enum TypeJob {
  IMPORT_MRD = 'import_mrd',
  ARCHIVAGE = 'archivage',
  SYNC_CONNECTEUR = 'sync_connecteur',
  GENERATION_ACTE = 'generation_acte',
  ENVOI_NOTIFICATION = 'envoi_notification',
  CALCUL_AGGREGATS = 'calcul_aggregats',
  VERIFICATION_INTEGRITE = 'verification_integrite',
}

export enum TypeMouvementQuota {
  CONSOMMATION = 'consommation',
  LIBERATION = 'liberation',
  AJUSTEMENT = 'ajustement',
  REPORT = 'report',
}

export enum TypeNotification {
  SOUMISSION = 'SOUMISSION',
  INSTRUCTION = 'INSTRUCTION',
  COMPLEMENT = 'COMPLEMENT',
  APPROBATION = 'APPROBATION',
  REJET = 'REJET',
  ECHEANCE = 'ECHEANCE',
  QUOTA_ALERTE = 'QUOTA_ALERTE',
  ANOMALIE = 'ANOMALIE',
  SYSTEME = 'SYSTEME',
}

export enum TypeParametre {
  GENERAL = 'general',
  SECURITE = 'securite',
  NOTIFICATION = 'notification',
  ARCHIVAGE = 'archivage',
  CONNECTEUR = 'connecteur',
  QUOTA = 'quota',
}

export enum TypeQuota {
  GLOBAL_MESURE = 'global_mesure',
  PAR_BENEFICIAIRE = 'par_beneficiaire',
  PAR_CONVENTION = 'par_convention',
  ANNUEL = 'annuel',
}

export enum TypeRapport {
  EXECUTIF = 'executif',
  FISCAL = 'fiscal',
  CONTROLE = 'controle',
  AGENCE = 'agence',
  OPENDATA = 'opendata',
}

export enum UniteQuota {
  FCFA = 'fcfa',
  QUANTITE_PHYSIQUE = 'quantite_physique',
  NOMBRE_OPERATIONS = 'nombre_operations',
}

// ============================================================
// Helper: libelles des enums
// ============================================================

export const REF_LABELS: Record<string, Record<string, string>> = {
  CanalNotification: {
    inapp: 'Notification in-app',
    email: 'Email',
    sms: 'SMS',
  },
  CanalPush: {
    fcm: 'Firebase Cloud Messaging',
    apns: 'Apple Push Notification Service',
    web_push: 'Web Push',
  },
  CategorieAnomalie: {
    juridique: 'Juridique',
    financiere: 'Financiere',
    temporelle: 'Temporelle',
    procedurale: 'Procedurale',
  },
  EtatJob: {
    pending: 'En attente',
    running: 'En cours',
    completed: 'Termine',
    failed: 'Echec',
    cancelled: 'Annule',
  },
  GraviteAnomalie: {
    critique: 'Critique',
    elevee: 'Elevee',
    moyenne: 'Moyenne',
    faible: 'Faible',
  },
  ModeInstruction: {
    automatique: 'Automatique',
    semi_automatique: 'Semi-automatique',
    manuel: 'Manuel',
  },
  NatureMesure: {
    Exoneration: 'Exoneration',
    Exemption: 'Exemption',
    Abattement: 'Abattement',
    Reduction_impot: 'Reduction d impot',
    Taux_reduit: 'Taux reduit',
    Credit_impot: 'Credit d impot',
  },
  OrganeGestion: {
    CI: 'Centre des Impots',
    CDDI: 'Centre des Douanes et du Droit Indirect',
    CDDI_CI: 'CDDI + CI conjoint',
    OTR: 'OTR central',
  },
  PorteeCategorie: {
    Permanente: 'Permanente',
    Temporaire_Determinee: 'Temporaire determinee',
    Temporaire_Phase: 'Temporaire par phase',
    Liee_Convention: 'Liee a une convention',
  },
  RangPiece: {
    premier: 'Rang 1 — Obligatoire',
    second: 'Rang 2 — Facultatif',
  },
  RegimeConvention: {
    ZFI: 'Zone Franche Industrielle',
    ZES: 'Zone Economique Speciale',
    Code_Investissements: 'Code des Investissements',
    Minier: 'Regime Minier',
    Hydrocarbures: 'Regime Hydrocarbures',
    Siege: 'Accord de Siege',
    Autre: 'Autre regime',
  },
  Role: {
    admin_si: 'Administrateur SI',
    agent_ci: 'Agent OTR — Centre des Impôts',
    agent_agence: 'Agent Agence (SAZOF / API-ZF)',
    agent_cddi: 'Agent OTR — CDDI (Douanes)',
    agent_dgbf: 'Agent DGBF',
    decideur: 'Décideur UPF / MEF',
    agent_dgtcp: 'Agent DGTCP / GUDEF',
    auditeur: 'Auditeur / Contrôle',
    beneficiaire: 'Bénéficiaire',
    agent_mae: 'Agent MAE',
    agent_dgmg: 'Agent DGMG',
    agent_ministere: 'Agent Ministère sectoriel',
    agent_conedef: 'Agent CONEDEF',
    public: 'Citoyen / Open Data',
    system: 'Système (CRON / événements)',
  },
  SourceCode: {
    sydonia: 'Sydonia World',
    etax: 'E-TAX / SIGTAS',
    autre: 'Autre source',
  },
  SourceDetection: {
    moteur_regles: 'Moteur de regles automatique',
    auditeur: 'Signalee par un auditeur',
    connecteur: 'Detectee par connecteur SI',
  },
  StatutAnomalie: {
    nouvelle: 'Nouvelle',
    en_examen: 'En examen',
    traitee: 'Traitee',
    classee: 'Classee',
  },
  StatutArchivage: {
    en_attente: 'En attente',
    archive: 'Archive',
    erreur: 'Erreur',
  },
  StatutConnecteur: {
    actif: 'Actif',
    erreur: 'En erreur',
    maintenance: 'En maintenance',
    inactif: 'Inactif',
  },
  StatutConvention: {
    active: 'Active',
    suspendue: 'Suspendue',
    resiliee: 'Resiliee',
    expiree: 'Expiree',
  },
  StatutDemande: {
    brouillon: 'Brouillon',
    soumis: 'Soumis',
    en_instruction: 'En instruction',
    action_requise: 'Action requise',
    approuve: 'Approuve',
    rejete: 'Rejete',
    expire: 'Expire',
    archive: 'Archive',
  },
  StatutEtape: {
    en_attente: 'En attente',
    en_cours: 'En cours',
    valide: 'Validee',
    rejete: 'Rejetee',
    annule: 'Annulee',
  },
  StatutFiscal: {
    conforme: 'Conforme',
    dette_active: 'Dette fiscale active',
    inconnu: 'Inconnu / Non verifie',
  },
  StatutNotification: {
    pending: 'En attente',
    sent: 'Envoyee',
    failed: 'Echec',
    read: 'Lue',
  },
  StatutUtilisateur: {
    actif: 'Actif',
    inactif: 'Inactif',
    suspendu: 'Suspendu',
  },
  TypeAccordSiege: {
    onu: 'ONU / Systeme des Nations Unies',
    union_africaine: 'Union Africaine',
    ambassade: 'Ambassade',
    consulat: 'Consulat',
    ong_internationale: 'ONG internationale',
    autre: 'Autre',
  },
  TypeActe: {
    attestation: 'Attestation d exoneration',
    arrete: 'Arrete d exoneration',
    rejet: 'Decision de rejet',
    attestation_rejet: 'Attestation de rejet',
  },
  TypeAgrement: {
    agrement_fiscal: 'Agrément fiscal',
    agrement_investissement: 'Agrément investissement',
    agrement_zfi: 'Agrément Zone Franche Industrielle',
    agrement_minier: 'Agrément minier',
    agrement_hydrocarbures: 'Agrément hydrocarbures',
    autre: 'Autre agrément',
  },
  TypeBeneficiaire: {
    entreprise_privee: 'Entreprise privee',
    organisme_public: 'Organisme public',
    ong: 'ONG',
    institution_diplomatique: 'Institution diplomatique',
    organisation_internationale: 'Organisation internationale',
    personne_physique: 'Personne physique',
    entreprises_et_menages: 'Entreprises et menages',
    autre: 'Autre',
  },
  TypeDecision: {
    approbation: 'Approbation',
    rejet: 'Rejet',
    demande_complement: 'Demande de complement',
  },
  TypeDocument: {
    nif: 'NIF',
    rccm: 'RCCM',
    statuts: 'Statuts',
    business_plan: 'Business plan',
    convention: 'Convention',
    facture: 'Facture',
    autre: 'Autre',
  },
  TypeInstitution: {
    otr: 'Office Togolais des Recettes',
    dgbf: 'Direction Generale du Budget et des Finances',
    dgtcp: 'Direction Generale du Tresor et de la Comptabilite Publique',
    agence: 'Agence de promotion',
    dgmg: 'Direction Generale des Mines et de la Geologie',
    mae: 'Ministere des Affaires Etrangeres',
    ministere_sectoriel: 'Ministere sectoriel',
    igf: 'Inspection Generale des Finances',
    cour_comptes: 'Cour des Comptes',
    upf: 'Unite de Politique Fiscale — MEF',
    dsi: 'Direction des Systemes d Information',
    conedef: 'Conseil Economique et Social',
    externe: 'Institution externe',
  },
  TypeJob: {
    import_mrd: 'Import MRD',
    archivage: 'Archivage automatique',
    sync_connecteur: 'Synchronisation connecteur',
    generation_acte: 'Generation d acte',
    envoi_notification: 'Envoi de notification',
    calcul_aggregats: 'Calcul des aggregats',
    verification_integrite: 'Verification integrite audit',
  },
  TypeMouvementQuota: {
    consommation: 'Consommation sur demande approuvee',
    liberation: 'Liberation suite annulation',
    ajustement: 'Ajustement administratif',
    report: 'Report d exercice',
  },
  TypeNotification: {
    SOUMISSION: 'Soumission de demande',
    INSTRUCTION: 'Prise en charge',
    COMPLEMENT: 'Demande de complement',
    APPROBATION: 'Approbation',
    REJET: 'Rejet',
    ECHEANCE: 'Echeance proche',
    QUOTA_ALERTE: 'Alerte quota',
    ANOMALIE: 'Anomalie detectee',
    SYSTEME: 'Notification systeme',
  },
  TypeParametre: {
    general: 'General',
    securite: 'Securite',
    notification: 'Notification',
    archivage: 'Archivage',
    connecteur: 'Connecteur',
    quota: 'Quota',
  },
  TypeQuota: {
    global_mesure: 'Global par mesure',
    par_beneficiaire: 'Par beneficiaire',
    par_convention: 'Par convention',
    annuel: 'Annuel',
  },
  TypeRapport: {
    executif: 'Rapport executif',
    fiscal: 'Rapport fiscal',
    controle: 'Rapport de controle',
    agence: 'Rapport agence',
    opendata: 'Publication Open Data',
  },
  UniteQuota: {
    fcfa: 'FCFA',
    quantite_physique: 'Quantite physique',
    nombre_operations: 'Nombre d operations',
  },
};
