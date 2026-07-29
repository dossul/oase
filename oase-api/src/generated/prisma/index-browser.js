
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.6.0
 * Query Engine version: f676762280b54cd07c770017ed3711ddde35f37a
 */
Prisma.prismaVersion = {
  client: "6.6.0",
  engine: "f676762280b54cd07c770017ed3711ddde35f37a"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.AccordSiegeScalarFieldEnum = {
  id: 'id',
  institution: 'institution',
  typeInstitutionCode: 'typeInstitutionCode',
  texteFondateur: 'texteFondateur',
  dateSignature: 'dateSignature',
  estActif: 'estActif',
  createdAt: 'createdAt'
};

exports.Prisma.ActeScalarFieldEnum = {
  id: 'id',
  demandeId: 'demandeId',
  decisionId: 'decisionId',
  typeCode: 'typeCode',
  reference: 'reference',
  contribuableId: 'contribuableId',
  montantFcfa: 'montantFcfa',
  dateEffet: 'dateEffet',
  documentUrl: 'documentUrl',
  hashDocument: 'hashDocument',
  qrCodeHash: 'qrCodeHash',
  qrCodeImageUrl: 'qrCodeImageUrl',
  estRevoke: 'estRevoke',
  dateRevocation: 'dateRevocation',
  motifRevocation: 'motifRevocation',
  createdAt: 'createdAt'
};

exports.Prisma.AgrementContribuableScalarFieldEnum = {
  id: 'id',
  agrementId: 'agrementId',
  contribuableId: 'contribuableId',
  role: 'role',
  createdAt: 'createdAt'
};

exports.Prisma.AgrementScalarFieldEnum = {
  id: 'id',
  reference: 'reference',
  contribuableId: 'contribuableId',
  typeAgrementCode: 'typeAgrementCode',
  baseJuridiqueVersionId: 'baseJuridiqueVersionId',
  regimeCode: 'regimeCode',
  statutCode: 'statutCode',
  dateDebut: 'dateDebut',
  dateFin: 'dateFin',
  montantEstime: 'montantEstime',
  objet: 'objet',
  documentUrl: 'documentUrl',
  hashDocument: 'hashDocument',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AnomalieScalarFieldEnum = {
  id: 'id',
  categorieCode: 'categorieCode',
  graviteCode: 'graviteCode',
  description: 'description',
  demandeId: 'demandeId',
  baseJuridiqueVersionId: 'baseJuridiqueVersionId',
  conventionId: 'conventionId',
  dateDetection: 'dateDetection',
  statutCode: 'statutCode',
  detecteeParCode: 'detecteeParCode',
  utilisateurId: 'utilisateurId',
  regleId: 'regleId',
  commentaire: 'commentaire',
  montantEnCause: 'montantEnCause',
  baseLegaleViolee: 'baseLegaleViolee',
  dateResolution: 'dateResolution',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ArchivageScalarFieldEnum = {
  id: 'id',
  typeEntite: 'typeEntite',
  entiteId: 'entiteId',
  demandeId: 'demandeId',
  statutCode: 'statutCode',
  cheminArchive: 'cheminArchive',
  hashArchive: 'hashArchive',
  declenchePar: 'declenchePar',
  dateArchivage: 'dateArchivage',
  createdAt: 'createdAt'
};

exports.Prisma.AuditLogScalarFieldEnum = {
  id: 'id',
  horodatage: 'horodatage',
  utilisateurId: 'utilisateurId',
  roleAuMoment: 'roleAuMoment',
  institution: 'institution',
  action: 'action',
  entite: 'entite',
  entiteId: 'entiteId',
  demandeId: 'demandeId',
  ancienneValeur: 'ancienneValeur',
  nouvelleValeur: 'nouvelleValeur',
  ip: 'ip',
  userAgent: 'userAgent',
  hashPrecedent: 'hashPrecedent',
  empreinteSha256: 'empreinteSha256',
  createdAt: 'createdAt'
};

exports.Prisma.BaseJuridiqueDocumentScalarFieldEnum = {
  id: 'id',
  baseJuridiqueVersionId: 'baseJuridiqueVersionId',
  typeDocument: 'typeDocument',
  referenceDocument: 'referenceDocument',
  dateDocument: 'dateDocument',
  nomFichier: 'nomFichier',
  typeMime: 'typeMime',
  tailleOctets: 'tailleOctets',
  urlStockage: 'urlStockage',
  hashSha256: 'hashSha256',
  estTexteFondateur: 'estTexteFondateur',
  estPublic: 'estPublic',
  uploadedById: 'uploadedById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BaseJuridiqueVersionScalarFieldEnum = {
  id: 'id',
  baseJuridiqueId: 'baseJuridiqueId',
  version: 'version',
  libelle: 'libelle',
  impotConcerne: 'impotConcerne',
  natureMesureCode: 'natureMesureCode',
  typeTexte1: 'typeTexte1',
  typeTexte2: 'typeTexte2',
  supportJuridiqueBase: 'supportJuridiqueBase',
  supportJuridiqueComplem: 'supportJuridiqueComplem',
  article: 'article',
  articleCgi2025: 'articleCgi2025',
  porteeCategorieCode: 'porteeCategorieCode',
  porteeDureeMois: 'porteeDureeMois',
  porteeDescription: 'porteeDescription',
  organeGestionCode: 'organeGestionCode',
  organeAttribution: 'organeAttribution',
  systemeInformation: 'systemeInformation',
  modeInstructionCode: 'modeInstructionCode',
  objectifType: 'objectifType',
  brancheActivite: 'brancheActivite',
  typeContribuableCible: 'typeContribuableCible',
  estDepenseFiscale2024: 'estDepenseFiscale2024',
  estEvaluee2024: 'estEvaluee2024',
  donneesDisponibles: 'donneesDisponibles',
  fonctionBudgetaire: 'fonctionBudgetaire',
  conformiteTexteFondament: 'conformiteTexteFondament',
  conformiteDirectiveUemoa: 'conformiteDirectiveUemoa',
  odd: 'odd',
  programmeDotation: 'programmeDotation',
  positionSh: 'positionSh',
  estActive: 'estActive',
  dateAdoption: 'dateAdoption',
  dateAbrogation: 'dateAbrogation',
  validFrom: 'validFrom',
  validTo: 'validTo',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  versionCouranteFlag: 'versionCouranteFlag'
};

exports.Prisma.BaseJuridiqueScalarFieldEnum = {
  id: 'id',
  codeMesure: 'codeMesure',
  codeMesureMrd: 'codeMesureMrd',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ContribuableHistoriqueFiscalScalarFieldEnum = {
  id: 'id',
  contribuableId: 'contribuableId',
  statutFiscalCode: 'statutFiscalCode',
  dateDebut: 'dateDebut',
  dateFin: 'dateFin',
  source: 'source',
  connecteurCode: 'connecteurCode',
  createdAt: 'createdAt'
};

exports.Prisma.ContribuableScalarFieldEnum = {
  id: 'id',
  raisonSociale: 'raisonSociale',
  nif: 'nif',
  rccm: 'rccm',
  typeContribuableCode: 'typeContribuableCode',
  statutFiscalCode: 'statutFiscalCode',
  secteur: 'secteur',
  region: 'region',
  emailContact: 'emailContact',
  telephone: 'telephone',
  adresse: 'adresse',
  accordSiegeId: 'accordSiegeId',
  userId: 'userId',
  profilCompletude: 'profilCompletude',
  profilLocked: 'profilLocked',
  derniereMajCompletude: 'derniereMajCompletude',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CodeAdditionnelScalarFieldEnum = {
  id: 'id',
  baseJuridiqueVersionId: 'baseJuridiqueVersionId',
  code: 'code',
  sourceCode: 'sourceCode',
  estPrincipal: 'estPrincipal',
  createdAt: 'createdAt'
};

exports.Prisma.ConnecteurLogScalarFieldEnum = {
  id: 'id',
  connecteurId: 'connecteurId',
  direction: 'direction',
  operation: 'operation',
  payloadEntrant: 'payloadEntrant',
  payloadSortant: 'payloadSortant',
  statutHttp: 'statutHttp',
  dureeMs: 'dureeMs',
  estErreur: 'estErreur',
  messageErreur: 'messageErreur',
  createdAt: 'createdAt'
};

exports.Prisma.ConnecteurScalarFieldEnum = {
  id: 'id',
  nom: 'nom',
  codeSysteme: 'codeSysteme',
  institutionId: 'institutionId',
  statutCode: 'statutCode',
  endpoint: 'endpoint',
  configAuth: 'configAuth',
  latenceMs: 'latenceMs',
  tauxErreur: 'tauxErreur',
  dernierSync: 'dernierSync',
  volume24h: 'volume24h',
  fallbackManuel: 'fallbackManuel',
  timeoutS: 'timeoutS',
  failureThreshold: 'failureThreshold',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ConventionEngagementScalarFieldEnum = {
  id: 'id',
  conventionId: 'conventionId',
  typeEngagement: 'typeEngagement',
  periodeAnnee: 'periodeAnnee',
  objectif: 'objectif',
  realise: 'realise',
  commentaire: 'commentaire',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ConventionScalarFieldEnum = {
  id: 'id',
  reference: 'reference',
  contribuableId: 'contribuableId',
  baseJuridiqueVersionId: 'baseJuridiqueVersionId',
  accordSiegeId: 'accordSiegeId',
  regimeCode: 'regimeCode',
  statutCode: 'statutCode',
  dateDebut: 'dateDebut',
  dateFin: 'dateFin',
  montantEstime: 'montantEstime',
  emploisEngages: 'emploisEngages',
  emploisCrees: 'emploisCrees',
  zoneZfi: 'zoneZfi',
  objet: 'objet',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PermisMinierScalarFieldEnum = {
  id: 'id',
  reference: 'reference',
  contribuableId: 'contribuableId',
  conventionId: 'conventionId',
  typePermis: 'typePermis',
  substance: 'substance',
  dateDemande: 'dateDemande',
  dateOctroi: 'dateOctroi',
  dureeAnnees: 'dureeAnnees',
  superficieKm2: 'superficieKm2',
  localite: 'localite',
  longitude: 'longitude',
  latitude: 'latitude',
  rapportEiePublic: 'rapportEiePublic',
  lienRapportEie: 'lienRapportEie',
  modeOctroi: 'modeOctroi',
  statut: 'statut',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DecisionScalarFieldEnum = {
  id: 'id',
  demandeId: 'demandeId',
  utilisateurId: 'utilisateurId',
  typeCode: 'typeCode',
  dateDecision: 'dateDecision',
  motif: 'motif',
  documentUrl: 'documentUrl',
  hashSha256: 'hashSha256',
  pinHash: 'pinHash',
  estSigne: 'estSigne',
  createdAt: 'createdAt'
};

exports.Prisma.DemandeComplementScalarFieldEnum = {
  id: 'id',
  demandeId: 'demandeId',
  instructeurId: 'instructeurId',
  motif: 'motif',
  piecesAttendues: 'piecesAttendues',
  dateDemande: 'dateDemande',
  dateReponse: 'dateReponse',
  statutCode: 'statutCode',
  createdAt: 'createdAt'
};

exports.Prisma.DemandeSyncExterneScalarFieldEnum = {
  id: 'id',
  demandeId: 'demandeId',
  connecteurId: 'connecteurId',
  operation: 'operation',
  statutCode: 'statutCode',
  payloadEnvoye: 'payloadEnvoye',
  reponseRecue: 'reponseRecue',
  nombreTentatives: 'nombreTentatives',
  dateDerniereTentative: 'dateDerniereTentative',
  messageErreur: 'messageErreur',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DemandeWorkflowEtapeScalarFieldEnum = {
  id: 'id',
  instanceId: 'instanceId',
  templateEtapeId: 'templateEtapeId',
  nomEtape: 'nomEtape',
  ordre: 'ordre',
  acteurRole: 'acteurRole',
  acteurId: 'acteurId',
  statutCode: 'statutCode',
  dateDebut: 'dateDebut',
  dateFin: 'dateFin',
  delaiCibleJours: 'delaiCibleJours',
  commentaire: 'commentaire',
  pinSigne: 'pinSigne',
  decisionPrise: 'decisionPrise',
  createdAt: 'createdAt'
};

exports.Prisma.DemandeWorkflowInstanceScalarFieldEnum = {
  id: 'id',
  demandeId: 'demandeId',
  workflowTemplateId: 'workflowTemplateId',
  statutCode: 'statutCode',
  dateDebut: 'dateDebut',
  dateFin: 'dateFin',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DemandeScalarFieldEnum = {
  id: 'id',
  reference: 'reference',
  baseJuridiqueVersionId: 'baseJuridiqueVersionId',
  contribuableId: 'contribuableId',
  conventionId: 'conventionId',
  instructeurId: 'instructeurId',
  statutCode: 'statutCode',
  dateDepot: 'dateDepot',
  dateEcheance: 'dateEcheance',
  dateArchivage: 'dateArchivage',
  montantFcfa: 'montantFcfa',
  devise: 'devise',
  quotaConsomme: 'quotaConsomme',
  quotaTotal: 'quotaTotal',
  secteur: 'secteur',
  etapeActuelle: 'etapeActuelle',
  motifRejet: 'motifRejet',
  declarationHonneur: 'declarationHonneur',
  estUrgente: 'estUrgente',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.ImportMrdScalarFieldEnum = {
  id: 'id',
  nomFichier: 'nomFichier',
  typeFichier: 'typeFichier',
  statutCode: 'statutCode',
  lignesTotal: 'lignesTotal',
  lignesImportees: 'lignesImportees',
  lignesRejetees: 'lignesRejetees',
  rapport: 'rapport',
  fichierErreursUrl: 'fichierErreursUrl',
  lanceParId: 'lanceParId',
  dateDebut: 'dateDebut',
  dateFin: 'dateFin',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InstitutionScalarFieldEnum = {
  id: 'id',
  code: 'code',
  nom: 'nom',
  typeCode: 'typeCode',
  estActive: 'estActive',
  createdAt: 'createdAt'
};

exports.Prisma.JobQueueScalarFieldEnum = {
  id: 'id',
  typeJobCode: 'typeJobCode',
  payload: 'payload',
  priorite: 'priorite',
  statutCode: 'statutCode',
  datePrevue: 'datePrevue',
  dateDebut: 'dateDebut',
  dateFin: 'dateFin',
  resultat: 'resultat',
  erreur: 'erreur',
  nombreTentatives: 'nombreTentatives',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.NotificationPreferenceScalarFieldEnum = {
  id: 'id',
  utilisateurId: 'utilisateurId',
  typeNotificationCode: 'typeNotificationCode',
  canalCode: 'canalCode',
  estActive: 'estActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.NotificationQueueScalarFieldEnum = {
  id: 'id',
  utilisateurId: 'utilisateurId',
  demandeId: 'demandeId',
  typeNotificationCode: 'typeNotificationCode',
  canalCode: 'canalCode',
  sujet: 'sujet',
  corps: 'corps',
  statutCode: 'statutCode',
  dateEnvoi: 'dateEnvoi',
  dateLecture: 'dateLecture',
  erreur: 'erreur',
  nombreTentatives: 'nombreTentatives',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.NotificationTemplateScalarFieldEnum = {
  id: 'id',
  code: 'code',
  typeNotificationCode: 'typeNotificationCode',
  canalCode: 'canalCode',
  sujet: 'sujet',
  corps: 'corps',
  variables: 'variables',
  estActive: 'estActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  utilisateurId: 'utilisateurId',
  demandeId: 'demandeId',
  typeNotificationCode: 'typeNotificationCode',
  canalCode: 'canalCode',
  titre: 'titre',
  corps: 'corps',
  estLue: 'estLue',
  dateLecture: 'dateLecture',
  queueId: 'queueId',
  createdAt: 'createdAt'
};

exports.Prisma.OpendataPublicationScalarFieldEnum = {
  id: 'id',
  periodeAnnee: 'periodeAnnee',
  periodeMois: 'periodeMois',
  titre: 'titre',
  description: 'description',
  fichierUrl: 'fichierUrl',
  donneesJson: 'donneesJson',
  estPublie: 'estPublie',
  datePublication: 'datePublication',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ParametreSystemeScalarFieldEnum = {
  id: 'id',
  code: 'code',
  typeParametreCode: 'typeParametreCode',
  libelle: 'libelle',
  valeur: 'valeur',
  description: 'description',
  estEditable: 'estEditable',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PieceJointeScalarFieldEnum = {
  id: 'id',
  demandeId: 'demandeId',
  contribuableId: 'contribuableId',
  nomFichier: 'nomFichier',
  typeMime: 'typeMime',
  tailleOctets: 'tailleOctets',
  rangCode: 'rangCode',
  categorie: 'categorie',
  typeDocumentCode: 'typeDocumentCode',
  urlStockage: 'urlStockage',
  hashSha256: 'hashSha256',
  estValide: 'estValide',
  valideParId: 'valideParId',
  dateValidation: 'dateValidation',
  commentaireValidation: 'commentaireValidation',
  createdAt: 'createdAt'
};

exports.Prisma.PushTokenScalarFieldEnum = {
  id: 'id',
  utilisateurId: 'utilisateurId',
  token: 'token',
  canalPushCode: 'canalPushCode',
  deviceId: 'deviceId',
  modeleAppareil: 'modeleAppareil',
  systemeExploitation: 'systemeExploitation',
  versionApp: 'versionApp',
  estActif: 'estActif',
  dateDernierUtilisation: 'dateDernierUtilisation',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.QuotaMouvementScalarFieldEnum = {
  id: 'id',
  quotaId: 'quotaId',
  demandeId: 'demandeId',
  typeMouvementCode: 'typeMouvementCode',
  montant: 'montant',
  soldeAvant: 'soldeAvant',
  soldeApres: 'soldeApres',
  commentaire: 'commentaire',
  createdAt: 'createdAt'
};

exports.Prisma.QuotaScalarFieldEnum = {
  id: 'id',
  baseJuridiqueVersionId: 'baseJuridiqueVersionId',
  contribuableId: 'contribuableId',
  conventionId: 'conventionId',
  exerciceAnnuel: 'exerciceAnnuel',
  typeQuotaCode: 'typeQuotaCode',
  uniteCode: 'uniteCode',
  total: 'total',
  consomme: 'consomme',
  alerteSeuilPct: 'alerteSeuilPct',
  alerte80Envoyee: 'alerte80Envoyee',
  alerte100Envoyee: 'alerte100Envoyee',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RefCanalNotificationScalarFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  ordre: 'ordre',
  couleur: 'couleur',
  estActif: 'estActif',
  createdAt: 'createdAt'
};

exports.Prisma.RefCanalPushScalarFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  ordre: 'ordre',
  couleur: 'couleur',
  estActif: 'estActif',
  createdAt: 'createdAt'
};

exports.Prisma.RefCategorieAnomalieScalarFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  ordre: 'ordre',
  couleur: 'couleur',
  estActif: 'estActif',
  createdAt: 'createdAt'
};

exports.Prisma.RefEtatJobScalarFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  ordre: 'ordre',
  couleur: 'couleur',
  estActif: 'estActif',
  createdAt: 'createdAt'
};

exports.Prisma.RefGraviteAnomalieScalarFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  ordre: 'ordre',
  couleur: 'couleur',
  estActif: 'estActif',
  createdAt: 'createdAt'
};

exports.Prisma.RefModeInstructionScalarFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  ordre: 'ordre',
  couleur: 'couleur',
  estActif: 'estActif',
  createdAt: 'createdAt'
};

exports.Prisma.RefNatureMesureScalarFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  ordre: 'ordre',
  couleur: 'couleur',
  estActif: 'estActif',
  createdAt: 'createdAt'
};

exports.Prisma.RefOrganeGestionScalarFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  ordre: 'ordre',
  couleur: 'couleur',
  estActif: 'estActif',
  createdAt: 'createdAt'
};

exports.Prisma.RefPorteeCategorieScalarFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  ordre: 'ordre',
  couleur: 'couleur',
  estActif: 'estActif',
  createdAt: 'createdAt'
};

exports.Prisma.RefRangPieceScalarFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  ordre: 'ordre',
  couleur: 'couleur',
  estActif: 'estActif',
  createdAt: 'createdAt'
};

exports.Prisma.RefRegimeConventionScalarFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  ordre: 'ordre',
  couleur: 'couleur',
  estActif: 'estActif',
  createdAt: 'createdAt'
};

exports.Prisma.RefRoleScalarFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  ordre: 'ordre',
  couleur: 'couleur',
  estActif: 'estActif',
  createdAt: 'createdAt'
};

exports.Prisma.RefSourceCodeScalarFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  ordre: 'ordre',
  couleur: 'couleur',
  estActif: 'estActif',
  createdAt: 'createdAt'
};

exports.Prisma.RefSourceDetectionScalarFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  ordre: 'ordre',
  couleur: 'couleur',
  estActif: 'estActif',
  createdAt: 'createdAt'
};

exports.Prisma.RefStatutAnomalieScalarFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  ordre: 'ordre',
  couleur: 'couleur',
  estActif: 'estActif',
  createdAt: 'createdAt'
};

exports.Prisma.RefStatutArchivageScalarFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  ordre: 'ordre',
  couleur: 'couleur',
  estActif: 'estActif',
  createdAt: 'createdAt'
};

exports.Prisma.RefStatutConnecteurScalarFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  ordre: 'ordre',
  couleur: 'couleur',
  estActif: 'estActif',
  createdAt: 'createdAt'
};

exports.Prisma.RefStatutConventionScalarFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  ordre: 'ordre',
  couleur: 'couleur',
  estActif: 'estActif',
  createdAt: 'createdAt'
};

exports.Prisma.RefStatutDemandeScalarFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  ordre: 'ordre',
  couleur: 'couleur',
  isFinal: 'isFinal',
  estActif: 'estActif',
  createdAt: 'createdAt'
};

exports.Prisma.RefStatutEtapeScalarFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  ordre: 'ordre',
  couleur: 'couleur',
  estActif: 'estActif',
  createdAt: 'createdAt'
};

exports.Prisma.RefStatutFiscalScalarFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  ordre: 'ordre',
  couleur: 'couleur',
  estActif: 'estActif',
  createdAt: 'createdAt'
};

exports.Prisma.RefStatutNotificationScalarFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  ordre: 'ordre',
  couleur: 'couleur',
  estActif: 'estActif',
  createdAt: 'createdAt'
};

exports.Prisma.RefStatutUtilisateurScalarFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  ordre: 'ordre',
  couleur: 'couleur',
  estActif: 'estActif',
  createdAt: 'createdAt'
};

exports.Prisma.RefTypeAccordSiegeScalarFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  ordre: 'ordre',
  couleur: 'couleur',
  estActif: 'estActif',
  createdAt: 'createdAt'
};

exports.Prisma.RefTypeActeScalarFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  ordre: 'ordre',
  couleur: 'couleur',
  estActif: 'estActif',
  createdAt: 'createdAt'
};

exports.Prisma.RefTypeAgrementScalarFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  ordre: 'ordre',
  couleur: 'couleur',
  estActif: 'estActif',
  createdAt: 'createdAt'
};

exports.Prisma.RefTypeContribuableScalarFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  ordre: 'ordre',
  couleur: 'couleur',
  estActif: 'estActif',
  createdAt: 'createdAt'
};

exports.Prisma.RefTypeDecisionScalarFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  ordre: 'ordre',
  couleur: 'couleur',
  estActif: 'estActif',
  createdAt: 'createdAt'
};

exports.Prisma.RefTypeDocumentScalarFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  ordre: 'ordre',
  couleur: 'couleur',
  estActif: 'estActif',
  createdAt: 'createdAt'
};

exports.Prisma.RefTypeInstitutionScalarFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  ordre: 'ordre',
  couleur: 'couleur',
  estActif: 'estActif',
  createdAt: 'createdAt'
};

exports.Prisma.RefTypeJobScalarFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  ordre: 'ordre',
  couleur: 'couleur',
  estActif: 'estActif',
  createdAt: 'createdAt'
};

exports.Prisma.RefTypeMouvementQuotaScalarFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  ordre: 'ordre',
  couleur: 'couleur',
  estActif: 'estActif',
  createdAt: 'createdAt'
};

exports.Prisma.RefTypeNotificationScalarFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  ordre: 'ordre',
  couleur: 'couleur',
  estActif: 'estActif',
  createdAt: 'createdAt'
};

exports.Prisma.RefTypeParametreScalarFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  ordre: 'ordre',
  couleur: 'couleur',
  estActif: 'estActif',
  createdAt: 'createdAt'
};

exports.Prisma.RefTypeQuotaScalarFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  ordre: 'ordre',
  couleur: 'couleur',
  estActif: 'estActif',
  createdAt: 'createdAt'
};

exports.Prisma.RefTypeRapportScalarFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  ordre: 'ordre',
  couleur: 'couleur',
  estActif: 'estActif',
  createdAt: 'createdAt'
};

exports.Prisma.RefUniteQuotaScalarFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  ordre: 'ordre',
  couleur: 'couleur',
  estActif: 'estActif',
  createdAt: 'createdAt'
};

exports.Prisma.RefreshTokenScalarFieldEnum = {
  id: 'id',
  utilisateurId: 'utilisateurId',
  tokenHash: 'tokenHash',
  expiresAt: 'expiresAt',
  estRevoque: 'estRevoque',
  ip: 'ip',
  userAgent: 'userAgent',
  createdAt: 'createdAt'
};

exports.Prisma.RegleAnomalieScalarFieldEnum = {
  id: 'id',
  code: 'code',
  nom: 'nom',
  categorieCode: 'categorieCode',
  graviteCode: 'graviteCode',
  description: 'description',
  expression: 'expression',
  estActive: 'estActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ReportingAggregatScalarFieldEnum = {
  id: 'id',
  periodeAnnee: 'periodeAnnee',
  periodeMois: 'periodeMois',
  typeTexte1: 'typeTexte1',
  impotConcerne: 'impotConcerne',
  natureMesureCode: 'natureMesureCode',
  typeContribuableCode: 'typeContribuableCode',
  regimeCode: 'regimeCode',
  region: 'region',
  secteur: 'secteur',
  nbDemandesSoumis: 'nbDemandesSoumis',
  nbDemandesApprouve: 'nbDemandesApprouve',
  nbDemandesRejete: 'nbDemandesRejete',
  montantTotalDemandes: 'montantTotalDemandes',
  montantTotalApprouve: 'montantTotalApprouve',
  delaiMoyenInstructionJours: 'delaiMoyenInstructionJours',
  nbAnomaliesCritique: 'nbAnomaliesCritique',
  estAnonymise: 'estAnonymise',
  dateCalcul: 'dateCalcul',
  createdAt: 'createdAt'
};

exports.Prisma.ReportingExecutionScalarFieldEnum = {
  id: 'id',
  typeRapportCode: 'typeRapportCode',
  periodeAnnee: 'periodeAnnee',
  periodeMois: 'periodeMois',
  parametres: 'parametres',
  fichierUrl: 'fichierUrl',
  hashFichier: 'hashFichier',
  estProgramme: 'estProgramme',
  dateDebut: 'dateDebut',
  dateFin: 'dateFin',
  statutCode: 'statutCode',
  messageErreur: 'messageErreur',
  createdAt: 'createdAt'
};

exports.Prisma.ResetPasswordTokenScalarFieldEnum = {
  id: 'id',
  utilisateurId: 'utilisateurId',
  tokenHash: 'tokenHash',
  expiresAt: 'expiresAt',
  estUtilise: 'estUtilise',
  createdAt: 'createdAt'
};

exports.Prisma.RolePermissionScalarFieldEnum = {
  role: 'role',
  ressource: 'ressource',
  action: 'action',
  perimetre: 'perimetre',
  createdAt: 'createdAt'
};

exports.Prisma.SessionUtilisateurScalarFieldEnum = {
  id: 'id',
  utilisateurId: 'utilisateurId',
  jetonSessionHash: 'jetonSessionHash',
  ip: 'ip',
  userAgent: 'userAgent',
  pays: 'pays',
  ville: 'ville',
  dateConnexion: 'dateConnexion',
  dateDerniereActivite: 'dateDerniereActivite',
  dateDeconnexion: 'dateDeconnexion',
  estActive: 'estActive',
  createdAt: 'createdAt'
};

exports.Prisma.SystemLogScalarFieldEnum = {
  id: 'id',
  niveau: 'niveau',
  source: 'source',
  message: 'message',
  contexte: 'contexte',
  trace: 'trace',
  createdAt: 'createdAt'
};

exports.Prisma.UtilisateurScalarFieldEnum = {
  id: 'id',
  nom: 'nom',
  prenom: 'prenom',
  email: 'email',
  passwordHash: 'passwordHash',
  role: 'role',
  institutionId: 'institutionId',
  statutCode: 'statutCode',
  mfaActive: 'mfaActive',
  mfaSecretEnc: 'mfaSecretEnc',
  pinHash: 'pinHash',
  secteurAffecte: 'secteurAffecte',
  telephone: 'telephone',
  derniereConnexion: 'derniereConnexion',
  ipDerniereCx: 'ipDerniereCx',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WorkflowTemplateEtapeScalarFieldEnum = {
  id: 'id',
  workflowTemplateId: 'workflowTemplateId',
  nomEtape: 'nomEtape',
  ordre: 'ordre',
  acteurRole: 'acteurRole',
  institutionTypeCode: 'institutionTypeCode',
  delaiCibleJours: 'delaiCibleJours',
  pinRequis: 'pinRequis',
  estObligatoire: 'estObligatoire',
  conditionActivation: 'conditionActivation',
  actionDeclenchee: 'actionDeclenchee',
  createdAt: 'createdAt'
};

exports.Prisma.WorkflowTemplateTransitionScalarFieldEnum = {
  id: 'id',
  workflowTemplateId: 'workflowTemplateId',
  etapeSourceOrdre: 'etapeSourceOrdre',
  etapeCibleOrdre: 'etapeCibleOrdre',
  action: 'action',
  conditionTransition: 'conditionTransition',
  createdAt: 'createdAt'
};

exports.Prisma.WorkflowTemplateScalarFieldEnum = {
  id: 'id',
  code: 'code',
  nom: 'nom',
  description: 'description',
  baseJuridiqueVersionId: 'baseJuridiqueVersionId',
  typeTexte1: 'typeTexte1',
  organeGestionCode: 'organeGestionCode',
  estActif: 'estActif',
  versionTemplate: 'versionTemplate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PhoneOtpCodeScalarFieldEnum = {
  id: 'id',
  telephone: 'telephone',
  contexte: 'contexte',
  codeHash: 'codeHash',
  sel: 'sel',
  payloadJson: 'payloadJson',
  tentatives: 'tentatives',
  expiresAt: 'expiresAt',
  estUtilise: 'estUtilise',
  ipOrigine: 'ipOrigine',
  createdAt: 'createdAt'
};

exports.Prisma.SystemConfigScalarFieldEnum = {
  key: 'key',
  value: 'value',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MfaChallengeScalarFieldEnum = {
  id: 'id',
  utilisateurId: 'utilisateurId',
  canal: 'canal',
  codeHash: 'codeHash',
  sel: 'sel',
  tentatives: 'tentatives',
  expiresAt: 'expiresAt',
  estUtilise: 'estUtilise',
  createdAt: 'createdAt'
};

exports.Prisma.MissionScalarFieldEnum = {
  id: 'id',
  reference: 'reference',
  titre: 'titre',
  type: 'type',
  statut: 'statut',
  organe: 'organe',
  auditeurId: 'auditeurId',
  demandeId: 'demandeId',
  dateDebut: 'dateDebut',
  dateFin: 'dateFin',
  constats: 'constats',
  recommandations: 'recommandations',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.AccordSiegeOrderByRelevanceFieldEnum = {
  id: 'id',
  institution: 'institution',
  typeInstitutionCode: 'typeInstitutionCode',
  texteFondateur: 'texteFondateur'
};

exports.Prisma.ActeOrderByRelevanceFieldEnum = {
  id: 'id',
  demandeId: 'demandeId',
  decisionId: 'decisionId',
  typeCode: 'typeCode',
  reference: 'reference',
  contribuableId: 'contribuableId',
  documentUrl: 'documentUrl',
  hashDocument: 'hashDocument',
  qrCodeHash: 'qrCodeHash',
  qrCodeImageUrl: 'qrCodeImageUrl',
  motifRevocation: 'motifRevocation'
};

exports.Prisma.AgrementContribuableOrderByRelevanceFieldEnum = {
  id: 'id',
  agrementId: 'agrementId',
  contribuableId: 'contribuableId',
  role: 'role'
};

exports.Prisma.AgrementOrderByRelevanceFieldEnum = {
  id: 'id',
  reference: 'reference',
  contribuableId: 'contribuableId',
  typeAgrementCode: 'typeAgrementCode',
  baseJuridiqueVersionId: 'baseJuridiqueVersionId',
  regimeCode: 'regimeCode',
  statutCode: 'statutCode',
  objet: 'objet',
  documentUrl: 'documentUrl',
  hashDocument: 'hashDocument'
};

exports.Prisma.AnomalieOrderByRelevanceFieldEnum = {
  id: 'id',
  categorieCode: 'categorieCode',
  graviteCode: 'graviteCode',
  description: 'description',
  demandeId: 'demandeId',
  baseJuridiqueVersionId: 'baseJuridiqueVersionId',
  conventionId: 'conventionId',
  statutCode: 'statutCode',
  detecteeParCode: 'detecteeParCode',
  utilisateurId: 'utilisateurId',
  regleId: 'regleId',
  commentaire: 'commentaire',
  baseLegaleViolee: 'baseLegaleViolee'
};

exports.Prisma.ArchivageOrderByRelevanceFieldEnum = {
  id: 'id',
  typeEntite: 'typeEntite',
  entiteId: 'entiteId',
  demandeId: 'demandeId',
  statutCode: 'statutCode',
  cheminArchive: 'cheminArchive',
  hashArchive: 'hashArchive',
  declenchePar: 'declenchePar'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.AuditLogOrderByRelevanceFieldEnum = {
  id: 'id',
  utilisateurId: 'utilisateurId',
  roleAuMoment: 'roleAuMoment',
  institution: 'institution',
  action: 'action',
  entite: 'entite',
  entiteId: 'entiteId',
  demandeId: 'demandeId',
  ip: 'ip',
  userAgent: 'userAgent',
  hashPrecedent: 'hashPrecedent',
  empreinteSha256: 'empreinteSha256'
};

exports.Prisma.BaseJuridiqueDocumentOrderByRelevanceFieldEnum = {
  id: 'id',
  baseJuridiqueVersionId: 'baseJuridiqueVersionId',
  typeDocument: 'typeDocument',
  referenceDocument: 'referenceDocument',
  nomFichier: 'nomFichier',
  typeMime: 'typeMime',
  urlStockage: 'urlStockage',
  hashSha256: 'hashSha256',
  uploadedById: 'uploadedById'
};

exports.Prisma.BaseJuridiqueVersionOrderByRelevanceFieldEnum = {
  id: 'id',
  baseJuridiqueId: 'baseJuridiqueId',
  libelle: 'libelle',
  impotConcerne: 'impotConcerne',
  natureMesureCode: 'natureMesureCode',
  typeTexte1: 'typeTexte1',
  typeTexte2: 'typeTexte2',
  supportJuridiqueBase: 'supportJuridiqueBase',
  supportJuridiqueComplem: 'supportJuridiqueComplem',
  article: 'article',
  articleCgi2025: 'articleCgi2025',
  porteeCategorieCode: 'porteeCategorieCode',
  porteeDescription: 'porteeDescription',
  organeGestionCode: 'organeGestionCode',
  organeAttribution: 'organeAttribution',
  systemeInformation: 'systemeInformation',
  modeInstructionCode: 'modeInstructionCode',
  objectifType: 'objectifType',
  brancheActivite: 'brancheActivite',
  typeContribuableCible: 'typeContribuableCible',
  fonctionBudgetaire: 'fonctionBudgetaire',
  conformiteTexteFondament: 'conformiteTexteFondament',
  conformiteDirectiveUemoa: 'conformiteDirectiveUemoa',
  odd: 'odd',
  programmeDotation: 'programmeDotation',
  positionSh: 'positionSh'
};

exports.Prisma.BaseJuridiqueOrderByRelevanceFieldEnum = {
  id: 'id',
  codeMesure: 'codeMesure'
};

exports.Prisma.ContribuableHistoriqueFiscalOrderByRelevanceFieldEnum = {
  id: 'id',
  contribuableId: 'contribuableId',
  statutFiscalCode: 'statutFiscalCode',
  source: 'source',
  connecteurCode: 'connecteurCode'
};

exports.Prisma.ContribuableOrderByRelevanceFieldEnum = {
  id: 'id',
  raisonSociale: 'raisonSociale',
  nif: 'nif',
  rccm: 'rccm',
  typeContribuableCode: 'typeContribuableCode',
  statutFiscalCode: 'statutFiscalCode',
  secteur: 'secteur',
  region: 'region',
  emailContact: 'emailContact',
  telephone: 'telephone',
  adresse: 'adresse',
  accordSiegeId: 'accordSiegeId',
  userId: 'userId'
};

exports.Prisma.CodeAdditionnelOrderByRelevanceFieldEnum = {
  id: 'id',
  baseJuridiqueVersionId: 'baseJuridiqueVersionId',
  code: 'code',
  sourceCode: 'sourceCode'
};

exports.Prisma.ConnecteurLogOrderByRelevanceFieldEnum = {
  id: 'id',
  connecteurId: 'connecteurId',
  direction: 'direction',
  operation: 'operation',
  messageErreur: 'messageErreur'
};

exports.Prisma.ConnecteurOrderByRelevanceFieldEnum = {
  id: 'id',
  nom: 'nom',
  codeSysteme: 'codeSysteme',
  institutionId: 'institutionId',
  statutCode: 'statutCode',
  endpoint: 'endpoint'
};

exports.Prisma.ConventionEngagementOrderByRelevanceFieldEnum = {
  id: 'id',
  conventionId: 'conventionId',
  typeEngagement: 'typeEngagement',
  commentaire: 'commentaire'
};

exports.Prisma.ConventionOrderByRelevanceFieldEnum = {
  id: 'id',
  reference: 'reference',
  contribuableId: 'contribuableId',
  baseJuridiqueVersionId: 'baseJuridiqueVersionId',
  accordSiegeId: 'accordSiegeId',
  regimeCode: 'regimeCode',
  statutCode: 'statutCode',
  zoneZfi: 'zoneZfi',
  objet: 'objet'
};

exports.Prisma.PermisMinierOrderByRelevanceFieldEnum = {
  id: 'id',
  reference: 'reference',
  contribuableId: 'contribuableId',
  conventionId: 'conventionId',
  typePermis: 'typePermis',
  substance: 'substance',
  localite: 'localite',
  lienRapportEie: 'lienRapportEie',
  modeOctroi: 'modeOctroi',
  statut: 'statut'
};

exports.Prisma.DecisionOrderByRelevanceFieldEnum = {
  id: 'id',
  demandeId: 'demandeId',
  utilisateurId: 'utilisateurId',
  typeCode: 'typeCode',
  motif: 'motif',
  documentUrl: 'documentUrl',
  hashSha256: 'hashSha256',
  pinHash: 'pinHash'
};

exports.Prisma.DemandeComplementOrderByRelevanceFieldEnum = {
  id: 'id',
  demandeId: 'demandeId',
  instructeurId: 'instructeurId',
  motif: 'motif',
  piecesAttendues: 'piecesAttendues',
  statutCode: 'statutCode'
};

exports.Prisma.DemandeSyncExterneOrderByRelevanceFieldEnum = {
  id: 'id',
  demandeId: 'demandeId',
  connecteurId: 'connecteurId',
  operation: 'operation',
  statutCode: 'statutCode',
  messageErreur: 'messageErreur'
};

exports.Prisma.DemandeWorkflowEtapeOrderByRelevanceFieldEnum = {
  id: 'id',
  instanceId: 'instanceId',
  templateEtapeId: 'templateEtapeId',
  nomEtape: 'nomEtape',
  acteurRole: 'acteurRole',
  acteurId: 'acteurId',
  statutCode: 'statutCode',
  commentaire: 'commentaire'
};

exports.Prisma.DemandeWorkflowInstanceOrderByRelevanceFieldEnum = {
  id: 'id',
  demandeId: 'demandeId',
  workflowTemplateId: 'workflowTemplateId',
  statutCode: 'statutCode'
};

exports.Prisma.DemandeOrderByRelevanceFieldEnum = {
  id: 'id',
  reference: 'reference',
  baseJuridiqueVersionId: 'baseJuridiqueVersionId',
  contribuableId: 'contribuableId',
  conventionId: 'conventionId',
  instructeurId: 'instructeurId',
  statutCode: 'statutCode',
  devise: 'devise',
  secteur: 'secteur',
  etapeActuelle: 'etapeActuelle',
  motifRejet: 'motifRejet'
};

exports.Prisma.ImportMrdOrderByRelevanceFieldEnum = {
  id: 'id',
  nomFichier: 'nomFichier',
  typeFichier: 'typeFichier',
  statutCode: 'statutCode',
  fichierErreursUrl: 'fichierErreursUrl',
  lanceParId: 'lanceParId'
};

exports.Prisma.InstitutionOrderByRelevanceFieldEnum = {
  id: 'id',
  code: 'code',
  nom: 'nom',
  typeCode: 'typeCode'
};

exports.Prisma.JobQueueOrderByRelevanceFieldEnum = {
  id: 'id',
  typeJobCode: 'typeJobCode',
  statutCode: 'statutCode',
  erreur: 'erreur'
};

exports.Prisma.NotificationPreferenceOrderByRelevanceFieldEnum = {
  id: 'id',
  utilisateurId: 'utilisateurId',
  typeNotificationCode: 'typeNotificationCode',
  canalCode: 'canalCode'
};

exports.Prisma.NotificationQueueOrderByRelevanceFieldEnum = {
  id: 'id',
  utilisateurId: 'utilisateurId',
  demandeId: 'demandeId',
  typeNotificationCode: 'typeNotificationCode',
  canalCode: 'canalCode',
  sujet: 'sujet',
  corps: 'corps',
  statutCode: 'statutCode',
  erreur: 'erreur'
};

exports.Prisma.NotificationTemplateOrderByRelevanceFieldEnum = {
  id: 'id',
  code: 'code',
  typeNotificationCode: 'typeNotificationCode',
  canalCode: 'canalCode',
  sujet: 'sujet',
  corps: 'corps',
  variables: 'variables'
};

exports.Prisma.NotificationOrderByRelevanceFieldEnum = {
  id: 'id',
  utilisateurId: 'utilisateurId',
  demandeId: 'demandeId',
  typeNotificationCode: 'typeNotificationCode',
  canalCode: 'canalCode',
  titre: 'titre',
  corps: 'corps',
  queueId: 'queueId'
};

exports.Prisma.OpendataPublicationOrderByRelevanceFieldEnum = {
  id: 'id',
  titre: 'titre',
  description: 'description',
  fichierUrl: 'fichierUrl'
};

exports.Prisma.ParametreSystemeOrderByRelevanceFieldEnum = {
  id: 'id',
  code: 'code',
  typeParametreCode: 'typeParametreCode',
  libelle: 'libelle',
  valeur: 'valeur',
  description: 'description'
};

exports.Prisma.PieceJointeOrderByRelevanceFieldEnum = {
  id: 'id',
  demandeId: 'demandeId',
  contribuableId: 'contribuableId',
  nomFichier: 'nomFichier',
  typeMime: 'typeMime',
  rangCode: 'rangCode',
  categorie: 'categorie',
  typeDocumentCode: 'typeDocumentCode',
  urlStockage: 'urlStockage',
  hashSha256: 'hashSha256',
  valideParId: 'valideParId',
  commentaireValidation: 'commentaireValidation'
};

exports.Prisma.PushTokenOrderByRelevanceFieldEnum = {
  id: 'id',
  utilisateurId: 'utilisateurId',
  token: 'token',
  canalPushCode: 'canalPushCode',
  deviceId: 'deviceId',
  modeleAppareil: 'modeleAppareil',
  systemeExploitation: 'systemeExploitation',
  versionApp: 'versionApp'
};

exports.Prisma.QuotaMouvementOrderByRelevanceFieldEnum = {
  id: 'id',
  quotaId: 'quotaId',
  demandeId: 'demandeId',
  typeMouvementCode: 'typeMouvementCode',
  commentaire: 'commentaire'
};

exports.Prisma.QuotaOrderByRelevanceFieldEnum = {
  id: 'id',
  baseJuridiqueVersionId: 'baseJuridiqueVersionId',
  contribuableId: 'contribuableId',
  conventionId: 'conventionId',
  typeQuotaCode: 'typeQuotaCode',
  uniteCode: 'uniteCode'
};

exports.Prisma.RefCanalNotificationOrderByRelevanceFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  couleur: 'couleur'
};

exports.Prisma.RefCanalPushOrderByRelevanceFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  couleur: 'couleur'
};

exports.Prisma.RefCategorieAnomalieOrderByRelevanceFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  couleur: 'couleur'
};

exports.Prisma.RefEtatJobOrderByRelevanceFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  couleur: 'couleur'
};

exports.Prisma.RefGraviteAnomalieOrderByRelevanceFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  couleur: 'couleur'
};

exports.Prisma.RefModeInstructionOrderByRelevanceFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  couleur: 'couleur'
};

exports.Prisma.RefNatureMesureOrderByRelevanceFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  couleur: 'couleur'
};

exports.Prisma.RefOrganeGestionOrderByRelevanceFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  couleur: 'couleur'
};

exports.Prisma.RefPorteeCategorieOrderByRelevanceFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  couleur: 'couleur'
};

exports.Prisma.RefRangPieceOrderByRelevanceFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  couleur: 'couleur'
};

exports.Prisma.RefRegimeConventionOrderByRelevanceFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  couleur: 'couleur'
};

exports.Prisma.RefRoleOrderByRelevanceFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  couleur: 'couleur'
};

exports.Prisma.RefSourceCodeOrderByRelevanceFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  couleur: 'couleur'
};

exports.Prisma.RefSourceDetectionOrderByRelevanceFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  couleur: 'couleur'
};

exports.Prisma.RefStatutAnomalieOrderByRelevanceFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  couleur: 'couleur'
};

exports.Prisma.RefStatutArchivageOrderByRelevanceFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  couleur: 'couleur'
};

exports.Prisma.RefStatutConnecteurOrderByRelevanceFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  couleur: 'couleur'
};

exports.Prisma.RefStatutConventionOrderByRelevanceFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  couleur: 'couleur'
};

exports.Prisma.RefStatutDemandeOrderByRelevanceFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  couleur: 'couleur'
};

exports.Prisma.RefStatutEtapeOrderByRelevanceFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  couleur: 'couleur'
};

exports.Prisma.RefStatutFiscalOrderByRelevanceFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  couleur: 'couleur'
};

exports.Prisma.RefStatutNotificationOrderByRelevanceFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  couleur: 'couleur'
};

exports.Prisma.RefStatutUtilisateurOrderByRelevanceFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  couleur: 'couleur'
};

exports.Prisma.RefTypeAccordSiegeOrderByRelevanceFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  couleur: 'couleur'
};

exports.Prisma.RefTypeActeOrderByRelevanceFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  couleur: 'couleur'
};

exports.Prisma.RefTypeAgrementOrderByRelevanceFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  couleur: 'couleur'
};

exports.Prisma.RefTypeContribuableOrderByRelevanceFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  couleur: 'couleur'
};

exports.Prisma.RefTypeDecisionOrderByRelevanceFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  couleur: 'couleur'
};

exports.Prisma.RefTypeDocumentOrderByRelevanceFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  couleur: 'couleur'
};

exports.Prisma.RefTypeInstitutionOrderByRelevanceFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  couleur: 'couleur'
};

exports.Prisma.RefTypeJobOrderByRelevanceFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  couleur: 'couleur'
};

exports.Prisma.RefTypeMouvementQuotaOrderByRelevanceFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  couleur: 'couleur'
};

exports.Prisma.RefTypeNotificationOrderByRelevanceFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  couleur: 'couleur'
};

exports.Prisma.RefTypeParametreOrderByRelevanceFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  couleur: 'couleur'
};

exports.Prisma.RefTypeQuotaOrderByRelevanceFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  couleur: 'couleur'
};

exports.Prisma.RefTypeRapportOrderByRelevanceFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  couleur: 'couleur'
};

exports.Prisma.RefUniteQuotaOrderByRelevanceFieldEnum = {
  code: 'code',
  libelle: 'libelle',
  description: 'description',
  couleur: 'couleur'
};

exports.Prisma.RefreshTokenOrderByRelevanceFieldEnum = {
  id: 'id',
  utilisateurId: 'utilisateurId',
  tokenHash: 'tokenHash',
  ip: 'ip',
  userAgent: 'userAgent'
};

exports.Prisma.RegleAnomalieOrderByRelevanceFieldEnum = {
  id: 'id',
  code: 'code',
  nom: 'nom',
  categorieCode: 'categorieCode',
  graviteCode: 'graviteCode',
  description: 'description',
  expression: 'expression'
};

exports.Prisma.ReportingAggregatOrderByRelevanceFieldEnum = {
  id: 'id',
  typeTexte1: 'typeTexte1',
  impotConcerne: 'impotConcerne',
  natureMesureCode: 'natureMesureCode',
  typeContribuableCode: 'typeContribuableCode',
  regimeCode: 'regimeCode',
  region: 'region',
  secteur: 'secteur'
};

exports.Prisma.ReportingExecutionOrderByRelevanceFieldEnum = {
  id: 'id',
  typeRapportCode: 'typeRapportCode',
  fichierUrl: 'fichierUrl',
  hashFichier: 'hashFichier',
  statutCode: 'statutCode',
  messageErreur: 'messageErreur'
};

exports.Prisma.ResetPasswordTokenOrderByRelevanceFieldEnum = {
  id: 'id',
  utilisateurId: 'utilisateurId',
  tokenHash: 'tokenHash'
};

exports.Prisma.RolePermissionOrderByRelevanceFieldEnum = {
  role: 'role',
  ressource: 'ressource',
  action: 'action',
  perimetre: 'perimetre'
};

exports.Prisma.SessionUtilisateurOrderByRelevanceFieldEnum = {
  id: 'id',
  utilisateurId: 'utilisateurId',
  jetonSessionHash: 'jetonSessionHash',
  ip: 'ip',
  userAgent: 'userAgent',
  pays: 'pays',
  ville: 'ville'
};

exports.Prisma.SystemLogOrderByRelevanceFieldEnum = {
  id: 'id',
  niveau: 'niveau',
  source: 'source',
  message: 'message',
  trace: 'trace'
};

exports.Prisma.UtilisateurOrderByRelevanceFieldEnum = {
  id: 'id',
  nom: 'nom',
  prenom: 'prenom',
  email: 'email',
  passwordHash: 'passwordHash',
  role: 'role',
  institutionId: 'institutionId',
  statutCode: 'statutCode',
  mfaSecretEnc: 'mfaSecretEnc',
  pinHash: 'pinHash',
  secteurAffecte: 'secteurAffecte',
  telephone: 'telephone',
  ipDerniereCx: 'ipDerniereCx'
};

exports.Prisma.WorkflowTemplateEtapeOrderByRelevanceFieldEnum = {
  id: 'id',
  workflowTemplateId: 'workflowTemplateId',
  nomEtape: 'nomEtape',
  acteurRole: 'acteurRole',
  institutionTypeCode: 'institutionTypeCode',
  conditionActivation: 'conditionActivation',
  actionDeclenchee: 'actionDeclenchee'
};

exports.Prisma.WorkflowTemplateTransitionOrderByRelevanceFieldEnum = {
  id: 'id',
  workflowTemplateId: 'workflowTemplateId',
  action: 'action',
  conditionTransition: 'conditionTransition'
};

exports.Prisma.WorkflowTemplateOrderByRelevanceFieldEnum = {
  id: 'id',
  code: 'code',
  nom: 'nom',
  description: 'description',
  baseJuridiqueVersionId: 'baseJuridiqueVersionId',
  typeTexte1: 'typeTexte1',
  organeGestionCode: 'organeGestionCode'
};

exports.Prisma.PhoneOtpCodeOrderByRelevanceFieldEnum = {
  id: 'id',
  telephone: 'telephone',
  contexte: 'contexte',
  codeHash: 'codeHash',
  sel: 'sel',
  ipOrigine: 'ipOrigine'
};

exports.Prisma.SystemConfigOrderByRelevanceFieldEnum = {
  key: 'key',
  value: 'value'
};

exports.Prisma.MfaChallengeOrderByRelevanceFieldEnum = {
  id: 'id',
  utilisateurId: 'utilisateurId',
  canal: 'canal',
  codeHash: 'codeHash',
  sel: 'sel'
};

exports.Prisma.MissionOrderByRelevanceFieldEnum = {
  id: 'id',
  reference: 'reference',
  titre: 'titre',
  type: 'type',
  statut: 'statut',
  organe: 'organe',
  auditeurId: 'auditeurId',
  demandeId: 'demandeId',
  constats: 'constats',
  recommandations: 'recommandations'
};


exports.Prisma.ModelName = {
  AccordSiege: 'AccordSiege',
  Acte: 'Acte',
  AgrementContribuable: 'AgrementContribuable',
  Agrement: 'Agrement',
  Anomalie: 'Anomalie',
  Archivage: 'Archivage',
  AuditLog: 'AuditLog',
  BaseJuridiqueDocument: 'BaseJuridiqueDocument',
  BaseJuridiqueVersion: 'BaseJuridiqueVersion',
  BaseJuridique: 'BaseJuridique',
  ContribuableHistoriqueFiscal: 'ContribuableHistoriqueFiscal',
  Contribuable: 'Contribuable',
  CodeAdditionnel: 'CodeAdditionnel',
  ConnecteurLog: 'ConnecteurLog',
  Connecteur: 'Connecteur',
  ConventionEngagement: 'ConventionEngagement',
  Convention: 'Convention',
  PermisMinier: 'PermisMinier',
  Decision: 'Decision',
  DemandeComplement: 'DemandeComplement',
  DemandeSyncExterne: 'DemandeSyncExterne',
  DemandeWorkflowEtape: 'DemandeWorkflowEtape',
  DemandeWorkflowInstance: 'DemandeWorkflowInstance',
  Demande: 'Demande',
  ImportMrd: 'ImportMrd',
  Institution: 'Institution',
  JobQueue: 'JobQueue',
  NotificationPreference: 'NotificationPreference',
  NotificationQueue: 'NotificationQueue',
  NotificationTemplate: 'NotificationTemplate',
  Notification: 'Notification',
  OpendataPublication: 'OpendataPublication',
  ParametreSysteme: 'ParametreSysteme',
  PieceJointe: 'PieceJointe',
  PushToken: 'PushToken',
  QuotaMouvement: 'QuotaMouvement',
  Quota: 'Quota',
  RefCanalNotification: 'RefCanalNotification',
  RefCanalPush: 'RefCanalPush',
  RefCategorieAnomalie: 'RefCategorieAnomalie',
  RefEtatJob: 'RefEtatJob',
  RefGraviteAnomalie: 'RefGraviteAnomalie',
  RefModeInstruction: 'RefModeInstruction',
  RefNatureMesure: 'RefNatureMesure',
  RefOrganeGestion: 'RefOrganeGestion',
  RefPorteeCategorie: 'RefPorteeCategorie',
  RefRangPiece: 'RefRangPiece',
  RefRegimeConvention: 'RefRegimeConvention',
  RefRole: 'RefRole',
  RefSourceCode: 'RefSourceCode',
  RefSourceDetection: 'RefSourceDetection',
  RefStatutAnomalie: 'RefStatutAnomalie',
  RefStatutArchivage: 'RefStatutArchivage',
  RefStatutConnecteur: 'RefStatutConnecteur',
  RefStatutConvention: 'RefStatutConvention',
  RefStatutDemande: 'RefStatutDemande',
  RefStatutEtape: 'RefStatutEtape',
  RefStatutFiscal: 'RefStatutFiscal',
  RefStatutNotification: 'RefStatutNotification',
  RefStatutUtilisateur: 'RefStatutUtilisateur',
  RefTypeAccordSiege: 'RefTypeAccordSiege',
  RefTypeActe: 'RefTypeActe',
  RefTypeAgrement: 'RefTypeAgrement',
  RefTypeContribuable: 'RefTypeContribuable',
  RefTypeDecision: 'RefTypeDecision',
  RefTypeDocument: 'RefTypeDocument',
  RefTypeInstitution: 'RefTypeInstitution',
  RefTypeJob: 'RefTypeJob',
  RefTypeMouvementQuota: 'RefTypeMouvementQuota',
  RefTypeNotification: 'RefTypeNotification',
  RefTypeParametre: 'RefTypeParametre',
  RefTypeQuota: 'RefTypeQuota',
  RefTypeRapport: 'RefTypeRapport',
  RefUniteQuota: 'RefUniteQuota',
  RefreshToken: 'RefreshToken',
  RegleAnomalie: 'RegleAnomalie',
  ReportingAggregat: 'ReportingAggregat',
  ReportingExecution: 'ReportingExecution',
  ResetPasswordToken: 'ResetPasswordToken',
  RolePermission: 'RolePermission',
  SessionUtilisateur: 'SessionUtilisateur',
  SystemLog: 'SystemLog',
  Utilisateur: 'Utilisateur',
  WorkflowTemplateEtape: 'WorkflowTemplateEtape',
  WorkflowTemplateTransition: 'WorkflowTemplateTransition',
  WorkflowTemplate: 'WorkflowTemplate',
  PhoneOtpCode: 'PhoneOtpCode',
  SystemConfig: 'SystemConfig',
  MfaChallenge: 'MfaChallenge',
  Mission: 'Mission'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }

        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
