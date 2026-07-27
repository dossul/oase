/**
 * Générateur PDF minimaliste (PDF 1.4, une page, police Helvetica).
 * Suffisant pour les attestations OASE : titre + lignes de texte.
 * Encodage WinAnsi (latin1) — les caractères accentués courants sont supportés.
 */

function escapePdfText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

/** Caractères hors latin1 → équivalent ASCII (le tiré cadratin, etc.). */
function toLatin1(text: string): string {
  return text
    .replace(/[—–]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, '...')
    .replace(/[^\x20-\x7E\xC0-\xFF\n]/g, '?');
}

export interface SimplePdfOptions {
  title: string;
  lines: string[];
}

/**
 * Construit un PDF binaire valide : titre en gras 18pt puis lignes en 11pt.
 */
export function buildSimplePdf({ title, lines }: SimplePdfOptions): Buffer {
  const content: string[] = ['BT'];
  content.push(`/F2 18 Tf 50 790 Td (${escapePdfText(toLatin1(title))}) Tj`);
  content.push('ET');
  let y = 750;
  for (const line of lines) {
    content.push('BT');
    content.push(`/F1 11 Tf 50 ${y} Td (${escapePdfText(toLatin1(line))}) Tj`);
    content.push('ET');
    y -= 18;
  }
  const stream = content.join('\n');

  const objects: string[] = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefStart = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (const off of offsets) {
    pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, 'latin1');
}
