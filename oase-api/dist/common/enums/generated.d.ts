export declare enum CanalNotification {
    INAPP = "inapp",
    EMAIL = "email",
    SMS = "sms"
}
export declare enum CanalPush {
    FCM = "fcm",
    APNS = "apns",
    WEB_PUSH = "web_push"
}
export declare enum CategorieAnomalie {
    JURIDIQUE = "juridique",
    FINANCIERE = "financiere",
    TEMPORELLE = "temporelle",
    PROCEDURALE = "procedurale"
}
export declare enum EtatJob {
    PENDING = "pending",
    RUNNING = "running",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
export declare enum GraviteAnomalie {
    CRITIQUE = "critique",
    ELEVEE = "elevee",
    MOYENNE = "moyenne",
    FAIBLE = "faible"
}
export declare enum ModeInstruction {
    AUTOMATIQUE = "automatique",
    SEMI_AUTOMATIQUE = "semi_automatique",
    MANUEL = "manuel"
}
export declare enum NatureMesure {
    EXONERATION = "Exoneration",
    EXEMPTION = "Exemption",
    ABATTEMENT = "Abattement",
    REDUCTION_IMPOT = "Reduction_impot",
    TAUX_REDUIT = "Taux_reduit",
    CREDIT_IMPOT = "Credit_impot"
}
export declare enum OrganeGestion {
    CI = "CI",
    CDDI = "CDDI",
    CDDI_CI = "CDDI_CI",
    OTR = "OTR"
}
export declare enum PorteeCategorie {
    PERMANENTE = "Permanente",
    TEMPORAIRE_DETERMINEE = "Temporaire_Determinee",
    TEMPORAIRE_PHASE = "Temporaire_Phase",
    LIEE_CONVENTION = "Liee_Convention"
}
export declare enum RangPiece {
    PREMIER = "premier",
    SECOND = "second"
}
export declare enum RegimeConvention {
    ZFI = "ZFI",
    ZES = "ZES",
    CODE_INVESTISSEMENTS = "Code_Investissements",
    MINIER = "Minier",
    HYDROCARBURES = "Hydrocarbures",
    SIEGE = "Siege",
    AUTRE = "Autre"
}
export declare enum Role {
    ADMIN_SI = "admin_si",
    AGENT_CI = "agent_ci",
    AGENT_AGENCE = "agent_agence",
    AGENT_CDDI = "agent_cddi",
    AGENT_DGBF = "agent_dgbf",
    DECIDEUR = "decideur",
    AGENT_DGTCP = "agent_dgtcp",
    AUDITEUR = "auditeur",
    BENEFICIAIRE = "beneficiaire",
    AGENT_MAE = "agent_mae",
    AGENT_DGMG = "agent_dgmg",
    AGENT_MINISTERE = "agent_ministere",
    AGENT_CONEDEF = "agent_conedef",
    PUBLIC = "public",
    SYSTEM = "system"
}
export declare enum SourceCode {
    SYDONIA = "sydonia",
    ETAX = "etax",
    AUTRE = "autre"
}
export declare enum SourceDetection {
    MOTEUR_REGLES = "moteur_regles",
    AUDITEUR = "auditeur",
    CONNECTEUR = "connecteur"
}
export declare enum StatutAnomalie {
    NOUVELLE = "nouvelle",
    EN_EXAMEN = "en_examen",
    TRAITEE = "traitee",
    CLASSEE = "classee"
}
export declare enum StatutArchivage {
    EN_ATTENTE = "en_attente",
    ARCHIVE = "archive",
    ERREUR = "erreur"
}
export declare enum StatutConnecteur {
    ACTIF = "actif",
    ERREUR = "erreur",
    MAINTENANCE = "maintenance",
    INACTIF = "inactif"
}
export declare enum StatutConvention {
    ACTIVE = "active",
    SUSPENDUE = "suspendue",
    RESILIEE = "resiliee",
    EXPIREE = "expiree"
}
export declare enum StatutDemande {
    BROUILLON = "brouillon",
    SOUMIS = "soumis",
    EN_INSTRUCTION = "en_instruction",
    ACTION_REQUISE = "action_requise",
    APPROUVE = "approuve",
    REJETE = "rejete",
    EXPIRE = "expire",
    ARCHIVE = "archive"
}
export declare enum StatutEtape {
    EN_ATTENTE = "en_attente",
    EN_COURS = "en_cours",
    VALIDE = "valide",
    REJETE = "rejete",
    ANNULE = "annule"
}
export declare enum StatutFiscal {
    CONFORME = "conforme",
    DETTE_ACTIVE = "dette_active",
    INCONNU = "inconnu"
}
export declare enum StatutNotification {
    PENDING = "pending",
    SENT = "sent",
    FAILED = "failed",
    READ = "read"
}
export declare enum StatutUtilisateur {
    ACTIF = "actif",
    INACTIF = "inactif",
    SUSPENDU = "suspendu"
}
export declare enum TypeAccordSiege {
    ONU = "onu",
    UNION_AFRICAINE = "union_africaine",
    AMBASSADE = "ambassade",
    CONSULAT = "consulat",
    ONG_INTERNATIONALE = "ong_internationale",
    AUTRE = "autre"
}
export declare enum TypeActe {
    ATTESTATION = "attestation",
    ARRETE = "arrete",
    REJET = "rejet",
    ATTESTATION_REJET = "attestation_rejet"
}
export declare enum TypeAgrement {
    AGREMENT_FISCAL = "agrement_fiscal",
    AGREMENT_INVESTISSEMENT = "agrement_investissement",
    AGREMENT_ZFI = "agrement_zfi",
    AGREMENT_MINIER = "agrement_minier",
    AGREMENT_HYDROCARBURES = "agrement_hydrocarbures",
    AUTRE = "autre"
}
export declare enum TypeBeneficiaire {
    ENTREPRISE_PRIVEE = "entreprise_privee",
    ORGANISME_PUBLIC = "organisme_public",
    ONG = "ong",
    INSTITUTION_DIPLOMATIQUE = "institution_diplomatique",
    ORGANISATION_INTERNATIONALE = "organisation_internationale",
    PERSONNE_PHYSIQUE = "personne_physique",
    ENTREPRISES_ET_MENAGES = "entreprises_et_menages",
    AUTRE = "autre"
}
export declare enum TypeDecision {
    APPROBATION = "approbation",
    REJET = "rejet",
    DEMANDE_COMPLEMENT = "demande_complement"
}
export declare enum TypeDocument {
    NIF = "nif",
    RCCM = "rccm",
    STATUTS = "statuts",
    BUSINESS_PLAN = "business_plan",
    CONVENTION = "convention",
    FACTURE = "facture",
    AUTRE = "autre"
}
export declare enum TypeInstitution {
    OTR = "otr",
    DGBF = "dgbf",
    DGTCP = "dgtcp",
    AGENCE = "agence",
    DGMG = "dgmg",
    MAE = "mae",
    MINISTERE_SECTORIEL = "ministere_sectoriel",
    IGF = "igf",
    COUR_COMPTES = "cour_comptes",
    UPF = "upf",
    DSI = "dsi",
    CONEDEF = "conedef",
    EXTERNE = "externe"
}
export declare enum TypeJob {
    IMPORT_MRD = "import_mrd",
    ARCHIVAGE = "archivage",
    SYNC_CONNECTEUR = "sync_connecteur",
    GENERATION_ACTE = "generation_acte",
    ENVOI_NOTIFICATION = "envoi_notification",
    CALCUL_AGGREGATS = "calcul_aggregats",
    VERIFICATION_INTEGRITE = "verification_integrite"
}
export declare enum TypeMouvementQuota {
    CONSOMMATION = "consommation",
    LIBERATION = "liberation",
    AJUSTEMENT = "ajustement",
    REPORT = "report"
}
export declare enum TypeNotification {
    SOUMISSION = "SOUMISSION",
    INSTRUCTION = "INSTRUCTION",
    COMPLEMENT = "COMPLEMENT",
    APPROBATION = "APPROBATION",
    REJET = "REJET",
    ECHEANCE = "ECHEANCE",
    QUOTA_ALERTE = "QUOTA_ALERTE",
    ANOMALIE = "ANOMALIE",
    SYSTEME = "SYSTEME"
}
export declare enum TypeParametre {
    GENERAL = "general",
    SECURITE = "securite",
    NOTIFICATION = "notification",
    ARCHIVAGE = "archivage",
    CONNECTEUR = "connecteur",
    QUOTA = "quota"
}
export declare enum TypeQuota {
    GLOBAL_MESURE = "global_mesure",
    PAR_BENEFICIAIRE = "par_beneficiaire",
    PAR_CONVENTION = "par_convention",
    ANNUEL = "annuel"
}
export declare enum TypeRapport {
    EXECUTIF = "executif",
    FISCAL = "fiscal",
    CONTROLE = "controle",
    AGENCE = "agence",
    OPENDATA = "opendata"
}
export declare enum UniteQuota {
    FCFA = "fcfa",
    QUANTITE_PHYSIQUE = "quantite_physique",
    NOMBRE_OPERATIONS = "nombre_operations"
}
export declare const REF_LABELS: Record<string, Record<string, string>>;
