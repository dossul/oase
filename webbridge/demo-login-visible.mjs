// Démonstration visible : connexion réelle sur https://oase.ulia.site/login
// Le navigateur s'ouvre, saisit les identifiants LENTEMENT (visible), clique, et
// reste ouvert sur le dashboard pour que l'utilisateur voie le résultat.
import { chromium } from '@playwright/test'

const navigateur = await chromium.launch({ headless: false, slowMo: 400 })
const page = await navigateur.newPage({ viewport: { width: 1280, height: 800 } })

await page.goto('https://oase.ulia.site/login')
await page.waitForTimeout(2000)

// Saisie caractère par caractère — chaque frappe est visible à l'écran
await page.getByLabel(/Identifiant/).pressSequentially('kossiwa.amele@texlome.tg', { delay: 60 })
await page.getByLabel('Mot de passe', { exact: true }).pressSequentially('Oase@2026!', { delay: 120 })

await page.waitForTimeout(1000)
await page.getByRole('button', { name: 'Se connecter' }).click()

// Attente de la redirection vers le portail
try {
  await page.waitForURL(/\/portail\/dashboard/, { timeout: 20000 })
  console.log('CONNEXION REUSSIE — URL :', page.url())
} catch {
  console.log('ECHEC — URL actuelle :', page.url())
  const erreur = await page.locator('.v-alert').allTextContents().catch(() => [])
  console.log('Messages affichés :', erreur)
}

// Le navigateur reste ouvert 25 s pour observation visuelle
await page.waitForTimeout(25000)
await navigateur.close()
