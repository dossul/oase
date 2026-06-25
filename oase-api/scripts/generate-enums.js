/**
 * OASE — Génération automatique des enums TypeScript depuis schema.prisma
 * Les modèles Ref* deviennent des enums TypeScript.
 * 
 * Mode 1 (par défaut): Lit les codes réels depuis la base de données via Prisma Client.
 * Mode 2 (fallback): Génère des enums vides si la DB n'est pas accessible.
 * 
 * Usage:
 *   node scripts/generate-enums.js           # avec DB
 *   node scripts/generate-enums.js --empty  # enums vides
 */

const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const outputDir = path.join(__dirname, '..', 'src', 'common', 'enums');
const outputPath = path.join(outputDir, 'generated.ts');
const emptyMode = process.argv.includes('--empty');

const schema = fs.readFileSync(schemaPath, 'utf8');

// Regex pour capturer un bloc model
const modelRegex = /^model\s+(Ref\w+)\s*\{([\s\S]*?)\n\}/gm;

// Regex pour capturer le champ code en @id
const codeRegex = /^\s+code\s+String\s+@id/m;

// Mapping nom du modèle -> nom de l'enum
const enumNameMapping = {
  'RefCanalNotification': 'CanalNotification',
  'RefCanalPush': 'CanalPush',
  'RefCategorieAnomalie': 'CategorieAnomalie',
  'RefEtatJob': 'EtatJob',
  'RefGraviteAnomalie': 'GraviteAnomalie',
  'RefModeInstruction': 'ModeInstruction',
  'RefNatureMesure': 'NatureMesure',
  'RefOrganeGestion': 'OrganeGestion',
  'RefPorteeCategorie': 'PorteeCategorie',
  'RefRangPiece': 'RangPiece',
  'RefRegimeConvention': 'RegimeConvention',
  'RefRole': 'Role',
  'RefSourceCode': 'SourceCode',
  'RefSourceDetection': 'SourceDetection',
  'RefStatutAnomalie': 'StatutAnomalie',
  'RefStatutArchivage': 'StatutArchivage',
  'RefStatutConnecteur': 'StatutConnecteur',
  'RefStatutConvention': 'StatutConvention',
  'RefStatutDemande': 'StatutDemande',
  'RefStatutEtape': 'StatutEtape',
  'RefStatutFiscal': 'StatutFiscal',
  'RefStatutNotification': 'StatutNotification',
  'RefStatutUtilisateur': 'StatutUtilisateur',
  'RefTypeAccordSiege': 'TypeAccordSiege',
  'RefTypeActe': 'TypeActe',
  'RefTypeAgrement': 'TypeAgrement',
  'RefTypeBeneficiaire': 'TypeBeneficiaire',
  'RefTypeDecision': 'TypeDecision',
  'RefTypeDocument': 'TypeDocument',
  'RefTypeInstitution': 'TypeInstitution',
  'RefTypeJob': 'TypeJob',
  'RefTypeMouvementQuota': 'TypeMouvementQuota',
  'RefTypeNotification': 'TypeNotification',
  'RefTypeParametre': 'TypeParametre',
  'RefTypeQuota': 'TypeQuota',
  'RefTypeRapport': 'TypeRapport',
  'RefUniteQuota': 'UniteQuota',
};

const enums = [];

let match;
while ((match = modelRegex.exec(schema)) !== null) {
  const modelName = match[1];
  const body = match[2];

  if (!codeRegex.test(body)) continue;
  if (!enumNameMapping[modelName]) continue;

  // Extraire le @@map pour obtenir le vrai nom de table SQL
  const mapMatch = body.match(/@@map\("([^"]+)"\)/);
  const tableName = mapMatch ? mapMatch[1] : modelName;

  enums.push({
    modelName,
    enumName: enumNameMapping[modelName],
    tableName,
  });
}

async function fetchFromDatabase() {
  const mysql = require('mysql2/promise');
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'oase',
  });

  const data = {};

  try {
    for (const { enumName, tableName } of enums) {
      try {
        const [rows] = await connection.execute(
          `SELECT code, libelle FROM \`${tableName}\` WHERE est_actif = 1 ORDER BY ordre ASC, code ASC`
        );
        data[enumName] = rows;
        console.log(`  ✅ ${enumName}: ${rows.length} valeurs`);
      } catch (err) {
        console.log(`  ⚠️ ${enumName}: ${err.message}`);
        data[enumName] = [];
      }
    }
  } finally {
    await connection.end();
  }

  return data;
}

function sanitizeEnumKey(code) {
  // Transformer un code en identifiant TypeScript valide
  return code
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/^[0-9]/, '_$&')
    .toUpperCase();
}

async function main() {
  let dbData = {};

  if (!emptyMode) {
    try {
      console.log('Connexion a la base de donnees pour lire les ref_*...');
      dbData = await fetchFromDatabase();
    } catch (err) {
      console.log(`⚠️ DB inaccessible: ${err.message}`);
      console.log('Generation en mode --empty');
    }
  }

  let output = `// ============================================================\n`;
  output += `// OASE — Enums TypeScript générés automatiquement depuis Prisma\n`;
  output += `// Source: prisma/schema.prisma (modèles Ref*)\n`;
  output += `// Date: ${new Date().toISOString()}\n`;
  output += `// Mode: ${emptyMode || Object.keys(dbData).length === 0 ? 'empty (DB inaccessible)' : 'database'}\n`;
  output += `// ============================================================\n\n`;

  const labels = {};

  for (const { enumName } of enums) {
    const items = dbData[enumName] || [];
    output += `export enum ${enumName} {\n`;

    if (items.length === 0) {
      output += `  // Valeurs a charger depuis la base de donnees\n`;
      output += `  // TODO: remplacer par les codes reels\n`;
    } else {
      for (const item of items) {
        const key = sanitizeEnumKey(item.code);
        const value = item.code.replace(/"/g, '\\"');
        output += `  ${key} = "${value}",\n`;
      }
    }

    output += `}\n\n`;

    labels[enumName] = {};
    for (const item of items) {
      labels[enumName][item.code] = item.libelle || item.code;
    }
  }

  // Générer un helper pour obtenir les labels
  output += `// ============================================================\n`;
  output += `// Helper: libelles des enums\n`;
  output += `// ============================================================\n\n`;
  output += `export const REF_LABELS: Record<string, Record<string, string>> = ${JSON.stringify(labels, null, 2)};\n`;

  // Créer le dossier si nécessaire
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, output, 'utf8');

  console.log(`\n✅ Fichier généré: ${outputPath}`);
  console.log(`📊 Enums: ${enums.length}`);
}

main().catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});
