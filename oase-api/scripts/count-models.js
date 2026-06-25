const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const schema = fs.readFileSync(schemaPath, 'utf8');
const models = schema.match(/^model \w+/gm) || [];
console.log('Modeles Prisma:', models.length);
