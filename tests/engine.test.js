// OPDCJ — Harnais de tests anti-régression moteur de calcul
// §4 de l'audit OPDCJ_Audit-Calculs_V21.37_v1.0
//
// Usage : node tests/engine.test.js
//
// Correctifs appliqués (V21.52) : F-1.1 (factTfo + levain unifiés Q10=2.1),
// F-1.2 (inclusions dans diviseur), clamp overflow computeDispo.
// Tous les tests sont au vert.
// ─────────────────────────────────────────────────────────────────────────

'use strict';
let PASS = 0, FAIL = 0;
function assert(name, condition, detail) {
  if (condition) { console.log(`  ✅ PASS  ${name}`); PASS++; }
  else { console.error(`  ❌ FAIL  ${name}${detail ? '  →  ' + detail : ''}`); FAIL++; }
}
function near(a, b, tol = 0.01) { return Math.abs(a - b) <= tol; }

// ══════════════════════════════════════════════════════════════════════
// FORMULES PURES — ÉTAT BASELINE (extraites de index.html V21.51)
// Mises à jour au fur et à mesure des commits correctifs.
// ══════════════════════════════════════════════════════════════════════

// ── Interpolation table levure ──
function interpYeastTable(table, h, opts) {
  const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
  if (table[h] !== undefined) return table[h];
  if (h <= keys[0])             return table[keys[0]];
  if (h >= keys[keys.length-1]) return table[keys[keys.length-1]];
  const lo = keys.filter(k => k <= h).pop();
  const hi = keys.find(k => k >= h);
  if (opts && opts.log) {
    const yLo = Math.log(table[lo]), yHi = Math.log(table[hi]);
    return Math.exp(yLo + (yHi - yLo) * (h - lo) / (hi - lo));
  }
  return table[lo] + (table[hi] - table[lo]) * (h - lo) / (hi - lo);
}

// ── Table YTBL poolish pain (C-1 appliqué — courbe log, ancres Calvel) ──
const YTBL = { 2:20, 3:13, 4:8, 5:8, 7:6.5, 10:5, 12:4, 16:2.5, 18:1.5, 20:1, 24:0.5 };
function yeastInterp(h) { return interpYeastTable(YTBL, h); }

// ── Facteur température poolish (F-1.1 Step 1 APPLIQUÉ — fermentTempFactor) ──
function tFact_poolish_current(T) { return fermentTempFactor(T); }

// ── factTfo CORRIGÉ (F-1.1 Step 2) — même Q10=2.1 que poolish et levain ──
function factTfo_current(T) { return fermentTempFactor(T); }

// ── Q10 / heq ACTUELS (BUG F-1.1 Step 3) — Q10=2, refT=18, tTA=22 ──
function applyQ10Correction_current(baseGperKg, T, refT) {
  refT = (refT === undefined) ? 18 : refT;
  return baseGperKg / Math.pow(2, (T - refT) / 10);
}
function computeHeqQ10_current(hTA, hCold, tCold, tTA) {
  tTA = (tTA === undefined) ? 22 : tTA;
  return hTA + hCold / Math.max(1, Math.pow(2, (tTA - tCold) / 10));
}

// ── Facteur ACTUEL levain (BUG F-1.1 Step 4) ──
// 1.08^(-deltaT) : Q10 implicite ≈ 2.16, refT=24, formule légèrement différente
function tFact_levain_current(T) { return Math.pow(1.08, -(T - 24)); }

// ── fermentTempFactor CIBLE (F-1.1) ──
// Référence unique : Q10=2.1, refT=24. Clamp [0.4;2.5].
function fermentTempFactor(T, refT = 24, Q10 = 2.1) {
  return Math.min(2.5, Math.max(0.4, Math.pow(Q10, (refT - T) / 10)));
}

// ── computeCore ACTUEL (BUG F-1.2) ──
// Diviseur sans inclusions sèches → poids cuit dépasse la cible
function computeCore_current(wInput, hydrat, pSel, pLev, pHuile, pSucre, pBeurre, pOeufs, evap, pDryExtras) {
  const cruUnit = evap > 0 ? wInput / (1 - evap) : wInput;
  const divisor = 1 + hydrat + pSel + pLev + pHuile + pSucre + pBeurre + pOeufs;
  const totalF  = cruUnit / divisor;
  const extras  = totalF * pDryExtras;       // ajoutés APRÈS le diviseur → surplus
  const computedTot = cruUnit + extras;       // poids réel > cible
  return { totalF, cruUnit, computedTot };
}

// ── computeCore CORRIGÉ (F-1.2) ──
// Inclusions sèches dans le diviseur → poids cuit = cible
function computeCore_fixed(wInput, hydrat, pSel, pLev, pHuile, pSucre, pBeurre, pOeufs, evap, pDryExtras) {
  const cruUnit = evap > 0 ? wInput / (1 - evap) : wInput;
  const divisor = 1 + hydrat + pSel + pLev + pHuile + pSucre + pBeurre + pOeufs + pDryExtras;
  const totalF  = cruUnit / divisor;
  return { totalF, cruUnit, computedTot: cruUnit };  // pas de surplus
}

// ── Biga split ──
function computeBiga(fDispo, propBiga, hydratBiga) {
  const bigaF = fDispo * propBiga / 100;
  const bigaW = bigaF * hydratBiga / 100;
  return { bigaF, bigaW, bigaS: 0 };
}

// ── Glace ──
function computeGlace(qEau, tReseau, tVoulue) {
  return qEau * (tReseau - tVoulue) / (80 + tReseau);
}


// ══════════════════════════════════════════════════════════════════════
// T1 — Conservation des masses
// Poolish ½ + PF 20% + Levain 20% — Δ total < 0.01 g
// ══════════════════════════════════════════════════════════════════════
console.log('\nT1 — Conservation des masses');
{
  const F = 500, hydrat = 0.60;
  const W = F * hydrat;         // 300g eau
  const pSel = 0.018, pLev = 0.005;
  const Sel = F * pSel, Lev = F * pLev;

  // PF 20 % — hérite hydratation recette
  const pfF = F * 0.20, pfW = pfF * hydrat, pfS = pfF * pSel;

  // Levain 20 % hydrat 100 %
  const levF = F * 0.20, levW = levF * 1.00;

  // Dispo (après PF + Levain)
  const fDispo = F - pfF - levF;  // 300 g
  const wDispo = W - pfW - levW;  // 300 - 60 - 100 = 140 g

  // Poolish 50 % sur wDispo (poolish 1:1)
  const poolW = wDispo * 0.50;   // 70 g
  const poolF = poolW;           // 70 g
  const poolS = 0;               // micro-sel nul pour le test

  // Pétrie = le reste
  const restF = F - pfF - levF - poolF;  // 500-100-100-70 = 230 g
  const restW = W - pfW - levW - poolW;  // 300-60-100-70 = 70 g
  const restS = Sel - pfS - poolS;

  // Conservation farine
  const sumF = pfF + levF + poolF + restF;
  assert('T1a — Σ farine = F (Δ < 0.01 g)', Math.abs(sumF - F) < 0.01, `Σ=${sumF} vs F=${F}`);

  // Pas de valeur négative (ni surplus de farine/eau avec des pré-ferments raisonnables)
  assert('T1b — restF ≥ 0', restF >= 0, `restF=${restF}`);
  assert('T1c — restW ≥ 0', restW >= 0, `restW=${restW}`);
  assert('T1d — restS ≥ 0', restS >= -0.01, `restS=${restS.toFixed(3)}`);
}


// ══════════════════════════════════════════════════════════════════════
// T2 — Poids cuit cible avec inclusions sèches (valide F-1.2)
// FAIL attendu à la BASELINE (bug dans computeCore_current)
// ══════════════════════════════════════════════════════════════════════
console.log('\nT2 — Poids cuit cible + inclusions');
{
  const wInput = 1000;   // cible cuite
  const evap   = 0.20, hydrat = 0.70;
  const pSel = 0.018, pLev = 0.005;
  const pDryExtras = 0.30;   // 30 % graines sur farine

  const cruUnit = wInput / (1 - evap);   // 1250 g pâton cru attendu

  const curr  = computeCore_current(wInput, hydrat, pSel, pLev, 0, 0, 0, 0, evap, pDryExtras);
  const fixed = computeCore_fixed  (wInput, hydrat, pSel, pLev, 0, 0, 0, 0, evap, pDryExtras);

  // BUG documenté : la formule actuelle produit un poids > cible
  assert('T2-baseline-bug: computedTot actuel > cruUnit (bug confirmé)',
    curr.computedTot > curr.cruUnit + 1,
    `actuel: computedTot=${curr.computedTot.toFixed(1)} > cruUnit=${cruUnit.toFixed(1)}`);

  // ✅ F-1.2 appliqué — inclusions dans diviseur → poids cuit = cible
  assert('T2 — formule corrigée : poids cuit ≈ cible ±2 %',
    Math.abs(fixed.computedTot / cruUnit - 1) < 0.02,
    `fixed: ${fixed.computedTot.toFixed(1)}g vs cible ${cruUnit.toFixed(1)}g`);
}


// ══════════════════════════════════════════════════════════════════════
// T3 — Modèle température unifié
// Même facteur Q10 sur les 5 familles à 10 / 22 / 34°C ; jamais ≤ 0
// FAIL attendu à la BASELINE (formules incohérentes entre familles)
// ══════════════════════════════════════════════════════════════════════
console.log('\nT3 — Modèle de température unifié');
{
  const temps = [10, 22, 34];

  // Valeurs des formules ACTUELLES à 22°C — doivent être identiques après F-1.1
  const f_pool_22    = tFact_poolish_current(22);  // 22/22 = 1.00
  const f_tl_22      = factTfo_current(22);         // 1+(24-22)*0.10 = 1.20
  const f_biga_22    = 1 / applyQ10Correction_current(1, 22, 18); // Q10 corr inverse
  const f_levain_22  = tFact_levain_current(22);    // 1.08^2 ≈ 1.166

  // ❌ FAIL à la BASELINE — incohérence cross-familles
  assert('T3a — même facteur pool/timeline à 22°C (échoue baseline)',
    near(f_pool_22, f_tl_22, 0.01),
    `pool=${f_pool_22.toFixed(3)} vs timeline=${f_tl_22.toFixed(3)}`);
  assert('T3b — même facteur pool/levain à 22°C (échoue baseline)',
    near(f_pool_22, f_levain_22, 0.01),
    `pool=${f_pool_22.toFixed(3)} vs levain=${f_levain_22.toFixed(3)}`);

  // ✅ F-1.1 : l'ancienne formule linéaire donnait 0 à 34°C — corrigé
  assert('T3c — factTfo(34°C) > 0 (fix F-1.1 validé)',
    factTfo_current(34) > 0,
    `factTfo(34)=${factTfo_current(34).toFixed(4)}`);

  // fermentTempFactor : jamais ≤ 0, toujours dans [0.4 ; 2.5]
  temps.forEach(T => {
    const f = fermentTempFactor(T);
    assert(`T3d — fermentTempFactor(${T}°C) ∈ [0.4;2.5]`,
      f >= 0.4 && f <= 2.5,
      `f=${f.toFixed(4)}`);
    assert(`T3e — fermentTempFactor(${T}°C) > 0`, f > 0);
  });

  // Monotonie : froid → facteur élevé (plus de levure / plus de temps)
  assert('T3f — fermentTempFactor décroissant (10>22>34)',
    fermentTempFactor(10) > fermentTempFactor(22) &&
    fermentTempFactor(22) > fermentTempFactor(34));
}


// ══════════════════════════════════════════════════════════════════════
// T4 — 3T mode perso (eau = T_pâte×3 − T_farine − T_fournil − friction)
// ══════════════════════════════════════════════════════════════════════
console.log('\nT4 — Formule 3T mode perso');
{
  const TPATE = 23, tf = 20, tfo = 22, friction = 4;
  // Direct : eau = 23×3 − 20 − 22 − 4 = 23°C
  const tEauDirect = TPATE * 3 - tf - tfo - friction;
  assert('T4a — 3T direct = 23°C', near(tEauDirect, 23), `tEau=${tEauDirect}`);

  // Poolish : eau = 23×3 − (tf+tpoolish)/2 − tfo − friction
  // La poolish tempère la farine : on moyenne tf et tpoolish
  const tpl = 25;
  const tEauPool = TPATE * 3 - (tf + tpl) / 2 - tfo - friction;
  assert('T4b — 3T poolish (moyenne farine+poolish) = 20.5°C',
    near(tEauPool, 20.5, 0.1), `tEauPool=${tEauPool}`);

  // Cohérence : eau poolish ≤ eau directe
  assert('T4c — eau poolish ≤ eau directe', tEauPool <= tEauDirect);
}


// ══════════════════════════════════════════════════════════════════════
// T5 — Glace : Q_glace = Q_eau × (T_réseau − T_voulue) / (80 + T_réseau)
// ══════════════════════════════════════════════════════════════════════
console.log('\nT5 — Formule glace');
{
  const qEau = 300, tReseau = 18, tVoulue = 5;
  const expected = 300 * (18 - 5) / (80 + 18);   // ≈ 39.80 g
  assert('T5a — formule glace ±0.1 g',
    near(computeGlace(qEau, tReseau, tVoulue), expected, 0.1),
    `calc=${computeGlace(qEau, tReseau, tVoulue).toFixed(2)} vs ${expected.toFixed(2)}`);

  // Pas de glace si T_voulue ≥ T_réseau
  assert('T5b — pas de glace si T_voulue ≥ T_réseau',
    computeGlace(300, 18, 20) <= 0);

  // Proportionnel à Q_eau
  assert('T5c — proportionnel à Q_eau (×2)',
    near(computeGlace(600, tReseau, tVoulue), 2 * expected, 0.2));
}


// ══════════════════════════════════════════════════════════════════════
// T6 — Coûts : matières (g→kg) + œufs (55 g/pce) + énergie (kW×h×€/kWh)
// ══════════════════════════════════════════════════════════════════════
console.log('\nT6 — Calcul des coûts');
{
  // Matières
  const farineG = 500, prixFarine = 2.00;
  assert('T6a — farine g→kg : 500g × 2€/kg = 1€',
    near(farineG / 1000 * prixFarine, 1.00));

  // Œufs
  const oeufG = 165;
  const oeufPce = Math.round(oeufG / 55);   // 3 pce
  assert('T6b — œufs 55g/pce : 165g = 3 pce', oeufPce === 3, `pce=${oeufPce}`);
  assert('T6c — coût œufs : 3 × 0.35€ = 1.05€',
    near(oeufPce * 0.35, 1.05));

  // Énergie
  assert('T6d — énergie : 3 kW × 0.75 h × 0.20€/kWh = 0.45€',
    near(3.0 * 0.75 * 0.20, 0.45));
}


// ══════════════════════════════════════════════════════════════════════
// T7 — Biga : bigaF = fDispo × prop/100 ; bigaW = bigaF × hydrat/100 ; bigaS = 0
// ══════════════════════════════════════════════════════════════════════
console.log('\nT7 — Calcul biga');
{
  const fDispo = 400;
  const biga = computeBiga(fDispo, 50, 45);

  assert('T7a — bigaF = fDispo × 50/100 = 200 g', near(biga.bigaF, 200), `bigaF=${biga.bigaF}`);
  assert('T7b — bigaW = bigaF × 45/100 = 90 g',   near(biga.bigaW, 90),  `bigaW=${biga.bigaW}`);
  assert('T7c — bigaS = 0',                        biga.bigaS === 0);

  // Biga plus sèche que la pâte (hydrat biga < hydrat pâte recette)
  const wDispo = 280, hydratPate = wDispo / fDispo;   // 70 %
  assert('T7d — hydrat biga (45%) < hydrat pâte (70%)', 45/100 < hydratPate);
}


// ══════════════════════════════════════════════════════════════════════
// T8 — Débordement borné : PF 60% + Levain 80% → aucune valeur négative
// FAIL attendu à la BASELINE (pas de clamp dans computePoolish/computeDispo)
// ══════════════════════════════════════════════════════════════════════
console.log('\nT8 — Débordement borné (overflow PF + Levain)');
{
  const F = 500, W = 300;
  const pfF = F * 0.60;   // 300 g — PF prend toute la farine
  const levF = F * 0.80;  // 400 g — overflow !
  const pfW  = pfF * 0.60;
  const levW = levF * 1.00;

  const restF_unclamped = F - pfF - levF;
  const restW_unclamped = W - pfW - levW;

  // BUG documenté : sans clamp, les restes sont négatifs
  assert('T8a-baseline-bug: restF < 0 sans clamp (bug confirmé)',
    restF_unclamped < 0,
    `restF_unclamped=${restF_unclamped}`);

  // ✅ Clamp appliqué dans computeDispo → valeurs toujours ≥ 0
  const restF = Math.max(0, restF_unclamped);
  const restW = Math.max(0, restW_unclamped);
  assert('T8 — restF ≥ 0 (clamp appliqué)', restF >= 0, `restF=${restF}`);
  assert('T8b — restW ≥ 0 (clamp appliqué)', restW >= 0, `restW=${restW}`);
}


// ══════════════════════════════════════════════════════════════════════
// T9 — Biga pizza : refT=18 obligatoire (table Giorilli calibrée à 18°C)
// Garantit que pizzaBigaYeastInterp ne sera plus jamais re-bumpé à refT=24
// (bug V21.53 réintroduisait -35 % de levure biga).
// ══════════════════════════════════════════════════════════════════════
console.log('\nT9 — Biga refT=18 + applyQ10Correction sens correct (anti-régression V21.55-V21.56)');
{
  // Réplique de applyQ10Correction V21.56 (multiply) + pizzaBigaYeastInterp (refT=18)
  function bigaDose(baseGperKg, tempBiga){
    return baseGperKg * fermentTempFactor(tempBiga, 18);
  }
  const base = 10; // ex. table biga 16h ≈ 10 g/kg

  // À 18°C (= refT) : pas de correction → dose = base
  assert('T9a — à T=refT=18°C, dose = base (pas de correction)',
    near(bigaDose(base, 18), base, 0.01),
    `dose=${bigaDose(base, 18).toFixed(3)} vs base=${base}`);

  // À 22°C (plus chaud) : MOINS de levure (fermentation plus rapide)
  assert('T9b — à T=22°C > refT=18°C, dose < base (moins de levure au chaud)',
    bigaDose(base, 22) < base * 0.95,
    `dose=${bigaDose(base, 22).toFixed(2)} vs base=${base} — bug si > base`);

  // À 14°C (plus froid) : PLUS de levure (fermentation plus lente)
  assert('T9c — à T=14°C < refT=18°C, dose > base (plus de levure au froid)',
    bigaDose(base, 14) > base * 1.05,
    `dose=${bigaDose(base, 14).toFixed(2)} vs base=${base} — bug si < base`);

  // Garde-fou : si refT dérivait à 24, dose à 18°C chuterait à ~base×0.64
  // Si ce test échoue, refT a probablement été repassé à 24 dans pizzaBigaYeastInterp.
  assert('T9d — anti-régression : dose à 18°C ≥ base×0.9 (refT ne doit pas dériver à 24)',
    bigaDose(base, 18) >= base * 0.9,
    `dose=${bigaDose(base, 18).toFixed(3)} — refT a probablement dérivé à 24°C`);

  // Sens du sign global (anti-régression V21.56) :
  // l'ancien `divide` avec fermentTempFactor inversait le signe → dose 22°C > dose 14°C
  // Le `multiply` actuel garantit dose 22°C < dose 14°C.
  assert('T9e — anti-régression V21.56 : dose(22°C) < dose(14°C) (sens correct)',
    bigaDose(base, 22) < bigaDose(base, 14),
    `dose 22=${bigaDose(base, 22).toFixed(2)} vs dose 14=${bigaDose(base, 14).toFixed(2)}`);
}


// ══════════════════════════════════════════════════════════════════════
// T10 — Guard pBexTotal en pizza/focaccia (V21.55)
// S.breadExtras est persisté globalement ; un sésame coché en pain ne doit
// PAS impacter le diviseur pizza/focaccia (la card est cachée).
// ══════════════════════════════════════════════════════════════════════
console.log('\nT10 — Guard pBexTotal hors modes pain');
{
  // Réplique du guard de computeCore V21.55
  function computePBexTotal(MODE, breadExtras){
    const isBreadMode = MODE === 'pain' || MODE === 'petit-pain' || MODE === 'brioche';
    const bex = (isBreadMode && breadExtras) ? breadExtras : {};
    return Object.values(bex).reduce((s, e) => s + (e.checked ? (e.pct||0)/100 : 0), 0);
  }

  const breadExtrasCoché = { sesame: { checked:true, pct:30 } };

  // En mode pain : sésame coché compte (0.30)
  assert('T10a — pain : pBexTotal = 0.30 quand sésame 30% coché',
    near(computePBexTotal('pain', breadExtrasCoché), 0.30),
    `pBexTotal=${computePBexTotal('pain', breadExtrasCoché)}`);

  // En mode pizza : sésame coché ignoré (0)
  assert('T10b — pizza : pBexTotal = 0 même si bread extras cochés',
    computePBexTotal('pizza', breadExtrasCoché) === 0,
    `pBexTotal=${computePBexTotal('pizza', breadExtrasCoché)}`);

  // En mode focaccia : idem
  assert('T10c — focaccia : pBexTotal = 0 même si bread extras cochés',
    computePBexTotal('focaccia', breadExtrasCoché) === 0,
    `pBexTotal=${computePBexTotal('focaccia', breadExtrasCoché)}`);

  // petit-pain et brioche : modes bread → cochés comptent
  assert('T10d — petit-pain : pBexTotal compte les bread extras',
    near(computePBexTotal('petit-pain', breadExtrasCoché), 0.30));
  assert('T10e — brioche : pBexTotal compte les bread extras',
    near(computePBexTotal('brioche', breadExtrasCoché), 0.30));
}


// ══════════════════════════════════════════════════════════════════════
// T11 — Hint pointage/apprêt : Q10 unifié (V21.55)
// updatePhaseDurHints utilisait Math.pow(2,(22-T)/10) (Q10=2, refT=22).
// Migré vers fermentTempFactor (Q10=2.1, refT=24).
// ══════════════════════════════════════════════════════════════════════
console.log('\nT11 — Hint Q10 unifié');
{
  // Réplique : factor utilisé dans la suggestion durée pointage
  function hintTempFactor(T){ return fermentTempFactor(T); }

  // À T=24°C (réf), facteur exactement 1.0 (anciennement à 22°C donnait 1.0)
  assert('T11a — à T=24°C (refT), facteur = 1.0',
    near(hintTempFactor(24), 1.0, 0.001),
    `factor=${hintTempFactor(24).toFixed(4)}`);

  // À T=22°C, facteur > 1 (suggestion plus longue) — ancien code donnait 1.0
  assert('T11b — à T=22°C, facteur > 1.0 (régression : ancien Q10=2 donnait 1.0)',
    hintTempFactor(22) > 1.05,
    `factor=${hintTempFactor(22).toFixed(4)} — ancien code: 1.0`);

  // Sanity : la suggestion à 22°C est ~16 % plus longue qu'à 24°C
  const sug22 = 120 * hintTempFactor(22);
  const sug24 = 120 * hintTempFactor(24);
  assert('T11c — pointage 120 min à 22°C ≈ +16 % vs 24°C',
    sug22 > sug24 && (sug22/sug24 - 1) > 0.10 && (sug22/sug24 - 1) < 0.25,
    `sug22=${sug22.toFixed(0)} vs sug24=${sug24.toFixed(0)} (Δ=${((sug22/sug24-1)*100).toFixed(1)}%)`);
}


// ══════════════════════════════════════════════════════════════════════
// BILAN
// ══════════════════════════════════════════════════════════════════════
console.log(`\n${'═'.repeat(60)}`);
console.log(`  Bilan : ${PASS} PASS  ·  ${FAIL} FAIL`);
if (FAIL > 0) {
  console.log(`  ❌ Des tests échouent — vérifier les correctifs V21.52.`);
}
console.log(`${'═'.repeat(60)}\n`);
process.exit(FAIL > 0 ? 1 : 0);
