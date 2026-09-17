const fs = require('fs');
const path = require('path');

const sas = fs.readFileSync(path.join(__dirname, '../input/sas/SYN_ENTERPRISE_SALES_MODERNIZATION.sas'), 'utf8');
const lines = sas.split('\n');
const inv = require(path.join(__dirname, '../workspace/phase-1-understanding/source-inventory.json'));
const steps = inv.files[0].steps;

const data = require(path.join(__dirname, '../workspace/phase-1-understanding/physical-data-model.json'));
const datasetNames = data.datasets.map(d => d.datasetName);

const stepMap = {};
datasetNames.forEach(ds => {
  const base = ds.split('.')[1];
  for (const s of steps) {
    const stepLines = lines.slice(s.startLine - 1, s.endLine);
    const stepText = stepLines.join('\n');
    if (new RegExp('(out|table|data)\\s*=\\s*WORKLIB\\.' + base + '\\b', 'i').test(stepText) ||
        new RegExp('create\\s+table\\s+WORKLIB\\.' + base + '\\b', 'i').test(stepText) ||
        new RegExp('data\\s+WORKLIB\\.' + base + '\\b', 'i').test(stepText)) {
      stepMap[ds] = {
        stepId: s.stepId,
        type: s.type,
        name: s.name,
        range: `${s.startLine}-${s.endLine}`,
        code: stepText
      };
      break;
    }
  }
});

const unmapped = datasetNames.filter(d => !stepMap[d] && !d.startsWith('RAW.'));
console.log('Mapped datasets:', Object.keys(stepMap).length);
console.log('Unmapped datasets:', unmapped);

fs.writeFileSync('scripts/dataset-step-map.json', JSON.stringify(stepMap, null, 2));
