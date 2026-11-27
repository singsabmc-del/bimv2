// Minimal in-browser .xlsx reader (no dependency): unzips the workbook with the browser's
// DecompressionStream and returns the first sheet as tab-separated text, so it can go through
// the same pipeline as text pasted from Excel. Dates stay as Excel serial numbers
// (the student parser already converts those).

const u16 = (v: DataView, o: number) => v.getUint16(o, true);
const u32 = (v: DataView, o: number) => v.getUint32(o, true);

type ZipEntry = { method: number; compSize: number; localOffset: number };

function readZipDirectory(buf: ArrayBuffer): Map<string, ZipEntry> {
  const view = new DataView(buf);
  let eocd = -1;
  for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 66000); i--) {
    if (u32(view, i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('not a zip');
  const count = u16(view, eocd + 10);
  let p = u32(view, eocd + 16);
  const dec = new TextDecoder();
  const out = new Map<string, ZipEntry>();
  for (let n = 0; n < count; n++) {
    if (u32(view, p) !== 0x02014b50) break;
    const method = u16(view, p + 10);
    const compSize = u32(view, p + 20);
    const nameLen = u16(view, p + 28);
    const extraLen = u16(view, p + 30);
    const commentLen = u16(view, p + 32);
    const localOffset = u32(view, p + 42);
    const name = dec.decode(new Uint8Array(buf, p + 46, nameLen));
    out.set(name.replace(/\\/g, '/'), { method, compSize, localOffset });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

async function readEntry(buf: ArrayBuffer, e: ZipEntry): Promise<string> {
  const view = new DataView(buf);
  const start = e.localOffset + 30 + u16(view, e.localOffset + 26) + u16(view, e.localOffset + 28);
  const bytes = new Uint8Array(buf, start, e.compSize);
  if (e.method === 0) return new TextDecoder().decode(bytes);
  if (e.method !== 8) throw new Error('unsupported compression');
  if (typeof (window as any).DecompressionStream === 'undefined') throw new Error('browser too old');
  const stream = new Blob([bytes]).stream().pipeThrough(new (window as any).DecompressionStream('deflate-raw'));
  return await new Response(stream).text();
}

const xml = (s: string) => new DOMParser().parseFromString(s, 'application/xml');
const byTag = (d: Document | Element, tag: string) => Array.from(d.getElementsByTagNameNS('*', tag));
const colIndex = (ref: string) => {
  const letters = (ref.match(/^[A-Z]+/i)?.[0] || 'A').toUpperCase();
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
};
const clean = (s: string) => s.replace(/[\t\r\n]+/g, ' ').trim();

/** Returns the first worksheet of an .xlsx file as TSV text */
export async function xlsxToTsv(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const dir = readZipDirectory(buf);
  const get = async (name: string) => {
    const e = dir.get(name);
    return e ? readEntry(buf, e) : null;
  };

  // shared strings
  const shared: string[] = [];
  const ss = await get('xl/sharedStrings.xml');
  if (ss) {
    byTag(xml(ss), 'si').forEach((si) => {
      const parts = byTag(si, 't').filter((t) => !(t.parentElement && t.parentElement.localName === 'rPh'));
      shared.push(parts.map((t) => t.textContent || '').join(''));
    });
  }

  // first sheet in workbook order
  let sheetPath = 'xl/worksheets/sheet1.xml';
  const wb = await get('xl/workbook.xml');
  const rels = await get('xl/_rels/workbook.xml.rels');
  if (wb && rels) {
    const first = byTag(xml(wb), 'sheet')[0];
    const rid = first?.getAttribute('r:id') || first?.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
    const rel = byTag(xml(rels), 'Relationship').find((r) => r.getAttribute('Id') === rid);
    const target = rel?.getAttribute('Target');
    if (target) sheetPath = target.startsWith('/') ? target.slice(1) : `xl/${target.replace(/^\.\//, '')}`;
  }
  const sheet = await get(sheetPath);
  if (!sheet) throw new Error('no worksheet');

  const lines: string[] = [];
  byTag(xml(sheet), 'row').forEach((row) => {
    const cells: string[] = [];
    byTag(row, 'c').forEach((c, i) => {
      const ref = c.getAttribute('r');
      const idx = ref ? colIndex(ref) : i;
      const type = c.getAttribute('t');
      const v = byTag(c, 'v')[0]?.textContent ?? '';
      let text = '';
      if (type === 's') text = shared[Number(v)] ?? '';
      else if (type === 'inlineStr') text = byTag(c, 't').map((t) => t.textContent || '').join('');
      else if (type === 'b') text = v === '1' ? 'TRUE' : 'FALSE';
      else text = v;
      cells[idx] = clean(text);
    });
    for (let i = 0; i < cells.length; i++) if (cells[i] === undefined) cells[i] = '';
    if (cells.some((c) => c)) lines.push(cells.join('\t'));
  });
  return lines.join('\n');
}
