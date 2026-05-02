function testShell() {
    if (!core || !casing || !powder) {
        document.getElementById("testResult").innerText = "Incomplete shell!";
        return;
    }
    if (armorDurability <= 0) {
        document.getElementById("testResult").innerText = "Armor has been spent. Recover a new sample to continue testing.";
        return;
    }

    const buildCostCurrency = costToCurrency(cost);
    if (money < buildCostCurrency) {
        document.getElementById("testResult").innerText = `Insufficient funds to test. Shell build cost is ${currencyText(buildCostCurrency)}.`;
        return;
    }

    armorDurability--;
    awardMoney(-buildCostCurrency);

    const shellKey = getShellCompositionKey();
    const changedComposition = shellKey !== lastTestedShellKey;
    const actualStats = calculateArmorStats(core, casing, powder, currentArmor);

    // Store best-known (max observed) knowledge for this part+armor profile
    knownStats.core[core.category] = knownStats.core[core.category] || {};
    knownStats.core[core.category][core.type] = knownStats.core[core.category][core.type] || {};
    const oldCore = knownStats.core[core.category][core.type][currentArmor] || {};
    knownStats.core[core.category][core.type][currentArmor] = {
        power: Math.max(oldCore.power ?? 0, actualStats.power),
        explosiveness: Math.max(oldCore.explosiveness ?? 0, actualStats.explosiveness),
        cost: Math.max(oldCore.cost ?? 0, actualStats.cost),
        stability: Math.max(oldCore.stability ?? 0, actualStats.stability),
        penetration: Math.max(oldCore.penetration ?? 0, actualStats.penetration)
    };

    knownStats.casing[casing] = knownStats.casing[casing] || {};
    const oldCasing = knownStats.casing[casing][currentArmor] || {};
    knownStats.casing[casing][currentArmor] = {
        power: Math.max(oldCasing.power ?? 0, actualStats.power),
        cost: Math.max(oldCasing.cost ?? 0, actualStats.cost),
        stability: Math.max(oldCasing.stability ?? 0, actualStats.stability)
    };

    knownStats.powder[powder] = knownStats.powder[powder] || {};
    const oldPowder = knownStats.powder[powder][currentArmor] || {};
    knownStats.powder[powder][currentArmor] = {
        power: Math.max(oldPowder.power ?? 0, actualStats.power),
        cost: Math.max(oldPowder.cost ?? 0, actualStats.cost),
        stability: Math.max(oldPowder.stability ?? 0, actualStats.stability)
    };

    lastTestedShellKey = shellKey;

    const baseText = `Base shell stats: Power ${formatStat(power)} | Explosiveness ${formatStat(explosiveness)} | Cost ${currencyText(buildCostCurrency)} | Stability ${formatStat(stability)}`;
    const actualText = `Against ${currentArmor}: Power ${formatStat(actualStats.power)} | Explosiveness ${formatStat(actualStats.explosiveness)} | Cost ${currencyText(costToCurrency(actualStats.cost))} | Stability ${formatStat(actualStats.stability)}`;
    let resultText = `Testing Results on ${currentArmor}:\n${baseText}\n${actualText}\nDurability Left: ${armorDurability}\nTest shell expense: -${currencyText(buildCostCurrency)}`;

    if (changedComposition) {
        awardRP(2);
        resultText += `\nRP Gained: +2`;
    } else {
        resultText += `\nNo RP earned. Change components for additional research.`;
    }

    document.getElementById("testResult").innerText = resultText;
    updateDisplay();
    updateTooltip();
    updateArmorDatabase();
    saveGame();
}
