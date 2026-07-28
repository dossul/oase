/**
 * Générateur PDF natif (PDF 1.4) pour OASE.
 * - Aucune dépendance externe.
 * - Encodage WinAnsi (latin1) — accents courants OK.
 * - Mise en page A4 portrait, polices Helvetica.
 * - Utilisé pour les attestations d'exonération (document officiel).
 *
 * API publique :
 *   buildSimplePdf({ title, lines, header, footer, blocks })
 *   buildAttestationPdf({ reference, header, sections, footer, qrPayload })
 */

const PAGE_W = 595;   // A4 portrait, points
const PAGE_H = 842;
const MARGIN_L = 50;
const MARGIN_R = 50;
const MARGIN_T = 50;
const MARGIN_B = 60;

function escapePdfText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

/** Caractères hors latin1 → équivalent ASCII (sécurité d'encodage). */
function toLatin1(text: string): string {
  return text
    .replace(/[—–]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, '...')
    .replace(/[^\x20-\x7E\xC0-\xFF\n]/g, '?');
}

/** Tronque une ligne pour qu'elle tienne dans maxWidth (police 11pt). */
function fitLine(line: string, maxWidth: number, fontSize = 11): string {
  const charW = fontSize * 0.5;
  const maxChars = Math.floor(maxWidth / charW);
  if (line.length <= maxChars) return line;
  return line.slice(0, Math.max(0, maxChars - 1)) + '…';
}

// ---------------------------------------------------------------------------
// Primitives de dessin PDF
// ---------------------------------------------------------------------------

function drawText(buf: string[], x: number, y: number, font: string, size: number, text: string): void {
  buf.push('BT');
  buf.push(`/${font} ${size} Tf ${x} ${y} Td (${escapePdfText(toLatin1(text))}) Tj`);
  buf.push('ET');
}

function drawTextRight(buf: string[], x: number, y: number, font: string, size: number, text: string): void {
  const approx = text.length * size * 0.5;
  drawText(buf, x - approx, y, font, size, text);
}

function drawLine(buf: string[], x1: number, y1: number, x2: number, y2: number): void {
  buf.push('ET');
  buf.push('q');
  buf.push('0.7 0.7 0.7 RG 1 w');
  buf.push(`${x1} ${y1} m ${x2} ${y2} l S`);
  buf.push('Q');
  buf.push('BT');
}

function drawRect(buf: string[], x: number, y: number, w: number, h: number, fill = false): void {
  buf.push('q');
  if (fill) {
    buf.push('0.96 0.96 0.96 rg 0.96 0.96 0.96 RG 1 w');
  } else {
    buf.push('0.7 0.7 0.7 RG 1 w');
  }
  buf.push(`${x} ${y} ${w} ${h} re ${fill ? 'f' : 'S'}`);
  buf.push('Q');
}

// ---------------------------------------------------------------------------
// API publique
// ---------------------------------------------------------------------------

export interface PdfSection {
  /** Titre optionnel de la section (ex. "Identité du contribuable"). */
  title?: string;
  /** Lignes label/valeur OU lignes simples (texte). */
  rows?: Array<{ label: string; value: string }>;
  lines?: string[];
}

export interface SimplePdfOptions {
  title: string;
  /** Lignes simples (mode dégradé, conserve rétro-compat). */
  lines?: string[];
  /** En-tête : titre principal + sous-titre (centrés). */
  header?: { org: string; subtitle: string; docType: string };
  /** Sections structurées (prioritaires sur `lines`). */
  sections?: PdfSection[];
  /** Pied de page : référence, page, hash, mention légale. */
  footer?: {
    reference?: string;
    hash?: string;
    legal?: string;
    page?: number;
  };
}

/**
 * Construit un PDF A4 propre avec en-tête structuré, sections label/valeur,
 * filets de séparation et pied de page avec hash d'intégrité.
 */
export function buildSimplePdf(opts: SimplePdfOptions): Buffer {
  const content: string[] = ['BT'];
  const innerW = PAGE_W - MARGIN_L - MARGIN_R;
  let y = PAGE_H - MARGIN_T;

  // ---- En-tête officiel ----
  if (opts.header) {
    drawText(content, MARGIN_L, y, 'F2', 11, opts.header.org);
    y -= 14;
    drawText(content, MARGIN_L, y, 'F1', 9, opts.header.subtitle);
    y -= 18;
    drawLine(content, MARGIN_L, y, PAGE_W - MARGIN_R, y);
    y -= 22;
    drawText(content, PAGE_W / 2 - (opts.header.docType.length * 4.5), y, 'F2', 16, opts.header.docType);
    y -= 24;
    drawLine(content, MARGIN_L, y, PAGE_W - MARGIN_R, y);
    y -= 20;
  }

  // ---- Titre du document ----
  drawText(content, MARGIN_L, y, 'F2', 14, opts.title);
  y -= 22;

  // ---- Sections structurées ----
  if (opts.sections && opts.sections.length > 0) {
    for (const section of opts.sections) {
      if (y < MARGIN_B + 80) break; // protection anti-débordement
      if (section.title) {
        drawText(content, MARGIN_L, y, 'F2', 11, section.title);
        y -= 14;
      }
      if (section.rows) {
        for (const row of section.rows) {
          if (y < MARGIN_B + 40) break;
          drawText(content, MARGIN_L, y, 'F2', 10, row.label);
          const value = fitLine(row.value || '—', innerW - 160, 10);
          drawText(content, MARGIN_L + 160, y, 'F1', 10, value);
          y -= 14;
        }
      }
      if (section.lines) {
        for (const line of section.lines) {
          if (y < MARGIN_B + 40) break;
          drawText(content, MARGIN_L, y, 'F1', 10, fitLine(line, innerW, 10));
          y -= 14;
        }
      }
      y -= 6; // espacement entre sections
    }
  } else if (opts.lines) {
    // Mode rétro-compatible
    for (const line of opts.lines) {
      if (y < MARGIN_B + 40) break;
      drawText(content, MARGIN_L, y, 'F1', 11, fitLine(line, innerW));
      y -= 16;
    }
  }

  // ---- Pied de page ----
  if (opts.footer) {
    let fy = MARGIN_B;
    drawLine(content, MARGIN_L, fy + 26, PAGE_W - MARGIN_R, fy + 26);
    if (opts.footer.reference) {
      drawText(content, MARGIN_L, fy + 12, 'F1', 8, 'Reference: ' + opts.footer.reference);
    }
    if (opts.footer.hash) {
      const hashLabel = 'Empreinte SHA-256: ';
      const hashShort = fitLine(opts.footer.hash, innerW - 110, 8);
      drawText(content, MARGIN_L, fy, 'F1', 8, hashLabel + hashShort);
    }
    if (opts.footer.legal) {
      const legal = fitLine(opts.footer.legal, innerW, 8);
      drawTextRight(content, PAGE_W - MARGIN_R, fy + 12, 'F1', 8, legal);
    }
    if (opts.footer.page) {
      drawTextRight(content, PAGE_W - MARGIN_R, fy, 'F1', 8, 'Page 1 / 1');
    }
  }

  content.push('ET');
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

/**
 * Variante dédiée à l'attestation d'exonération fiscale.
 * Centralise les libellés officiels et la structure du document.
 */
export interface AttestationPdfInput {
  reference: string;
  acte: {
    reference: string;
    dateEffet: Date;
    dateExpiration?: Date | null;
    typeActe?: string;
    numeroOfficiel?: string | null;
  };
  demande: {
    reference: string;
    objet?: string | null;
    montantDemande?: number | null;
    devise?: string | null;
    dateDepot: Date;
  };
  contribuable: {
    raisonSociale: string;
    nif: string;
    rccm?: string | null;
    formeJuridique?: string | null;
    adresse?: string | null;
  };
  baseJuridique?: {
    code?: string | null;
    libelle?: string | null;
    referenceTexte?: string | null;
  } | null;
  qrPayload: { hash: string };
  signature?: {
    nomSignataire?: string;
    qualite?: string;
    dateSignature?: Date;
  };
}

export function buildAttestationPdf(input: AttestationPdfInput): Buffer {
  const fmtDate = (d?: Date | null) =>
    d ? d.toISOString().slice(0, 10).split('-').reverse().join('/') : '—';
  const fmtMontant = (m?: number | null, devise = 'FCFA') =>
    m == null
      ? '—'
      : new Intl.NumberFormat('fr-FR').format(m) + ' ' + devise;

  return buildSimplePdf({
    title: 'ATTESTATION D’EXONERATION FISCALE',
    header: {
      org: 'REPUBLIQUE TOGOLAISE',
      subtitle: 'Ministere de l’Economie et des Finances  ·  Unite de Politique Fiscale (UPF)',
      docType: 'OASE — Outil Automatise de Suivi des Exonerations',
    },
    sections: [
      {
        title: 'Identification du contribuable',
        rows: [
          { label: 'Raison sociale', value: input.contribuable.raisonSociale },
          { label: 'NIF', value: input.contribuable.nif },
          { label: 'RCCM', value: input.contribuable.rccm || '—' },
          { label: 'Forme juridique', value: input.contribuable.formeJuridique || '—' },
          { label: 'Adresse', value: input.contribuable.adresse || '—' },
        ],
      },
      {
        title: 'Reference de la demande',
        rows: [
          { label: 'Reference', value: input.demande.reference },
          { label: 'Date de depot', value: fmtDate(input.demande.dateDepot) },
          { label: 'Objet', value: input.demande.objet || '—' },
          { label: 'Montant demande', value: fmtMontant(input.demande.montantDemande, input.demande.devise || undefined) },
        ],
      },
      {
        title: 'Base juridique',
        rows: [
          { label: 'Texte', value: input.baseJuridique?.libelle || '—' },
          { label: 'Reference', value: input.baseJuridique?.referenceTexte || '—' },
          { label: 'Code', value: input.baseJuridique?.code || '—' },
        ],
      },
      {
        title: 'Decision',
        rows: [
          { label: 'Acte', value: input.acte.reference },
          { label: 'Type', value: input.acte.typeActe || 'Attestation d’exoneration' },
          { label: 'Numero officiel', value: input.acte.numeroOfficiel || '—' },
          { label: 'Date d’effet', value: fmtDate(input.acte.dateEffet) },
          { label: 'Date d’expiration', value: fmtDate(input.acte.dateExpiration) },
        ],
      },
      {
        title: 'Authentification',
        lines: [
          'La presente attestation est verifiable par QR code ou en ligne a l’adresse :',
          'https://api.oase.ulia.site/api/v1/attestations/verifier/' + input.qrPayload.hash,
          '',
          'Toute alteration, reproduction frauduleuse ou usage abusif est passible des',
          'sanctions prevues par la legislation fiscale togolaise en vigueur.',
        ],
      },
    ],
    footer: {
      reference: input.reference,
      hash: input.qrPayload.hash,
      legal:
        'Document genere par OASE · ' +
        (input.signature?.dateSignature ? fmtDate(input.signature.dateSignature) : fmtDate(new Date())),
      page: 1,
    },
  });
}
