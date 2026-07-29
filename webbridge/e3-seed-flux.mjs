// E3 — Seed flux financiers extractifs 2024 (Annexe 1.1 feuilles 3-6)
// Idempotent : 409 (période déjà déclarée) = déjà présent.
const API = process.env.TEST_API_URL || 'https://api.oase.ulia.site/api/v1';

const SNPT = '1000160416';
const STM = '1001950093';

const PRODUCTIONS = [
  { nif: SNPT, permisRef: 'PE-2020-SNPT', annee: 2024, mois: 6, substance: 'Phosphates', volumeProduitT: 95000, volumeVenduT: 88000, volumeTraiteT: 92000, valeurMarchandeFcfa: 1250000000, valeurMarchandeUsd: 2100000, chiffreAffairesFcfa: 1180000000 },
  { nif: SNPT, permisRef: 'PE-2020-SNPT', annee: 2024, mois: 7, substance: 'Phosphates', volumeProduitT: 98000, volumeVenduT: 90000, volumeTraiteT: 95000, valeurMarchandeFcfa: 1290000000, valeurMarchandeUsd: 2150000, chiffreAffairesFcfa: 1220000000 },
  { nif: STM, permisRef: 'PE-2011-STM', annee: 2024, mois: 6, substance: 'Manganèse', volumeProduitT: 12000, volumeVenduT: 11500, volumeTraiteT: 11800, valeurMarchandeFcfa: 850000000, valeurMarchandeUsd: 1450000, chiffreAffairesFcfa: 810000000 },
];

const EXPORTATIONS = [
  { nif: SNPT, annee: 2024, mois: 6, substance: 'Phosphates', volumeT: 85000, valeurFcfa: 1150000000, valeurUsd: 1950000, destination: 'Inde' },
  { nif: SNPT, annee: 2024, mois: 7, substance: 'Phosphates', volumeT: 87000, valeurFcfa: 1180000000, valeurUsd: 1980000, destination: 'Chine' },
  { nif: STM, annee: 2024, mois: 6, substance: 'Manganèse', volumeT: 11000, valeurFcfa: 790000000, valeurUsd: 1350000, destination: 'Chine' },
];

const REDEVANCES = [
  { nif: SNPT, annee: 2024, trimestre: 1, substance: 'Phosphates', baseAssietteFcfa: 3500000000, taux: 3.5, montantDuFcfa: 122500000, montantPayeFcfa: 122500000, datePaiement: '2024-04-15', referencePaiement: 'QTR-2024-T1-SNPT' },
  { nif: SNPT, annee: 2024, trimestre: 2, substance: 'Phosphates', baseAssietteFcfa: 3600000000, taux: 3.5, montantDuFcfa: 126000000, montantPayeFcfa: 126000000, datePaiement: '2024-07-15', referencePaiement: 'QTR-2024-T2-SNPT' },
  { nif: STM, annee: 2024, trimestre: 1, substance: 'Manganèse', baseAssietteFcfa: 2400000000, taux: 3.0, montantDuFcfa: 72000000, montantPayeFcfa: 72000000, datePaiement: '2024-04-20', referencePaiement: 'QTR-2024-T1-STM' },
];

const TRANSFERTS = [
  { nif: SNPT, annee: 2024, commune: 'Lacs 1', chiffreAffairesAnnuelFcfa: 12500000000, montantDuFcfa: 93750000, montantEncaisseFcfa: 93750000, dateEncaissement: '2025-03-31' },
  { nif: STM, annee: 2024, commune: 'Tône 3', chiffreAffairesAnnuelFcfa: 8100000000, montantDuFcfa: 60750000, montantEncaisseFcfa: 30000000, dateEncaissement: '2025-04-15' },
];

async function login() {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'agent.dgmg@oase.tg', password: 'Oase@2026!' }),
  });
  if (!res.ok) throw new Error(`login ${res.status}: ${await res.text()}`);
  return (await res.json()).access_token;
}

async function poster(headers, chemin, corps, label, compteurs) {
  const res = await fetch(`${API}/flux-extractifs/${chemin}`, {
    method: 'POST', headers, body: JSON.stringify(corps),
  });
  if (res.status === 201) { compteurs.crees++; console.log(`CREE ${label}`); }
  else if (res.status === 409) { compteurs.presents++; console.log(`PRESENT ${label}`); }
  else { compteurs.erreurs++; console.error(`ERREUR ${label}: ${res.status} ${await res.text()}`); }
}

async function main() {
  const token = await login();
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const [conventions, permis] = await Promise.all([
    fetch(`${API}/conventions`, { headers }).then((r) => r.json()),
    fetch(`${API}/permis-miniers`, { headers }).then((r) => r.json()),
  ]);
  const parNif = new Map(conventions.map((c) => [c.contribuables?.nif, c.contribuableId]));
  const permisParRef = new Map(permis.map((p) => [p.reference, p.id]));

  const compteurs = { crees: 0, presents: 0, erreurs: 0 };
  for (const p of PRODUCTIONS) {
    const { nif, permisRef, ...corps } = p;
    await poster(headers, 'productions', { ...corps, contribuableId: parNif.get(nif), permisId: permisParRef.get(permisRef) }, `PROD ${nif} ${p.annee}-${p.mois}`, compteurs);
  }
  for (const e of EXPORTATIONS) {
    const { nif, ...corps } = e;
    await poster(headers, 'exportations', { ...corps, contribuableId: parNif.get(nif) }, `EXP ${nif} ${e.annee}-${e.mois}`, compteurs);
  }
  for (const r of REDEVANCES) {
    const { nif, ...corps } = r;
    await poster(headers, 'redevances', { ...corps, contribuableId: parNif.get(nif) }, `RED ${nif} ${r.annee}-T${r.trimestre}`, compteurs);
  }
  for (const t of TRANSFERTS) {
    const { nif, ...corps } = t;
    await poster(headers, 'transferts-communes', { ...corps, contribuableId: parNif.get(nif) }, `CFLDR ${nif} ${t.annee} ${t.commune}`, compteurs);
  }

  console.log(`\nBilan: ${compteurs.crees} créés, ${compteurs.presents} déjà présents, ${compteurs.erreurs} erreurs`);
  if (compteurs.erreurs > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
