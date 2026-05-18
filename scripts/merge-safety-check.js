const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');

const conflictMarkerPattern = new RegExp(['<{7}', '={7}', '>{7}'].join('|'));
if (conflictMarkerPattern.test(html)) {
  throw new Error('Merge conflict marker found in index.html');
}

const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  throw new Error('No inline script block found in index.html');
}

new Function(scriptMatch[1]);

const elements = new Map();
function elementFor(id) {
  if (!elements.has(id)) {
    elements.set(id, {
      id,
      style: {},
      classList: {
        add() {},
        remove() {},
        contains() { return false; }
      },
      addEventListener() {},
      dataset: {},
      disabled: false,
      textContent: '',
      innerHTML: '',
      innerText: '',
      value: 0,
      checked: false
    });
  }
  return elements.get(id);
}

const storage = {};
const context = {
  console,
  localStorage: {
    getItem: key => storage[key] ?? null,
    setItem: (key, value) => { storage[key] = String(value); },
    removeItem: key => { delete storage[key]; }
  },
  document: {
    getElementById: elementFor,
    querySelectorAll: () => [],
    querySelector: () => null
  },
  window: {},
  alert: message => { throw new Error(`Unexpected alert: ${message}`); },
  setInterval: () => 0,
  setTimeout: callback => { callback(); return 0; },
  clearInterval: () => {}
};

vm.createContext(context);
vm.runInContext(scriptMatch[1], context);

vm.runInContext(`
if (isTechUnlocked('cores', 'Solid', 'AP')) throw new Error('AP should not be unlocked at new game start.');
if (!areRequirementsMet('cores', 'Solid', 'AP')) throw new Error('AP should be research-ready after Light-AP.');
if (areRequirementsMet('cores', 'Solid', 'APHE')) throw new Error('APHE should require AP before it can be researched.');
unlockedTechTree.cores.Solid.AP = true;
if (!areRequirementsMet('cores', 'Solid', 'APHE')) throw new Error('APHE should become ready after AP unlocks.');
unlockedTechTree.cores.Solid.AP = false;
unlockedTechTree.cores.Solid.APHE = true;
normalizeTechTreeUnlocks();
if (unlockedTechTree.cores.Solid.APHE) throw new Error('Normalizer should prune APHE when AP is missing.');
selectCore('Solid', 'APHE');
if (core && core.type === 'APHE') throw new Error('Locked APHE should not be selectable.');
unlockedTechTree.cores.Solid.AP = false;
refreshTechUnlockState();
if (unlockedTechTree.cores.Solid.AP) throw new Error('Refresh shim should not unlock researchable AP.');
`, context);

console.log('Merge-safety checks passed.');
