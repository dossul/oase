"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REF_LABELS = exports.UniteQuota = exports.TypeRapport = exports.TypeQuota = exports.TypeParametre = exports.TypeNotification = exports.TypeMouvementQuota = exports.TypeJob = exports.TypeInstitution = exports.TypeDocument = exports.TypeDecision = exports.TypeBeneficiaire = exports.TypeAgrement = exports.TypeActe = exports.TypeAccordSiege = exports.StatutUtilisateur = exports.StatutNotification = exports.StatutFiscal = exports.StatutEtape = exports.StatutDemande = exports.StatutConvention = exports.StatutConnecteur = exports.StatutArchivage = exports.StatutAnomalie = exports.SourceDetection = exports.SourceCode = exports.Role = exports.RegimeConvention = exports.RangPiece = exports.PorteeCategorie = exports.OrganeGestion = exports.NatureMesure = exports.ModeInstruction = exports.GraviteAnomalie = exports.EtatJob = exports.CategorieAnomalie = exports.CanalPush = exports.CanalNotification = void 0;
var CanalNotification;
(function (CanalNotification) {
    CanalNotification["INAPP"] = "inapp";
    CanalNotification["EMAIL"] = "email";
    CanalNotification["SMS"] = "sms";
})(CanalNotification || (exports.CanalNotification = CanalNotification = {}));
var CanalPush;
(function (CanalPush) {
    CanalPush["FCM"] = "fcm";
    CanalPush["APNS"] = "apns";
    CanalPush["WEB_PUSH"] = "web_push";
})(CanalPush || (exports.CanalPush = CanalPush = {}));
var CategorieAnomalie;
(function (CategorieAnomalie) {
    CategorieAnomalie["JURIDIQUE"] = "juridique";
    CategorieAnomalie["FINANCIERE"] = "financiere";
    CategorieAnomalie["TEMPORELLE"] = "temporelle";
    CategorieAnomalie["PROCEDURALE"] = "procedurale";
})(CategorieAnomalie || (exports.CategorieAnomalie = CategorieAnomalie = {}));
var EtatJob;
(function (EtatJob) {
    EtatJob["PENDING"] = "pending";
    EtatJob["RUNNING"] = "running";
    EtatJob["COMPLETED"] = "completed";
    EtatJob["FAILED"] = "failed";
    EtatJob["CANCELLED"] = "cancelled";
})(EtatJob || (exports.EtatJob = EtatJob = {}));
var GraviteAnomalie;
(function (GraviteAnomalie) {
    GraviteAnomalie["CRITIQUE"] = "critique";
    GraviteAnomalie["ELEVEE"] = "elevee";
    GraviteAnomalie["MOYENNE"] = "moyenne";
    GraviteAnomalie["FAIBLE"] = "faible";
})(GraviteAnomalie || (exports.GraviteAnomalie = GraviteAnomalie = {}));
var ModeInstruction;
(function (ModeInstruction) {
    ModeInstruction["AUTOMATIQUE"] = "automatique";
    ModeInstruction["SEMI_AUTOMATIQUE"] = "semi_automatique";
    ModeInstruction["MANUEL"] = "manuel";
})(ModeInstruction || (exports.ModeInstruction = ModeInstruction = {}));
var NatureMesure;
(function (NatureMesure) {
    NatureMesure["EXONERATION"] = "Exoneration";
    NatureMesure["EXEMPTION"] = "Exemption";
    NatureMesure["ABATTEMENT"] = "Abattement";
    NatureMesure["REDUCTION_IMPOT"] = "Reduction_impot";
    NatureMesure["TAUX_REDUIT"] = "Taux_reduit";
    NatureMesure["CREDIT_IMPOT"] = "Credit_impot";
})(NatureMesure || (exports.NatureMesure = NatureMesure = {}));
var OrganeGestion;
(function (OrganeGestion) {
    OrganeGestion["CI"] = "CI";
    OrganeGestion["CDDI"] = "CDDI";
    OrganeGestion["CDDI_CI"] = "CDDI_CI";
    OrganeGestion["OTR"] = "OTR";
})(OrganeGestion || (exports.OrganeGestion = OrganeGestion = {}));
var PorteeCategorie;
(function (PorteeCategorie) {
    PorteeCategorie["PERMANENTE"] = "Permanente";
    PorteeCategorie["TEMPORAIRE_DETERMINEE"] = "Temporaire_Determinee";
    PorteeCategorie["TEMPORAIRE_PHASE"] = "Temporaire_Phase";
    PorteeCategorie["LIEE_CONVENTION"] = "Liee_Convention";
})(PorteeCategorie || (exports.PorteeCategorie = PorteeCategorie = {}));
var RangPiece;
(function (RangPiece) {
    RangPiece["PREMIER"] = "premier";
    RangPiece["SECOND"] = "second";
})(RangPiece || (exports.RangPiece = RangPiece = {}));
var RegimeConvention;
(function (RegimeConvention) {
    RegimeConvention["ZFI"] = "ZFI";
    RegimeConvention["ZES"] = "ZES";
    RegimeConvention["CODE_INVESTISSEMENTS"] = "Code_Investissements";
    RegimeConvention["MINIER"] = "Minier";
    RegimeConvention["HYDROCARBURES"] = "Hydrocarbures";
    RegimeConvention["SIEGE"] = "Siege";
    RegimeConvention["AUTRE"] = "Autre";
})(RegimeConvention || (exports.RegimeConvention = RegimeConvention = {}));
var Role;
(function (Role) {
    Role["ADMIN_SI"] = "admin_si";
    Role["AGENT_CI"] = "agent_ci";
    Role["AGENT_AGENCE"] = "agent_agence";
    Role["AGENT_CDDI"] = "agent_cddi";
    Role["AGENT_DGBF"] = "agent_dgbf";
    Role["DECIDEUR"] = "decideur";
    Role["AGENT_DGTCP"] = "agent_dgtcp";
    Role["AUDITEUR"] = "auditeur";
    Role["BENEFICIAIRE"] = "beneficiaire";
    Role["AGENT_MAE"] = "agent_mae";
    Role["AGENT_DGMG"] = "agent_dgmg";
    Role["AGENT_MINISTERE"] = "agent_ministere";
    Role["AGENT_CONEDEF"] = "agent_conedef";
    Role["PUBLIC"] = "public";
    Role["SYSTEM"] = "system";
})(Role || (exports.Role = Role = {}));
var SourceCode;
(function (SourceCode) {
    SourceCode["SYDONIA"] = "sydonia";
    SourceCode["ETAX"] = "etax";
    SourceCode["AUTRE"] = "autre";
})(SourceCode || (exports.SourceCode = SourceCode = {}));
var SourceDetection;
(function (SourceDetection) {
    SourceDetection["MOTEUR_REGLES"] = "moteur_regles";
    SourceDetection["AUDITEUR"] = "auditeur";
    SourceDetection["CONNECTEUR"] = "connecteur";
})(SourceDetection || (exports.SourceDetection = SourceDetection = {}));
var StatutAnomalie;
(function (StatutAnomalie) {
    StatutAnomalie["NOUVELLE"] = "nouvelle";
    StatutAnomalie["EN_EXAMEN"] = "en_examen";
    StatutAnomalie["TRAITEE"] = "traitee";
    StatutAnomalie["CLASSEE"] = "classee";
})(StatutAnomalie || (exports.StatutAnomalie = StatutAnomalie = {}));
var StatutArchivage;
(function (StatutArchivage) {
    StatutArchivage["EN_ATTENTE"] = "en_attente";
    StatutArchivage["ARCHIVE"] = "archive";
    StatutArchivage["ERREUR"] = "erreur";
})(StatutArchivage || (exports.StatutArchivage = StatutArchivage = {}));
var StatutConnecteur;
(function (StatutConnecteur) {
    StatutConnecteur["ACTIF"] = "actif";
    StatutConnecteur["ERREUR"] = "erreur";
    StatutConnecteur["MAINTENANCE"] = "maintenance";
    StatutConnecteur["INACTIF"] = "inactif";
})(StatutConnecteur || (exports.StatutConnecteur = StatutConnecteur = {}));
var StatutConvention;
(function (StatutConvention) {
    StatutConvention["ACTIVE"] = "active";
    StatutConvention["SUSPENDUE"] = "suspendue";
    StatutConvention["RESILIEE"] = "resiliee";
    StatutConvention["EXPIREE"] = "expiree";
})(StatutConvention || (exports.StatutConvention = StatutConvention = {}));
var StatutDemande;
(function (StatutDemande) {
    StatutDemande["BROUILLON"] = "brouillon";
    StatutDemande["SOUMIS"] = "soumis";
    StatutDemande["EN_INSTRUCTION"] = "en_instruction";
    StatutDemande["ACTION_REQUISE"] = "action_requise";
    StatutDemande["APPROUVE"] = "approuve";
    StatutDemande["REJETE"] = "rejete";
    StatutDemande["EXPIRE"] = "expire";
    StatutDemande["ARCHIVE"] = "archive";
})(StatutDemande || (exports.StatutDemande = StatutDemande = {}));
var StatutEtape;
(function (StatutEtape) {
    StatutEtape["EN_ATTENTE"] = "en_attente";
    StatutEtape["EN_COURS"] = "en_cours";
    StatutEtape["VALIDE"] = "valide";
    StatutEtape["REJETE"] = "rejete";
    StatutEtape["ANNULE"] = "annule";
})(StatutEtape || (exports.StatutEtape = StatutEtape = {}));
var StatutFiscal;
(function (StatutFiscal) {
    StatutFiscal["CONFORME"] = "conforme";
    StatutFiscal["DETTE_ACTIVE"] = "dette_active";
    StatutFiscal["INCONNU"] = "inconnu";
})(StatutFiscal || (exports.StatutFiscal = StatutFiscal = {}));
var StatutNotification;
(function (StatutNotification) {
    StatutNotification["PENDING"] = "pending";
    StatutNotification["SENT"] = "sent";
    StatutNotification["FAILED"] = "failed";
    StatutNotification["READ"] = "read";
})(StatutNotification || (exports.StatutNotification = StatutNotification = {}));
var StatutUtilisateur;
(function (StatutUtilisateur) {
    StatutUtilisateur["ACTIF"] = "actif";
    StatutUtilisateur["INACTIF"] = "inactif";
    StatutUtilisateur["SUSPENDU"] = "suspendu";
})(StatutUtilisateur || (exports.StatutUtilisateur = StatutUtilisateur = {}));
var TypeAccordSiege;
(function (TypeAccordSiege) {
    TypeAccordSiege["ONU"] = "onu";
    TypeAccordSiege["UNION_AFRICAINE"] = "union_africaine";
    TypeAccordSiege["AMBASSADE"] = "ambassade";
    TypeAccordSiege["CONSULAT"] = "consulat";
    TypeAccordSiege["ONG_INTERNATIONALE"] = "ong_internationale";
    TypeAccordSiege["AUTRE"] = "autre";
})(TypeAccordSiege || (exports.TypeAccordSiege = TypeAccordSiege = {}));
var TypeActe;
(function (TypeActe) {
    TypeActe["ATTESTATION"] = "attestation";
    TypeActe["ARRETE"] = "arrete";
    TypeActe["REJET"] = "rejet";
    TypeActe["ATTESTATION_REJET"] = "attestation_rejet";
})(TypeActe || (exports.TypeActe = TypeActe = {}));
var TypeAgrement;
(function (TypeAgrement) {
    TypeAgrement["AGREMENT_FISCAL"] = "agrement_fiscal";
    TypeAgrement["AGREMENT_INVESTISSEMENT"] = "agrement_investissement";
    TypeAgrement["AGREMENT_ZFI"] = "agrement_zfi";
    TypeAgrement["AGREMENT_MINIER"] = "agrement_minier";
    TypeAgrement["AGREMENT_HYDROCARBURES"] = "agrement_hydrocarbures";
    TypeAgrement["AUTRE"] = "autre";
})(TypeAgrement || (exports.TypeAgrement = TypeAgrement = {}));
var TypeBeneficiaire;
(function (TypeBeneficiaire) {
    TypeBeneficiaire["ENTREPRISE_PRIVEE"] = "entreprise_privee";
    TypeBeneficiaire["ORGANISME_PUBLIC"] = "organisme_public";
    TypeBeneficiaire["ONG"] = "ong";
    TypeBeneficiaire["INSTITUTION_DIPLOMATIQUE"] = "institution_diplomatique";
    TypeBeneficiaire["ORGANISATION_INTERNATIONALE"] = "organisation_internationale";
    TypeBeneficiaire["PERSONNE_PHYSIQUE"] = "personne_physique";
    TypeBeneficiaire["ENTREPRISES_ET_MENAGES"] = "entreprises_et_menages";
    TypeBeneficiaire["AUTRE"] = "autre";
})(TypeBeneficiaire || (exports.TypeBeneficiaire = TypeBeneficiaire = {}));
var TypeDecision;
(function (TypeDecision) {
    TypeDecision["APPROBATION"] = "approbation";
    TypeDecision["REJET"] = "rejet";
    TypeDecision["DEMANDE_COMPLEMENT"] = "demande_complement";
})(TypeDecision || (exports.TypeDecision = TypeDecision = {}));
var TypeDocument;
(function (TypeDocument) {
    TypeDocument["NIF"] = "nif";
    TypeDocument["RCCM"] = "rccm";
    TypeDocument["STATUTS"] = "statuts";
    TypeDocument["BUSINESS_PLAN"] = "business_plan";
    TypeDocument["CONVENTION"] = "convention";
    TypeDocument["FACTURE"] = "facture";
    TypeDocument["AUTRE"] = "autre";
})(TypeDocument || (exports.TypeDocument = TypeDocument = {}));
var TypeInstitution;
(function (TypeInstitution) {
    TypeInstitution["OTR"] = "otr";
    TypeInstitution["DGBF"] = "dgbf";
    TypeInstitution["DGTCP"] = "dgtcp";
    TypeInstitution["AGENCE"] = "agence";
    TypeInstitution["DGMG"] = "dgmg";
    TypeInstitution["MAE"] = "mae";
    TypeInstitution["MINISTERE_SECTORIEL"] = "ministere_sectoriel";
    TypeInstitution["IGF"] = "igf";
    TypeInstitution["COUR_COMPTES"] = "cour_comptes";
    TypeInstitution["UPF"] = "upf";
    TypeInstitution["DSI"] = "dsi";
    TypeInstitution["CONEDEF"] = "conedef";
    TypeInstitution["EXTERNE"] = "externe";
})(TypeInstitution || (exports.TypeInstitution = TypeInstitution = {}));
var TypeJob;
(function (TypeJob) {
    TypeJob["IMPORT_MRD"] = "import_mrd";
    TypeJob["ARCHIVAGE"] = "archivage";
    TypeJob["SYNC_CONNECTEUR"] = "sync_connecteur";
    TypeJob["GENERATION_ACTE"] = "generation_acte";
    TypeJob["ENVOI_NOTIFICATION"] = "envoi_notification";
    TypeJob["CALCUL_AGGREGATS"] = "calcul_aggregats";
    TypeJob["VERIFICATION_INTEGRITE"] = "verification_integrite";
})(TypeJob || (exports.TypeJob = TypeJob = {}));
var TypeMouvementQuota;
(function (TypeMouvementQuota) {
    TypeMouvementQuota["CONSOMMATION"] = "consommation";
    TypeMouvementQuota["LIBERATION"] = "liberation";
    TypeMouvementQuota["AJUSTEMENT"] = "ajustement";
    TypeMouvementQuota["REPORT"] = "report";
})(TypeMouvementQuota || (exports.TypeMouvementQuota = TypeMouvementQuota = {}));
var TypeNotification;
(function (TypeNotification) {
    TypeNotification["SOUMISSION"] = "SOUMISSION";
    TypeNotification["INSTRUCTION"] = "INSTRUCTION";
    TypeNotification["COMPLEMENT"] = "COMPLEMENT";
    TypeNotification["APPROBATION"] = "APPROBATION";
    TypeNotification["REJET"] = "REJET";
    TypeNotification["ECHEANCE"] = "ECHEANCE";
    TypeNotification["QUOTA_ALERTE"] = "QUOTA_ALERTE";
    TypeNotification["ANOMALIE"] = "ANOMALIE";
    TypeNotification["SYSTEME"] = "SYSTEME";
})(TypeNotification || (exports.TypeNotification = TypeNotification = {}));
var TypeParametre;
(function (TypeParametre) {
    TypeParametre["GENERAL"] = "general";
    TypeParametre["SECURITE"] = "securite";
    TypeParametre["NOTIFICATION"] = "notification";
    TypeParametre["ARCHIVAGE"] = "archivage";
    TypeParametre["CONNECTEUR"] = "connecteur";
    TypeParametre["QUOTA"] = "quota";
})(TypeParametre || (exports.TypeParametre = TypeParametre = {}));
var TypeQuota;
(function (TypeQuota) {
    TypeQuota["GLOBAL_MESURE"] = "global_mesure";
    TypeQuota["PAR_BENEFICIAIRE"] = "par_beneficiaire";
    TypeQuota["PAR_CONVENTION"] = "par_convention";
    TypeQuota["ANNUEL"] = "annuel";
})(TypeQuota || (exports.TypeQuota = TypeQuota = {}));
var TypeRapport;
(function (TypeRapport) {
    TypeRapport["EXECUTIF"] = "executif";
    TypeRapport["FISCAL"] = "fiscal";
    TypeRapport["CONTROLE"] = "controle";
    TypeRapport["AGENCE"] = "agence";
    TypeRapport["OPENDATA"] = "opendata";
})(TypeRapport || (exports.TypeRapport = TypeRapport = {}));
var UniteQuota;
(function (UniteQuota) {
    UniteQuota["FCFA"] = "fcfa";
    UniteQuota["QUANTITE_PHYSIQUE"] = "quantite_physique";
    UniteQuota["NOMBRE_OPERATIONS"] = "nombre_operations";
})(UniteQuota || (exports.UniteQuota = UniteQuota = {}));
exports.REF_LABELS = {
    "CanalNotification": {
        "inapp": "Notification in-app",
        "email": "Email",
        "sms": "SMS"
    },
    "CanalPush": {
        "fcm": "Firebase Cloud Messaging",
        "apns": "Apple Push Notification Service",
        "web_push": "Web Push"
    },
    "CategorieAnomalie": {
        "juridique": "Juridique",
        "financiere": "Financiere",
        "temporelle": "Temporelle",
        "procedurale": "Procedurale"
    },
    "EtatJob": {
        "pending": "En attente",
        "running": "En cours",
        "completed": "Termine",
        "failed": "Echec",
        "cancelled": "Annule"
    },
    "GraviteAnomalie": {
        "critique": "Critique",
        "elevee": "Elevee",
        "moyenne": "Moyenne",
        "faible": "Faible"
    },
    "ModeInstruction": {
        "automatique": "Automatique",
        "semi_automatique": "Semi-automatique",
        "manuel": "Manuel"
    },
    "NatureMesure": {
        "Exoneration": "Exoneration",
        "Exemption": "Exemption",
        "Abattement": "Abattement",
        "Reduction_impot": "Reduction d impot",
        "Taux_reduit": "Taux reduit",
        "Credit_impot": "Credit d impot"
    },
    "OrganeGestion": {
        "CI": "Centre des Impots",
        "CDDI": "Centre des Douanes et du Droit Indirect",
        "CDDI_CI": "CDDI + CI conjoint",
        "OTR": "OTR central"
    },
    "PorteeCategorie": {
        "Permanente": "Permanente",
        "Temporaire_Determinee": "Temporaire determinee",
        "Temporaire_Phase": "Temporaire par phase",
        "Liee_Convention": "Liee a une convention"
    },
    "RangPiece": {
        "premier": "Rang 1 — Obligatoire",
        "second": "Rang 2 — Facultatif"
    },
    "RegimeConvention": {
        "ZFI": "Zone Franche Industrielle",
        "ZES": "Zone Economique Speciale",
        "Code_Investissements": "Code des Investissements",
        "Minier": "Regime Minier",
        "Hydrocarbures": "Regime Hydrocarbures",
        "Siege": "Accord de Siege",
        "Autre": "Autre regime"
    },
    "Role": {
        "admin_si": "Administrateur SI",
        "agent_ci": "Agent OTR — Centre des Impôts",
        "agent_agence": "Agent Agence (SAZOF / API-ZF)",
        "agent_cddi": "Agent OTR — CDDI (Douanes)",
        "agent_dgbf": "Agent DGBF",
        "decideur": "Décideur UPF / MEF",
        "agent_dgtcp": "Agent DGTCP / GUDEF",
        "auditeur": "Auditeur / Contrôle",
        "beneficiaire": "Bénéficiaire",
        "agent_mae": "Agent MAE",
        "agent_dgmg": "Agent DGMG",
        "agent_ministere": "Agent Ministère sectoriel",
        "agent_conedef": "Agent CONEDEF",
        "public": "Citoyen / Open Data",
        "system": "Système (CRON / événements)"
    },
    "SourceCode": {
        "sydonia": "Sydonia World",
        "etax": "E-TAX / SIGTAS",
        "autre": "Autre source"
    },
    "SourceDetection": {
        "moteur_regles": "Moteur de regles automatique",
        "auditeur": "Signalee par un auditeur",
        "connecteur": "Detectee par connecteur SI"
    },
    "StatutAnomalie": {
        "nouvelle": "Nouvelle",
        "en_examen": "En examen",
        "traitee": "Traitee",
        "classee": "Classee"
    },
    "StatutArchivage": {
        "en_attente": "En attente",
        "archive": "Archive",
        "erreur": "Erreur"
    },
    "StatutConnecteur": {
        "actif": "Actif",
        "erreur": "En erreur",
        "maintenance": "En maintenance",
        "inactif": "Inactif"
    },
    "StatutConvention": {
        "active": "Active",
        "suspendue": "Suspendue",
        "resiliee": "Resiliee",
        "expiree": "Expiree"
    },
    "StatutDemande": {
        "brouillon": "Brouillon",
        "soumis": "Soumis",
        "en_instruction": "En instruction",
        "action_requise": "Action requise",
        "approuve": "Approuve",
        "rejete": "Rejete",
        "expire": "Expire",
        "archive": "Archive"
    },
    "StatutEtape": {
        "en_attente": "En attente",
        "en_cours": "En cours",
        "valide": "Validee",
        "rejete": "Rejetee",
        "annule": "Annulee"
    },
    "StatutFiscal": {
        "conforme": "Conforme",
        "dette_active": "Dette fiscale active",
        "inconnu": "Inconnu / Non verifie"
    },
    "StatutNotification": {
        "pending": "En attente",
        "sent": "Envoyee",
        "failed": "Echec",
        "read": "Lue"
    },
    "StatutUtilisateur": {
        "actif": "Actif",
        "inactif": "Inactif",
        "suspendu": "Suspendu"
    },
    "TypeAccordSiege": {
        "onu": "ONU / Systeme des Nations Unies",
        "union_africaine": "Union Africaine",
        "ambassade": "Ambassade",
        "consulat": "Consulat",
        "ong_internationale": "ONG internationale",
        "autre": "Autre"
    },
    "TypeActe": {
        "attestation": "Attestation d exoneration",
        "arrete": "Arrete d exoneration",
        "rejet": "Decision de rejet",
        "attestation_rejet": "Attestation de rejet"
    },
    "TypeAgrement": {
        "agrement_fiscal": "Agrément fiscal",
        "agrement_investissement": "Agrément investissement",
        "agrement_zfi": "Agrément Zone Franche Industrielle",
        "agrement_minier": "Agrément minier",
        "agrement_hydrocarbures": "Agrément hydrocarbures",
        "autre": "Autre agrément"
    },
    "TypeBeneficiaire": {
        "entreprise_privee": "Entreprise privee",
        "organisme_public": "Organisme public",
        "ong": "ONG",
        "institution_diplomatique": "Institution diplomatique",
        "organisation_internationale": "Organisation internationale",
        "personne_physique": "Personne physique",
        "entreprises_et_menages": "Entreprises et menages",
        "autre": "Autre"
    },
    "TypeDecision": {
        "approbation": "Approbation",
        "rejet": "Rejet",
        "demande_complement": "Demande de complement"
    },
    "TypeDocument": {
        "nif": "NIF",
        "rccm": "RCCM",
        "statuts": "Statuts",
        "business_plan": "Business plan",
        "convention": "Convention",
        "facture": "Facture",
        "autre": "Autre"
    },
    "TypeInstitution": {
        "otr": "Office Togolais des Recettes",
        "dgbf": "Direction Generale du Budget et des Finances",
        "dgtcp": "Direction Generale du Tresor et de la Comptabilite Publique",
        "agence": "Agence de promotion",
        "dgmg": "Direction Generale des Mines et de la Geologie",
        "mae": "Ministere des Affaires Etrangeres",
        "ministere_sectoriel": "Ministere sectoriel",
        "igf": "Inspection Generale des Finances",
        "cour_comptes": "Cour des Comptes",
        "upf": "Unite de Politique Fiscale — MEF",
        "dsi": "Direction des Systemes d Information",
        "conedef": "Conseil Economique et Social",
        "externe": "Institution externe"
    },
    "TypeJob": {
        "import_mrd": "Import MRD",
        "archivage": "Archivage automatique",
        "sync_connecteur": "Synchronisation connecteur",
        "generation_acte": "Generation d acte",
        "envoi_notification": "Envoi de notification",
        "calcul_aggregats": "Calcul des aggregats",
        "verification_integrite": "Verification integrite audit"
    },
    "TypeMouvementQuota": {
        "consommation": "Consommation sur demande approuvee",
        "liberation": "Liberation suite annulation",
        "ajustement": "Ajustement administratif",
        "report": "Report d exercice"
    },
    "TypeNotification": {
        "SOUMISSION": "Soumission de demande",
        "INSTRUCTION": "Prise en charge",
        "COMPLEMENT": "Demande de complement",
        "APPROBATION": "Approbation",
        "REJET": "Rejet",
        "ECHEANCE": "Echeance proche",
        "QUOTA_ALERTE": "Alerte quota",
        "ANOMALIE": "Anomalie detectee",
        "SYSTEME": "Notification systeme"
    },
    "TypeParametre": {
        "general": "General",
        "securite": "Securite",
        "notification": "Notification",
        "archivage": "Archivage",
        "connecteur": "Connecteur",
        "quota": "Quota"
    },
    "TypeQuota": {
        "global_mesure": "Global par mesure",
        "par_beneficiaire": "Par beneficiaire",
        "par_convention": "Par convention",
        "annuel": "Annuel"
    },
    "TypeRapport": {
        "executif": "Rapport executif",
        "fiscal": "Rapport fiscal",
        "controle": "Rapport de controle",
        "agence": "Rapport agence",
        "opendata": "Publication Open Data"
    },
    "UniteQuota": {
        "fcfa": "FCFA",
        "quantite_physique": "Quantite physique",
        "nombre_operations": "Nombre d operations"
    }
};
//# sourceMappingURL=generated.js.map