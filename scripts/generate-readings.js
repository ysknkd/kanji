import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { XMLParser } from 'fast-xml-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

const KANJIDIC_URL = 'http://www.edrdg.org/kanjidic/kanjidic2.xml.gz';
const KANJIDIC_GZ = join(ROOT_DIR, 'data/kanjidic2.xml.gz');
const KANJIDIC_XML = join(ROOT_DIR, 'data/kanjidic2.xml');
const OUTPUT_FILE = join(ROOT_DIR, 'src/readings.js');

// Import supported kanji from labels.js
const labelsPath = join(ROOT_DIR, 'src/labels.js');
const labelsContent = readFileSync(labelsPath, 'utf-8');
const kanjiDictMatch = labelsContent.match(/export const kanjiDict = \{([^}]+)\}/s);
const supportedKanji = new Set();

if (kanjiDictMatch) {
  const entries = kanjiDictMatch[1].matchAll(/'([^']+)':\s*\d+/g);
  for (const match of entries) {
    supportedKanji.add(match[1]);
  }
}

console.log(`Supported kanji count: ${supportedKanji.size}`);

// Download KANJIDIC2 if not exists
if (!existsSync(KANJIDIC_XML)) {
  console.log('Downloading KANJIDIC2...');
  execSync(`mkdir -p ${join(ROOT_DIR, 'data')}`);
  execSync(`curl -sL "${KANJIDIC_URL}" -o "${KANJIDIC_GZ}"`);
  execSync(`gunzip -f "${KANJIDIC_GZ}"`);
  console.log('Downloaded and extracted KANJIDIC2.');
}

// Parse XML
console.log('Parsing KANJIDIC2 XML...');
const xmlContent = readFileSync(KANJIDIC_XML, 'utf-8');
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_'
});
const data = parser.parse(xmlContent);

// Extract readings
const readings = {};
const characters = data.kanjidic2.character;

for (const char of characters) {
  const literal = char.literal;

  if (!supportedKanji.has(literal)) continue;

  const reading = { on: [], kun: [] };

  const rmGroup = char.reading_meaning?.rmgroup;
  if (rmGroup) {
    const readingList = Array.isArray(rmGroup.reading) ? rmGroup.reading : [rmGroup.reading].filter(Boolean);

    for (const r of readingList) {
      if (typeof r === 'object' && r['#text']) {
        const type = r['@_r_type'];
        const text = r['#text'];

        if (type === 'ja_on') {
          reading.on.push(text);
        } else if (type === 'ja_kun') {
          // Remove okurigana notation (after .)
          reading.kun.push(text.split('.')[0]);
        }
      }
    }
  }

  // Deduplicate kun readings
  reading.kun = [...new Set(reading.kun)];

  if (reading.on.length > 0 || reading.kun.length > 0) {
    readings[literal] = reading;
  }
}

console.log(`Extracted readings for ${Object.keys(readings).length} kanji.`);

// Generate output file
const output = `// Auto-generated from KANJIDIC2
// License: CC BY-SA 4.0 (https://www.edrdg.org/edrdg/licence.html)

export const readings = ${JSON.stringify(readings, null, 2)};
`;

writeFileSync(OUTPUT_FILE, output);
console.log(`Generated: ${OUTPUT_FILE}`);
