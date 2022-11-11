const fs = require('fs');
const config = require('../src/config.js');
const manifestOrigin = require('../manifest-chromium.json');
let manifest = JSON.parse(JSON.stringify(manifestOrigin));

let matches = [];
for (let i in config.validOrigins) {
  matches.push(config.validOrigins[i] + '/*');
}
manifest.name = config.extensionName;
manifest.description = config.extensionDescription;
manifest.content_scripts[0].matches = matches;
manifest.externally_connectable.matches = matches;

try {
  fs.unlinkSync(__dirname + '/../build/extension/manifest.json');
} catch(e) {
  // ignore err
}
fs.writeFileSync(
  __dirname + '/../build/extension/manifest.json',
  JSON.stringify(manifest),
  'utf8',
);
