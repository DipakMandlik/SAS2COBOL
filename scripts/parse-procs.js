const fs = require('fs');
const steps = require('./parsed-steps.json');
const procSteps = steps.filter(s => s.type === 'PROC');
console.log('Total PROCs:', procSteps.length);

const procSummary = procSteps.map((p, i) => {
  return {
    index: i + 1,
    stepId: p.stepId,
    name: p.name,
    startLine: p.startLine,
    endLine: p.endLine,
    text: p.text.join(' ')
  };
});

fs.writeFileSync('scripts/proc-summary.json', JSON.stringify(procSummary, null, 2));
console.log('Proc summary written to scripts/proc-summary.json');
