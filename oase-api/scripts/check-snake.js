const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const schema = fs.readFileSync(schemaPath, 'utf8');

const models = schema.match(/^model \w+/gm) || [];
console.log('Modeles:', models.length);

const snakeModels = schema.match(/^model ([A-Z][a-zA-Z]+)\s*\{[\s\S]*?@@map\("([a-z_]+)"\)/gm) || [];
console.log('Modeles PascalCase avec @@map snake_case:', snakeModels.length);

const directSnakeModels = schema.match(/^model [a-z_]+\s*\{/gm) || [];
console.log('Modeles directement snake_case:', directSnakeModels.length);

const snakeFields = schema.match(/^\s+[a-z_]+\s+\w+\s+@map\("[a-z_]+"\)/gm) || [];
console.log('Champs snake_case avec @map:', snakeFields.length);
