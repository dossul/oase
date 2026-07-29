// OASE E1.3 — Création des conventions extractives réelles via POST /conventions
// (rôle agent_dgmg — prouve le endpoint CRUD de bout en bout).
// Données de recette calquées sur le périmètre ITIE 2024 (kb/itie).
const API = 'https://api.oase.ulia.site/api/v1'
const PASSWORD = 'Oase@2026!'

const login = async (email) => {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD }),
  })
  if (!res.ok) throw new Error(`login ${email} -> ${res.status}`)
  return (await res.json()).access_token
}

const CONVENTIONS = [
  { reference: 'CONV-EXTR-2024-SNPT', contribuableId: 'c0000000-0000-0000-0000-000000000201', regimeCode: 'Minier', dateDebut: '2024-01-01', dateFin: '2034-12-31', montantEstime: '15000000000', emploisEngages: 1200, emploisCrees: 80, objet: 'Convention minière phosphates — avantages phase exploitation' },
  { reference: 'CONV-EXTR-2024-STM', contribuableId: 'c0000000-0000-0000-0000-000000000204', regimeCode: 'Minier', dateDebut: '2024-06-01', dateFin: '2029-05-31', montantEstime: '8000000000', emploisEngages: 450, emploisCrees: 30, objet: 'Convention minière manganèse — phase exploitation' },
  { reference: 'CONV-EXTR-2023-SCANTOGO', contribuableId: 'c0000000-0000-0000-0000-000000000202', regimeCode: 'Minier', dateDebut: '2023-01-01', dateFin: '2028-12-31', montantEstime: '6000000000', emploisEngages: 800, emploisCrees: 50, objet: 'Convention minière calcaire Tabligbo' },
  { reference: 'CONV-EXTR-2023-WACEM', contribuableId: 'c0000000-0000-0000-0000-000000000203', regimeCode: 'Minier', dateDebut: '2023-03-01', dateFin: '2028-02-29', montantEstime: '5000000000', emploisEngages: 700, emploisCrees: 40, objet: 'Convention minière calcaire — cimenterie' },
  { reference: 'CONV-EXTR-2025-GRANUTOGO', contribuableId: 'c0000000-0000-0000-0000-000000000205', regimeCode: 'Minier', dateDebut: '2025-01-01', dateFin: '2030-12-31', montantEstime: '1500000000', emploisEngages: 120, emploisCrees: 15, objet: 'Convention carrière granulats' },
  { reference: 'CONV-EXTR-2025-TOGOCARRIERE', contribuableId: 'c0000000-0000-0000-0000-000000000206', regimeCode: 'Minier', dateDebut: '2025-02-01', dateFin: '2030-01-31', montantEstime: '1200000000', emploisEngages: 100, emploisCrees: 10, objet: 'Convention carrière granulats' },
  { reference: 'CONV-EXTR-2024-CIMCO', contribuableId: 'c0000000-0000-0000-0000-000000000207', regimeCode: 'Minier', dateDebut: '2024-04-01', dateFin: '2029-03-31', montantEstime: '3000000000', emploisEngages: 300, emploisCrees: 25, objet: 'Convention minière calcaire — cimenterie' },
  { reference: 'CONV-EXTR-2022-POMAR', contribuableId: 'c0000000-0000-0000-0000-000000000208', regimeCode: 'Minier', dateDebut: '2022-01-01', dateFin: '2026-12-31', montantEstime: '900000000', emploisEngages: 80, emploisCrees: 5, objet: 'Convention marbrerie — échéance proche (test alertes)' },
  { reference: 'CONV-EXTR-2024-TDE', contribuableId: 'c0000000-0000-0000-0000-000000000209', regimeCode: 'Autre', dateDebut: '2024-01-01', dateFin: '2029-12-31', montantEstime: '2000000000', emploisEngages: 500, emploisCrees: 20, objet: 'Convention prélèvement eau — suivi ITIE' },
  { reference: 'CONV-EXTR-2023-TOGORAIL', contribuableId: 'c0000000-0000-0000-0000-000000000210', regimeCode: 'Autre', dateDebut: '2023-07-01', dateFin: '2028-06-30', montantEstime: '4000000000', emploisEngages: 250, emploisCrees: 15, objet: 'Convention transport minerais — suivi ITIE' },
]

const token = await login('agent.dgmg@oase.tg')
console.log('login agent_dgmg OK')

let crees = 0, existantes = 0, erreurs = 0
for (const c of CONVENTIONS) {
  const res = await fetch(`${API}/conventions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(c),
  })
  const body = await res.json().catch(() => ({}))
  if (res.status === 201 || res.status === 200) { crees++; console.log(`+ ${c.reference} créée`) }
  else if (res.status === 409) { existantes++; console.log(`= ${c.reference} déjà présente`) }
  else { erreurs++; console.log(`! ${c.reference} -> ${res.status} ${JSON.stringify(body).slice(0, 200)}`) }
}
console.log(`\nBilan : ${crees} créées, ${existantes} existantes, ${erreurs} erreurs`)

// Vérification : GET /conventions
const liste = await fetch(`${API}/conventions`, { headers: { Authorization: `Bearer ${token}` } })
const data = await liste.json()
const arr = Array.isArray(data) ? data : data.data ?? []
console.log(`GET /conventions -> ${liste.status}, ${arr.length} convention(s)`)
for (const c of arr) console.log(`  ${c.reference} | ${c.contribuables?.raisonSociale} | ${c.regimeCode} | ${c.statutCode} | fin ${String(c.dateFin).slice(0, 10)}`)
