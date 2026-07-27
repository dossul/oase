/**
 * Sérialisation BigInt → string.
 *
 * JSON.stringify ne sait pas sérialiser les BigInt (champs Prisma `BigInt` :
 * montant_fcfa, quota_consomme, quota_total, solde…). Sans transformation,
 * Express renvoie 500 « Do not know how to serialize a BigInt ».
 */

/** Replacer pour JSON.stringify (usage : JSON.stringify(data, bigintReplacer)). */
export function bigintReplacer(_key: string, value: unknown): unknown {
  return typeof value === 'bigint' ? value.toString() : value;
}

/**
 * Transforme récursivement tous les BigInt d'une structure en string.
 * Ne descend que dans les objets plain ({…}) et les tableaux : Date, Buffer,
 * StreamableFile et autres instances de classes sont retournés tels quels.
 */
export function serializeBigIntDeep<T>(value: T): T {
  if (typeof value === 'bigint') {
    return value.toString() as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => serializeBigIntDeep(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) {
      return value; // Date, Buffer, StreamableFile, instances de classes…
    }
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = serializeBigIntDeep(val);
    }
    return out as T;
  }
  return value;
}
