// Reads the first sheet of an .xlsx file into rows of cells. Runs in the browser and in Node.
// An .xlsx is a zip of XML files, so this only needs the zip directory and the native inflater.

export type Cell = string | number | null;

const textDecoder = new TextDecoder();

async function inflate(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Every file in the zip, by name, still compressed until read. */
function zipEntries(bytes: Uint8Array): Map<string, () => Promise<Uint8Array>> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = bytes.length - 22;
  while (end >= 0 && view.getUint32(end, true) !== 0x06054b50) end--;
  if (end < 0) throw new Error("not a zip");
  const count = view.getUint16(end + 10, true);
  let at = view.getUint32(end + 16, true);
  const entries = new Map<string, () => Promise<Uint8Array>>();
  for (let i = 0; i < count; i++) {
    if (view.getUint32(at, true) !== 0x02014b50) throw new Error("broken zip");
    const method = view.getUint16(at + 10, true);
    const size = view.getUint32(at + 20, true);
    const nameLength = view.getUint16(at + 28, true);
    const skip = nameLength + view.getUint16(at + 30, true) + view.getUint16(at + 32, true);
    const local = view.getUint32(at + 42, true);
    const name = textDecoder.decode(bytes.subarray(at + 46, at + 46 + nameLength));
    const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
    const data = bytes.subarray(start, start + size);
    entries.set(name, () => (method === 8 ? inflate(data) : Promise.resolve(data)));
    at += 46 + skip;
  }
  return entries;
}

function unescapeXml(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, code: string) => {
    if (code[0] === "#") {
      return String.fromCodePoint(code[1] === "x" ? parseInt(code.slice(2), 16) : Number(code.slice(1)));
    }
    return { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" }[code.toLowerCase()]!;
  });
}

// The text of an <si> or <is> element: all its <t> runs joined.
function runs(xml: string): string {
  return [...xml.matchAll(/<t(?:\s[^>]*)?>([^<]*)<\/t>/g)].map((m) => unescapeXml(m[1])).join("");
}

function columnIndex(reference: string): number {
  const letters = reference.replace(/\d+$/, "");
  return [...letters].reduce((total, letter) => total * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

export async function readFirstSheet(bytes: Uint8Array): Promise<Cell[][]> {
  const entries = zipEntries(bytes);
  const sheetName = [...entries.keys()]
    .filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name))
    .sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]))[0];
  if (!sheetName) throw new Error("no sheet");
  const shared = entries.get("xl/sharedStrings.xml");
  const strings = shared
    ? [...textDecoder.decode(await shared()).matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => runs(m[1]))
    : [];
  const sheet = textDecoder.decode(await entries.get(sheetName)!());

  const rows: Cell[][] = [];
  for (const row of sheet.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells: Cell[] = [];
    for (const cell of row[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attributes = cell[1];
      const body = cell[2] ?? "";
      const reference = attributes.match(/\br="([A-Z]+\d+)"/)?.[1];
      const type = attributes.match(/\bt="(\w+)"/)?.[1];
      const value = body.match(/<v>([^<]*)<\/v>/)?.[1];
      let content: Cell = null;
      if (type === "s" && value !== undefined) content = strings[Number(value)] ?? null;
      else if (type === "inlineStr") content = runs(body);
      else if (type === "str" || type === "b" || type === "e") content = value === undefined ? null : unescapeXml(value);
      else if (value !== undefined) content = Number(value);
      cells[reference ? columnIndex(reference) : cells.length] = content;
    }
    rows.push(Array.from(cells, (cell) => cell ?? null));
  }
  return rows;
}
