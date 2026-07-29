// E2 — Seed répertoire minier : 10 permis réalistes (Annexe 1.1 feuilles 16-17)
// Idempotent : 409 (référence déjà utilisée) = déjà présent.
const API = process.env.TEST_API_URL || 'https://api.oase.ulia.site/api/v1';

const PERMIS = [
  { reference: 'PE-2020-SNPT', nif: '1000160416', typePermis: 'exploitation', substance: 'Phosphates', dateDemande: '2019-06-12', dateOctroi: '2020-03-15', dureeAnnees: 25, superficieKm2: 35.5, localite: 'Hahotoé-Kpogamé (Maritime)', longitude: 1.5920, latitude: 6.2330, rapportEiePublic: true, lienRapportEie: 'https://itie.tg/rapports/eie-snpt-2019.pdf', modeOctroi: 'gre_a_gre' },
  { reference: 'PE-2011-STM', nif: '1001950093', typePermis: 'exploitation', substance: 'Manganèse', dateDemande: '2010-02-08', dateOctroi: '2011-05-20', dureeAnnees: 25, superficieKm2: 92.4, localite: 'Nayega (Région du Nord)', longitude: 0.8650, latitude: 9.7650, rapportEiePublic: true, lienRapportEie: 'https://itie.tg/rapports/eie-stm-2010.pdf', modeOctroi: 'ao_international' },
  { reference: 'PC-2012-SCANTOGO', nif: '1000161343', typePermis: 'carriere', substance: 'Calcaire', dateDemande: '2011-09-30', dateOctroi: '2012-11-01', dureeAnnees: 20, superficieKm2: 4.2, localite: 'Tabligbo (Maritime)', longitude: 1.5010, latitude: 6.5890, rapportEiePublic: true, lienRapportEie: 'https://itie.tg/rapports/eie-scantogo-2011.pdf', modeOctroi: 'ao_ouvert' },
  { reference: 'PC-2014-WACEM', nif: '1000144278', typePermis: 'carriere', substance: 'Calcaire', dateDemande: '2013-04-17', dateOctroi: '2014-02-10', dureeAnnees: 20, superficieKm2: 5.8, localite: 'Tabligbo (Maritime)', longitude: 1.5050, latitude: 6.5920, rapportEiePublic: true, lienRapportEie: 'https://itie.tg/rapports/eie-wacem-2013.pdf', modeOctroi: 'ao_ouvert' },
  { reference: 'PC-2015-GRANUTOGO', nif: '1000165159', typePermis: 'carriere', substance: 'Granit', dateDemande: '2014-07-22', dateOctroi: '2015-03-05', dureeAnnees: 15, superficieKm2: 2.1, localite: 'Agou-Gadzépé (Plateaux)', longitude: 0.6920, latitude: 6.8450, rapportEiePublic: false, modeOctroi: 'premier_venu' },
  { reference: 'PC-2016-TOGOCARRIERE', nif: '1000175347', typePermis: 'carriere', substance: 'Granit', dateDemande: '2015-11-09', dateOctroi: '2016-06-14', dureeAnnees: 15, superficieKm2: 3.3, localite: 'Kpalimé (Plateaux)', longitude: 0.6310, latitude: 6.9080, rapportEiePublic: false, modeOctroi: 'premier_venu' },
  { reference: 'PC-2013-CIMCO', nif: '1001796185', typePermis: 'carriere', substance: 'Calcaire', dateDemande: '2012-05-18', dateOctroi: '2013-01-25', dureeAnnees: 20, superficieKm2: 6.7, localite: 'Tabligbo (Maritime)', longitude: 1.5080, latitude: 6.5850, rapportEiePublic: true, lienRapportEie: 'https://itie.tg/rapports/eie-cimco-2012.pdf', modeOctroi: 'ao_restreint' },
  { reference: 'PR-2023-POMAR', nif: '1000165087', typePermis: 'recherche', substance: 'Phosphates', dateDemande: '2022-10-02', dateOctroi: '2023-04-11', dureeAnnees: 4, superficieKm2: 48.0, localite: 'Dagbati (Maritime)', longitude: 1.4620, latitude: 6.3120, rapportEiePublic: false, modeOctroi: 'ao_restreint' },
  { reference: 'PR-2022-TDE', nif: '1000166680', typePermis: 'recherche', substance: 'Calcaire', dateDemande: '2021-08-15', dateOctroi: '2022-02-28', dureeAnnees: 4, superficieKm2: 61.5, localite: 'Avétonou (Maritime)', longitude: 1.2890, latitude: 6.4720, rapportEiePublic: false, modeOctroi: 'ao_ouvert' },
  { reference: 'PC-2018-TOGORAIL', nif: '1000174447', typePermis: 'carriere', substance: 'Ballast ferroviaire', dateDemande: '2017-06-30', dateOctroi: '2018-01-19', dureeAnnees: 10, superficieKm2: 1.4, localite: 'Blitta (Centrale)', longitude: 0.9940, latitude: 8.3150, rapportEiePublic: false, modeOctroi: 'gre_a_gre' },
];

async function login() {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'agent.dgmg@oase.tg', password: 'Oase@2026!' }),
  });
  if (!res.ok) throw new Error(`login ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.access_token || data.accessToken;
}

async function main() {
  const token = await login();
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const conventions = await fetch(`${API}/conventions`, { headers }).then((r) => r.json());
  const parNif = new Map(conventions.map((c) => [c.contribuables?.nif, c.contribuableId]));
  const parContribuableConvention = new Map(conventions.map((c) => [c.contribuableId, c.id]));

  let crees = 0, presents = 0, erreurs = 0;
  for (const p of PERMIS) {
    const contribuableId = parNif.get(p.nif);
    if (!contribuableId) { console.error(`NIF introuvable: ${p.nif}`); erreurs++; continue; }
    const { nif, ...corps } = p;
    const res = await fetch(`${API}/permis-miniers`, {
      method: 'POST', headers,
      body: JSON.stringify({ ...corps, contribuableId, conventionId: parContribuableConvention.get(contribuableId) }),
    });
    if (res.status === 201) { crees++; console.log(`CREE ${p.reference}`); }
    else if (res.status === 409) { presents++; console.log(`PRESENT ${p.reference}`); }
    else { erreurs++; console.error(`ERREUR ${p.reference}: ${res.status} ${await res.text()}`); }
  }
  console.log(`\nBilan: ${crees} créés, ${presents} déjà présents, ${erreurs} erreurs`);
  if (erreurs > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
