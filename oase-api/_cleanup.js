const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const u = await p.utilisateur.findUnique({ where: { email: 'alpha@test.tg' } });
  if (!u) { console.log('Pas de user'); process.exit(0); }
  const c = await p.contribuable.findFirst({ where: { userId: u.id } });
  await p.refreshToken.deleteMany({ where: { utilisateurId: u.id } });
  if (c) await p.contribuable.delete({ where: { id: c.id } });
  await p.utilisateur.delete({ where: { id: u.id } });
  console.log('Cleanup OK (audit preserve)');
  process.exit(0);
})().catch((e) => { console.log('ERR', e.message.slice(0, 200)); process.exit(1); });
