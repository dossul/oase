const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const u = await p.utilisateur.findUnique({ where: { email: 'alpha@test.tg' } });
  if (!u) { console.log('Pas de user'); process.exit(0); }
  console.log('user', u.id);
  const c = await p.contribuable.findFirst({ where: { userId: u.id } });
  console.log('contribuable', c?.id);
  try {
    await p.refreshToken.deleteMany({ where: { utilisateurId: u.id } });
    console.log('refreshTokens deleted');
  } catch (e) { console.log('refreshTokens ERR', e.message.slice(0, 200)); }
  try {
    if (c) {
      await p.contribuable.delete({ where: { id: c.id } });
      console.log('contribuable deleted');
    }
  } catch (e) { console.log('contribuable ERR', e.message.slice(0, 400)); }
  try {
    await p.utilisateur.delete({ where: { id: u.id } });
    console.log('user deleted');
  } catch (e) { console.log('user ERR', e.message.slice(0, 400)); }
  process.exit(0);
})();
