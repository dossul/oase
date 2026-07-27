import { of, lastValueFrom } from 'rxjs';
import { BigIntSerializerInterceptor } from './bigint-serializer.interceptor';
import { bigintReplacer, serializeBigIntDeep } from '../utils/bigint.util';

describe('serializeBigIntDeep', () => {
  it('convertit les BigInt en string, y compris imbriqués', () => {
    const input = {
      id: 'a-1',
      montantFcfa: 15000000n,
      demandes: [{ quotaConsomme: 100n, quotaTotal: null }],
      meta: { total: 3 },
    };
    expect(serializeBigIntDeep(input)).toEqual({
      id: 'a-1',
      montantFcfa: '15000000',
      demandes: [{ quotaConsomme: '100', quotaTotal: null }],
      meta: { total: 3 },
    });
  });

  it('ne touche pas aux Date, Buffer et instances de classes', () => {
    const date = new Date('2026-07-27');
    const buf = Buffer.from('pdf');
    const result = serializeBigIntDeep({ date, buf, nested: { m: 5n } }) as any;
    expect(result.date).toBe(date);
    expect(result.buf).toBe(buf);
    expect(result.nested.m).toBe('5');
  });

  it('bigintReplacer permet JSON.stringify sur des BigInt', () => {
    expect(() => JSON.stringify({ m: 1n })).toThrow();
    expect(JSON.stringify({ m: 1n }, bigintReplacer)).toBe('{"m":"1"}');
  });
});

describe('BigIntSerializerInterceptor', () => {
  it('transforme la réponse du handler', async () => {
    const interceptor = new BigIntSerializerInterceptor();
    const handler = { handle: () => of({ montant: 42n, items: [{ solde: 7n }] }) };
    const result = await lastValueFrom(interceptor.intercept({} as any, handler as any));
    expect(result).toEqual({ montant: '42', items: [{ solde: '7' }] });
  });
});
