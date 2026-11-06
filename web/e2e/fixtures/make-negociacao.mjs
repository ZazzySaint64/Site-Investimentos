// Writes negociacao.xlsx, a made-up B3 trading statement used by the tests. Run: node e2e/fixtures/make-negociacao.mjs
import { writeFileSync } from "node:fs";
import { crc32, deflateRawSync } from "node:zlib";

const header = ["Data do Negócio", "Tipo de Movimentação", "Mercado", "Prazo/Vencimento", "Instituição", "Código de Negociação", "Quantidade", "Preço", "Valor"];
const rows = [
  header,
  ["15/03/2024", "Compra", "Mercado à Vista", "-", "CORRETORA EXEMPLO", "ITUB4", 10, 30, 300],
  ["15/03/2024", "Compra", "Mercado Fracionário", "-", "CORRETORA EXEMPLO", "PETR4F", 5, "R$ 35,50", "R$ 177,50"],
  ["10/04/2024", "Venda", "Mercado à Vista", "-", "CORRETORA EXEMPLO", "ITUB4", 4, 32.1, 128.4],
  ["20/05/2024", "Compra", "Opção de Compra", "17/06/2024", "CORRETORA EXEMPLO", "PETRF350", 100, 1.2, 120],
  ["21/05/2024", "Compra", "Mercado à Vista", "-", "CORRETORA EXEMPLO", "ZZZZ3", 1, 10, 10],
];

const strings = [];
const index = (text) => (strings.includes(text) ? strings.indexOf(text) : strings.push(text) - 1);
const escape = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const column = (i) => String.fromCharCode(65 + i);
const sheetRows = rows
  .map((row, r) => `<row r="${r + 1}">${row
    .map((cell, c) => typeof cell === "number"
      ? `<c r="${column(c)}${r + 1}"><v>${cell}</v></c>`
      : `<c r="${column(c)}${r + 1}" t="s"><v>${index(cell)}</v></c>`)
    .join("")}</row>`)
  .join("");

const files = {
  "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/></Types>`,
  "_rels/.rels": `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
  "xl/workbook.xml": `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Negociação" sheetId="1" r:id="rId1"/></sheets></workbook>`,
  "xl/_rels/workbook.xml.rels": `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>`,
  "xl/worksheets/sheet1.xml": `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`,
};
files["xl/sharedStrings.xml"] = `<?xml version="1.0" encoding="UTF-8"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${strings.length}" uniqueCount="${strings.length}">${strings.map((s) => `<si><t>${escape(s)}</t></si>`).join("")}</sst>`;

const locals = [];
const centrals = [];
let offset = 0;
for (const [name, text] of Object.entries(files)) {
  const nameBytes = Buffer.from(name);
  const raw = Buffer.from(text);
  const data = deflateRawSync(raw);
  const crc = crc32(raw);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x800, 6); local.writeUInt16LE(8, 8);
  local.writeUInt32LE(crc, 14); local.writeUInt32LE(data.length, 18); local.writeUInt32LE(raw.length, 22); local.writeUInt16LE(nameBytes.length, 26);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(0x800, 8); central.writeUInt16LE(8, 10);
  central.writeUInt32LE(crc, 16); central.writeUInt32LE(data.length, 20); central.writeUInt32LE(raw.length, 24); central.writeUInt16LE(nameBytes.length, 28); central.writeUInt32LE(offset, 42);
  locals.push(local, nameBytes, data);
  centrals.push(central, nameBytes);
  offset += 30 + nameBytes.length + data.length;
}
const directory = Buffer.concat(centrals);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(centrals.length / 2, 8); end.writeUInt16LE(centrals.length / 2, 10);
end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
writeFileSync(new URL("./negociacao.xlsx", import.meta.url), Buffer.concat([...locals, directory, end]));
