const fs = require('fs');
const path = require('path');

const iconsJsonPath = path.join(__dirname, 'icons.json');
const linkDataPath = path.join(__dirname, 'icons', 'linkdata.json');

function loadIconsJson() {
  const raw = fs.readFileSync(iconsJsonPath, 'utf8');
  return { raw, json: JSON.parse(raw) };
}

function loadLinkData() {
  const raw = fs.readFileSync(linkDataPath, 'utf8');
  const lines = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  const map = new Map();
  for (const url of lines) {
    try {
      const u = new URL(url);
      const last = u.pathname.split('/').pop() || '';
      const base = last.replace(/\.png$/i, '');
      if (base) {
        map.set(base, url);
      }
    } catch (e) {
      console.warn(`Skipping invalid URL: ${url}`);
    }
  }
  return map;
}

function updateFileTypes(iconsJson, linkMap) {
  const fileTypes = iconsJson?.icons?.fileTypes || {};
  let updated = 0;
  let missing = 0;
  for (const key of Object.keys(fileTypes)) {
    if (linkMap.has(key)) {
      fileTypes[key] = linkMap.get(key);
      updated++;
    } else {
      missing++;
    }
  }
  return { updated, missing };
}

function main() {
  const { raw, json } = loadIconsJson();
  const links = loadLinkData();

  // Backup original
  const backupPath = iconsJsonPath + '.bak';
  fs.writeFileSync(backupPath, raw, 'utf8');
  console.log(`Backup written: ${path.basename(backupPath)}`);

  const { updated, missing } = updateFileTypes(json, links);

  fs.writeFileSync(iconsJsonPath, JSON.stringify(json, null, 4) + '\n', 'utf8');
  console.log(`icons.json updated. ${updated} entries rewritten, ${missing} without matching links.`);
}

main();
