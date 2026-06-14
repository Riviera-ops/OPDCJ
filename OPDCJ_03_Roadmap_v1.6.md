# 🌾 Ô Pain De Ce Jour — Roadmap

> **Version : v1.6** · 14 juin 2026 · App ciblée : **OPDCJ V21.63**
> Fichier : `OPDCJ_03_Roadmap_v1.6.md` (remplace v1.5)
> Doc projet (3 pièces) : ① Master-Prompt · ② Référentiel · **③ Roadmap**
> Pilote du projet : périmètre, architecture, axes d'évolution, specs des fonctionnalités, historique. À joindre comme fichier de connaissance.
> *v1.6 : sprint V21.57-V21.63 — Module 4.3 Autolyse complet · chantier Fermentation & Process (réorganisation 3 sous-cards accordéon + pétrin pilote TB) · composeur farines flags+stepper · 3 bugs (BUG 1 checkboxes Recette, Planning autolyse grisée, Planning preferm grisée pour poolish/levain). Harnais 63 tests.*

---

## 1. Périmètre fonctionnel actuel (V21.63)

Page unique, **5 onglets** (barre de navigation fixe).

**🍞 Recette — cœur de calcul.** Multi-produits : Pain · Pizza · Focaccia · Petit Pain · Brioche.
Pain en 4 étapes (Farine → Fermentation → Poolish → Pâton & quantité) : choix de farine + W +
protéines ; pré-ferments **combinables** (Poolish ⊕ Biga, PF et Levain libres) ; fermentation longue avec froid + calcul
auto de levure ; cible par poids cuit + hydratation + évaporation. Pizza (Napo/Romana/Teglia, coef
pizzaiolo), Focaccia (épaisseur, densité, plaque), Brioche (beurre/sucre/œufs/lait/miel). Ingrédients
spéciaux (graines, fruits secs, olives, malt, gluten, vit. C). T° de coulage (formule des 3T + glace).
Pesée du lot.

**⏱ Planning — timeline.** 22 phases paramétrables (durées éditables) ; heure de sortie du four →
calcul **rétrograde** horodaté ; alarme configurable par phase ; **export `.ics`**.

**💰 Coûts.** Matières (€/kg, œufs €/pce) + énergie (kWh, puissance four, préchauffe + cuisson) +
extras/garniture ; coût total et par pièce.

**📁 Archives.** Bibliothèque filtrable par famille ; par recette : Charger / PDF / Export JSON /
Favori ; import/export JSON.

**🧬 Levain.** Création J1→J7 (% chef décroissant) ; entretien (rappels) ; rafraîchi pré-fournée ;
export `.ics`.

**Stockage & sync.** Local d'abord + sync optionnelle GitHub Gist privé (Gist ID, autosync, test).

---

## 2. Architecture technique

*(État au 14 juin 2026 après sprint V21.54 : ~10 200 lignes, ~350 ko HTML, ~215 fonctions, **PWA offline complète**.)*

- **Mono-fichier** HTML + CSS + JS inline (un seul `<script>`). Aucun framework, aucun build, tout
  côté client. Hébergé sur GitHub Pages. `APP_VERSION` affichée en pied de page.
- **PWA hors-ligne 100 %** (V21.5-V21.10) : `manifest.json` + `sw.js` (cache-first sur app shell + polices), polices Nunito et Playfair Display **auto-hébergées** dans `/fonts`. Bump `CACHE = 'opdcj-vX.Y'` à chaque commit pour purge auto.
- **Clés `localStorage`** : `opdcj_theme`, `opdcj_lev_types`, `opdcj-levain-journal`,
  `opdcj_default_recipes`, `opdcj_custom_prices`, `opdcj_hidden_toppings`, `opdcj_v14` (hérité),
  config cloud `opdcj_cloud_*`, `opdcj_tombstones`, `opdcj_tb_<mode>`, drapeaux one-shot.
- **Sync Gist** : `gistCreate/Read/Update`, `cloudPush/Pull/Sync`, **gestion de conflits par
  tombstones** (propage les suppressions). ✅ déjà solide. ⚠️ token GitHub stocké en clair.
- **Moteur de calcul** factorisé : `computeCore`, `computePF`, `computeLevain`, `computeDispo`, `computePoolish`,
  `computePizzaBiga`, `computeWaterTemp` (3T), `interpYeastTable` + `applyQ10Correction` + `computeHeqQ10` (centralisés V21.19),
  `wIdealForDuration`, `computeFlourBreakdown/computePizzaFlourMix`, `computeCosts`, `computeTimeline`,
  `renderFermOut`, blocs `levain*`, `*Ics*`. Ordre `computeAll` : core → PF → Levain → Dispo → Pool → Biga → render → renderFermOut.
- **Modèle de température unifié V21.52** : `fermentTempFactor(T, refT=24, Q10=2.1)` — référence unique pour poolish, timeline (factTfo), biga, levain rafraîchi. Clamp [0,4 ; 2,5].
- **Module Autolyse V21.57** : état recette (`S.autolyse`) → friction effective -2°C + shift réf farine vers fournil au-delà de 60 min (100 % à 150 min). Sync vers phase Planning autolyse.
- **TB pilotée par pétrin V21.61** : 5 types de pétrin (Spirale, Oblique, Batteur/Robot, Bras plongeants/Artofex, Manuel) + Personnalisé. Maps PETR_TB_DEFAULTS / PETR_FRICTION_DEFAULTS / PETR_V1V2_DEFAULTS. Migration automatique des recettes legacy (hand/spiral-slow/spiral-pro).
- **Harnais de tests** (`tests/engine.test.js`, Node.js) : 63 assertions anti-régression (8 groupes baseline + T9/T10/T11 V21.55-V21.56 + T12/T13/T14 V21.57 Autolyse). À exécuter après chaque chantier moteur.

> ⚠️ Toujours coder à partir du `.html` source. Un `.mht` (snapshot) ne contient pas le JS.

---

## 3. Axes d'évolution

### A. Consolidation (fiabiliser)
1. **PWA réellement hors-ligne — priorité n°1.** ✅ **Fait V21.5-V21.10** (manifest + SW + polices auto-hébergées).
2. **Sécuriser le token GitHub** : token *fine-grained* scope gist uniquement, jamais committé, alerte
   appareil partagé.
3. **Migration de schéma unifiée** : champ `schemaVersion` + fonction `migrate()` (aujourd'hui versioning
   implicite via noms de clés). *Partiel : `fermentNormalizeState` introduit en V21.27 pour le state Pilote.*
4. **Robustesse stockage** : perte de `localStorage`, quota, échec réseau de sync.
5. **Validation des saisies** : bornes hydratation/%/températures, alertes `.a-warn`. *Partiel : alerte rouge pré-ferments > 100 % en V21.28.*
6. **Tests des formules** : ✅ **Fait V21.52, étendu V21.55-V21.57** — harnais `tests/engine.test.js` (Node.js, 63 assertions) couvrant conservation des masses, poids cuit, modèle T°, 3T, glace, coûts, biga, débordement, refT biga, guard pBex, hint Q10, autolyse (inactive/30min/longue).
7. **Accessibilité tactile** : cibles, contrastes, `inputmode` numérique.
8. **Audit moteur (V21.37) — correctifs appliqués :** ✅
   - **F-1.1** (V21.52-V21.53) : modèle T° unifié — `fermentTempFactor` remplace les 5 formules ad hoc (factTfo linéaire, Q10=2/réf18, 1,08^δT levain). Bug factTfo=0 à 34°C éliminé.
   - **F-1.2** (V21.52) : inclusions sèches (graines/noix/…) incluses dans le diviseur de `computeCore` → poids cuit = cible (était +17 % avec 30 % de graines).
   - **Clamp overflow** (V21.52) : `computeDispo` — `Math.max(0,…)` sur fDispo/wDispo → jamais négatif si PF+Levain > 100 %.
   - **C-1** (V21.54) : recalibration YTBL poolish pain (ancres Calvel/Technomitron : 4h=8 g/kg vs 15 g/kg auparavant).
   - **C-2** (V21.53) : preset Napolitaine hydratation 65 % → **60 %** (AVPN classique 58–62 %).
   - Hors périmètre (non traités) : F-1.3 à F-1.7, C-3.

### B. Améliorations UI/UX
- Fiche fournée **imprimable** (pesée + timeline + coûts).
- Timeline **temps réel** : phase en cours surlignée + compte à rebours.
- Comparateur de recettes côte à côte. Mémoire des derniers réglages par famille. Mode « gros chiffres ».
- **Refonte UI Terracotta** (jour/nuit). ✅ **Fondation + phase B faites V21–V21.13** (tokens, Nunito tabulaire, `.result` câblé, icônes SVG, éradication des ~320 emoji, Technomitron).
- **Chantier UI 13 points** (V21.39–V21.51, 13 juin) : composeur farines pain, sélecteur levain, bande fixe subheader, sync UI, export .ics. Voir §4.6.

### C. Nouvelles fonctionnalités
- Voir specs détaillées §4 (modules farine, fermentation, autolyse, chrono).
- Aussi en réserve : mise à l'échelle de lot · journal de fournées (REX) · calcul de buée/conduite de
  cuisson · liste de courses · export/partage de recette lisible.

---

## 4. Spécifications des fonctionnalités validées

### 4.1 — Module « Assemblage de farines » (meunerie, transverse) — ✅ COMPLET V21.14-V21.18, V21.23
- **a) Bibliothèque de farines** persistante : appellation · espèce (blé tendre/dur/seigle/épeautre) · granulométrie · cendres · protéines · W · P/L · absorption · prix €/kg.
- **b) Composeur** : N farines en %, sortie pondérée (W, protéines, cendres, P/L, drapeaux).
- **c) Spécificités blé dur / rimacinata** : voir Référentiel §A.
- **d) Couplage fermentation** : alerte cohérence W de mélange ↔ maturation/force.
- **Bonus V21.23** : créer une farine directement depuis le composeur, T45 ajoutée, quantités/poids pizza libres.

### 4.2 — Module « Pilote de fermentation » (transverse) — ✅ COMPLET V21.19-V21.28

**Sous-commit 1/4 — V21.19 — Centralisation Q10 + interpolation** (refactor invisible)
`interpYeastTable`, `applyQ10Correction`, `computeHeqQ10` ; anciennes fonctions deviennent wrappers minces. Byte-perfect sur les sorties.

**Sous-commit 2/4 — V21.22 — UI unifiée**
Carte « Pilote de fermentation » partagée par les 5 familles. Stratégie XOR 5 segments. Profil maturation 3 segments. État JSON persistant.

**Sous-commit 3/4 — V21.24 — Branchement moteur** via adaptateur
`fermentSyncToLegacy()` pousse l'état Pilote vers les champs legacy. `fermentMigrateFromLegacy()` reconstruit `state.ferment` au load des recettes anciennes.

**Sous-commit 4/4 — V21.25 — Retrait UI legacy + cards riches dans le Pilote**
Toggles Sur Poolish/Biga, durée TA legacy, card Étape 3, section Pré-fermentation pain retirées (DOM conservé pour sync). Cards riches « Configuration de la Poolish/Biga/PF/Levain » intégrées dans le Pilote. Biga restreint à pizza/focaccia (CSS + fallback `switchMode`). 9 datalists pour saisie libre avec suggestions.

### 4.2bis — Combinaison de pré-ferments — ✅ COMPLET V21.27-V21.29

Remplace la XOR à 5 stratégies par : **stratégie principale XOR** (Directe/Poolish/Biga) + **2 boosters indépendants** (+ Pâte fermentée, + Levain). Cumulables.

**Modèle** : `{ main, addPF, addLevain, poolish, biga, pf, levain }`.

**Formules** (V21.28) :
```
F_PF = F × pf.pct/100   · W_PF = F_PF × hyd_recette   · S_PF = F_PF × pSel   · Y_PF = 0
F_lev = F × lev.pct/100 · W_lev = F_lev × lev.hydrat/100 · Y_lev = S_lev = 0
F_dispo = max(0, F − F_PF − F_lev)    · W_dispo = max(0, W − W_PF − W_lev)   [clamp V21.52]
F_pool = W_pool = W_dispo × pool.pct/100      (si main='poolish')
F_biga = F_dispo × biga.prop/100              (si main='biga')
F_pétrie = F − F_pool − F_biga − F_PF − F_lev
```

**Garde-fou** : alerte rouge sous le Pilote si somme PF + Levain > 100 % de la farine ou de l'eau (`S.preFermOverflow`).
**Rétro-compat** : sans booster, `F_dispo === F` → calculs identiques à V21.26.
**Migration** : `fermentNormalizeState` (V21.27) mappe l'ancien `strategy` ('pf'/'levain') vers `main='directe' + add*=true`.

### 4.3 — Autolyse dans la recette — ✅ COMPLET V21.57
Paramètre de recette : durée (10-240 min) · sel inclus (informationnel) · bassinage (informationnel).
**Effet `computeWaterTemp`** :
  (a) `frictionEff = max(0, friction - 2)` quand actif (mode 3T custom).
  (b) `autoFrictionBonus = min(friction, 2)` en mode TB preset → eau +bonus°C.
  (c) `tfEff = tf + (tfo - tf) × shift` où `shift = min(1, (duree - 60) / 90)` (seuil 60 min, 100 % à 150 min) → la référence farine migre vers la T° fournil pour les autolyses longues.
**Sync vers Planning** : `syncAutolyseToPlanning()` coche/décoche la phase `autolyse` du planMode courant et fixe sa durée. Appelée avant `computeWaterTemp` + `computeTimeline` dans `computeAll`.
**Tests** : T12 (inactive=no effect), T13 (30 min, friction -2°C + clamps), T14 (longue, shift tf vers tfo, eau plus froide).
**Hors brioche** : la card Autolyse est cachée par CSS en mode brioche.
**Intégration V21.58** : déplacé dans la sous-section "Autolyse & bassinage" de la card Fermentation & Process (cf §4.7).

### 4.4 — Onglet Chronomètre — ⚪ NON DÉMARRÉ
Outil du **moment actif**. **Limite mobile à assumer** : iOS/Android suspendent les timers JS écran éteint → ne pas promettre d'alarme fiable hors-écran (le `.ics` reste le filet).
- Temps calculé depuis un **timestamp de fin** (`Date.now()`).
- **Wake Lock** (`navigator.wakeLock`) armé par un premier tap.
- **Branché sur les phases du Planning** : « démarrer cette phase » → charge la durée, enchaîne.

### 4.5 — Refonte UI « Terracotta » (jour + nuit) — ✅ COMPLET V21-V21.13
Tokens jour/nuit dans le Référentiel §B.2. Phase A (fondation) puis phase B (câblage `.result`, icônes en-têtes SVG, éradication des ~320 emoji, Technomitron levure, séparateurs ing-row affinés).

### 4.6 — Chantier UI 13 points — ✅ COMPLET V21.39-V21.51 (13 juin)
Sprint UI déclenché après audit visuel post-V21.29. 13 points définis ; état à V21.54 :
- POINT 1 — Composeur farines pain : ✅ V21.39-V21.42
- POINT 2 — Sélecteur levain : ✅ V21.39-V21.42
- POINT 3-11 — Bande fixe subheader, tags, sync UI : ✅ V21.43-V21.48
- POINT 12 — Export .ics checkboxes (sélection préservée) : ✅ V21.51

### 4.7 — Fermentation & Process (chantier réorganisation) — ✅ COMPLET V21.58-V21.63

Card unifiée renommée "Fermentation & Process" (anciennement "Fermentation"), structurée en **3 sous-sections accordéon repliables** (pattern dédié `.sub-card` + handler indépendant de `.collapsible` parent pour éviter conflit nested) :

- **Pré-ferments & maturation** (sub-card 1, repliée par défaut depuis V21.62) — contenu du Pilote (stratégie XOR Directe/Poolish/Biga + boosters PF/Levain + profil maturation + cards riches).
- **Autolyse & bassinage** (sub-card 2, repliée) — contenu Module 4.3 déplacé.
- **Process & T° de coulage** (sub-card 3, repliée) — T° farine/fournil/poolish/réseau + TB + pétrin + friction + V1/V2 + résultats temp_boxes + glace.

**Tags dynamiques** sur sous-headers repliés (mirror via `renderSubCardTags`) :
- `ferm-sub-tag` : "Directe · Tout TA" / "Poolish + Levain" / etc.
- `autolyse-sub-tag` : "Aucune" / "Autolyse N min" / "Autolyse N min · +sel".
- `process-sub-tag` : mirror de `tb-tag` ("TB 56 · Direct").

**Suppressions** : card `.autolyse-card` standalone, card "Températures de coulage" standalone, sélecteur PA/PVL/PI dans pane-pain (dead code listeners JS subsistent en no-op).

**Mobile-first** : touch targets 44px, transitions opacity .18s sur `.phase-row`.

### 4.8 — TB pilotée par pétrin — ✅ COMPLET V21.61

**Modèle** : le type de pétrin propose TB + friction + durées V1/V2 par défaut. TB reste éditable manuellement après (pétrin propose, user corrige). Pétrin + TB + V1/V2 attachés à la recette (persistés via `getFormData`/`setFormData`).

| Pétrin             | TB | Friction | V1 / V2 (min) |
|--------------------|----|----------|---------------|
| Spirale            | 56 | 4        | 5 / 6         |
| Oblique            | 50 | 3        | 5 / 12        |
| Batteur / Robot    | 60 | 4        | 5 / 6         |
| Bras plongeants / Artofex | 62 | 5 | 6 / 14    |
| Manuel             | 70 | 0        | 15 / 0        |
| Personnalisé       | —  | —        | —             |

**Implementation** : maps globales `PETR_TB_DEFAULTS` / `PETR_FRICTION_DEFAULTS` / `PETR_V1V2_DEFAULTS` + helper `applyPetrDefaults(petrType, opts)`. Listener `pz-petr-type change` applique les défauts. `computeWaterTemp` et init/switchMode utilisent les nouveaux mappings.

**Migration recettes legacy V21.60-** : `petrMigrateLegacy()` → `hand→manuel`, `spiral-slow/pro→spirale`. Appliquée dans `setFormData` et `computeWaterTemp`.

**Champs V1/V2** : informationnels (mémo fiche fournée), N'ENTRENT PAS dans le calcul (on reste en méthode TB).

---

## 5. Ordre d'attaque conseillé

Statut au 14 juin 2026 :
1. ✅ **PWA hors-ligne** — fait V21.5-V21.10
2. ✅ **Refonte UI Terracotta** — fait V21-V21.13
3. ✅ **Modules métier farine + fermentation** — fait V21.14-V21.28 (Modules 4.1 et 4.2 complets, combinaison pré-ferments)
4. ✅ **Chantier UI 13 points** — fait V21.39-V21.51
5. ✅ **Audit moteur — correctifs F-1.1/F-1.2/C-1/C-2** — fait V21.52-V21.54, durci V21.55-V21.56
6. ✅ **Autolyse (§4.3)** — fait V21.57
7. ✅ **Fermentation & Process (§4.7) + TB pilotée par pétrin (§4.8)** — fait V21.58-V21.63
8. ⚪ **Chronomètre** (§4.4) — à attaquer
9. ⚪ **Validation des saisies** (§3.A.5) — bornes hydratation/%/températures avec alertes `.a-warn`
10. ⚪ **Sécuriser le token GitHub** (§3.A.2)

---

## 6. Historique des versions

### Documentation projet
- **Docs v1.6 — 14 juin 2026** : Roadmap → v1.6. Acte V21.57-V21.63 : Module 4.3 Autolyse complet (§4.3), chantier Fermentation & Process (§4.7), TB pilotée par pétrin (§4.8). §1 ajout des nouveaux modules, §2 architecture mise à jour (autolyse + pétrin), §5 ordre d'attaque réordonné (Chrono devient priorité suivante). Harnais 46 → 63 tests (T12/T13/T14 autolyse).
- **Docs v1.5 — 14 juin 2026** : Roadmap → v1.5. Acte V21.55-V21.56 (correctifs des correctifs). Harnais tests : 33 → 46 assertions. Garde-fous explicites contre la dérive de refT biga, l'inversion de sign Q10, et les résidus de formules T°.
- **Docs v1.4 — 14 juin 2026** : Roadmap → v1.4. Comble l'historique V21.30→V21.54. §3.A marque les correctifs moteur ✅. §2 : modèle T° unifié + harnais tests. §4.6 : Chantier UI 13 points. §5 réordonné.
- **Docs v1.3 — 12 juin 2026** : Roadmap → v1.3 (acte le sprint 11-12 juin : Modules 4.1, 4.2 et 4.2bis complets ; PWA offline ; UI Terracotta finalisée).
- **Docs v1.2 — 10 juin 2026** : Roadmap → v1.2 (suivi du build applicatif V21).
- **Docs v1.1 — 10 juin 2026** : Référentiel → v1.1 (Nunito 800 tabulaire ; maquette codée référence). Roadmap → v1.1.
- **Docs v1.0 — 10 juin 2026** : éclatement du master monolithique en 3 fichiers versionnés.

### Application (à tenir à jour à chaque build)

#### Phase A — Fondation V21 (10 juin)
- **V20** — version analysée (état de départ du projet Claude). Référence.
- **V21** — fondation UI Terracotta. Tokens jour + nuit, Nunito 800 tabulaire, encart `.result` non câblé, 4 icônes nav SVG, préfixe `boula` retiré. Moteur intact.

#### Phase B — Sprint 11 juin (V21.4-V21.26, ~26 commits)
- **V21.4-V21.5** : éradication des ~320 emoji (remplacement SVG + texte), bump cache SW, fix title.
- **V21.7** : séparateurs `.ing-row` quasi-invisibles, bump SW.
- **V21.10** : PWA hors-ligne — polices Nunito et Playfair Display auto-hébergées dans `/fonts`, manifest, service worker complet. **Offline 100 % sans Google Fonts.**
- **V21.11** : fix sélecteur recettes + contraste mode jour.
- **V21.12** : levain emoji + Technomitron levure.
- **V21.13** : `.result` câblé sur totaux + chantier Coûts (phase B fin).
- **V21.14** : Module 4.1.a/b — bibliothèque farines (infrastructure).
- **V21.15** : composeur farines + branchement pizza/focaccia.
- **V21.16** : composeur pain/petit-pain/brioche + couplage 4.1.d (alerte W↔maturation). **Module 4.1 complet.**
- **V21.17** : TB unifié toutes familles + bouton thème ; **V21.18** : halo retiré, taille réduite.
- **V21.19** : **Module 4.2 commit 1/4** — centralisation Q10 + interpolation (refactor invisible, byte-perfect).
- **V21.20** : migration paths `/opdcj-/` → `/OPDCJ/` (repo renommé).
- **V21.21** : fix install PWA mobile (form_factor + apple-touch-icon).
- **V21.22** : **Module 4.2 commit 2/4** — Pilote UI unifiée (carte + stratégie XOR + profil maturation).
- **V21.23** : T45 + qty/poids pizza libres + créer farine depuis composeur.
- **V21.24** : **Module 4.2 commit 3/4** — branchement moteur via `fermentSyncToLegacy` + `fermentMigrateFromLegacy`. Migration biga long, pain poolish, sync biga 24h validés.
- **V21.25** : **Module 4.2 commit 4/4** — retrait UI legacy (toggles, étape 3 pré-ferment, section Pré-fermentation pain) ; cards riches Poolish/Biga/PF/Levain intégrées dans le Pilote ; Biga restreinte à pizza/focaccia avec fallback `switchMode` ; 9 datalists ; halo bouton thème supprimé ; police « TOTAL PÂTE » réduite + double « g » corrigé.
- **V21.26** : fix halo bas-gauche header (empiétait sur bouton Recette).

#### Phase C — Sprint 12 juin (V21.27-V21.29)
- **V21.27** : **Combinaison pré-ferments commit 1/3** — UI. 5 radios XOR → 3 radios (Directe/Poolish/Biga) + 2 checkboxes (`+ PF`, `+ Levain`). State `{ main, addPF, addLevain }`. `fermentNormalizeState` migre les states V21.24-V21.26 à la lecture. Cards combinables (Poolish + PF + Levain affichées en même temps). Tag header reflète la combinaison.
- **V21.28** : **Combinaison pré-ferments commit 2/3** — refactor moteur. Nouvelles fonctions `computePF`, `computeLevain`, `computeDispo`, `renderFermOut`. `computePoolish` et `computePizzaBiga` lisent `S.fDispo`/`S.wDispo` (rétro-compat : sans booster, fDispo === farine). Bandeau `#ferm-out` sous le Pilote avec récap pré-ferments cumulés + alerte rouge si somme > 100 %. **8/8 tests anti-régression PASS** (script Node, formules pures).
- **V21.29** : **Combinaison pré-ferments commit 3/3** — finition. Roadmap doc bumpée v1.2 → v1.3. Audit sync legacy `fc-pf/ll/lf` + `fp-*` : aucune lecture par le moteur de calcul → pas de double-comptage possible.

#### Phase D — Sprint 13–14 juin (V21.30-V21.54)
- **V21.30-V21.34** : ajustements icône PWA et logo (upload assets).
- **V21.35-V21.37** : refonte itérative header mode jour → direction J5 « Ivoire & miel » (`--bg:#F5EED8`, `--card:#FFFBEE`).
- **V21.38** : bump version pour forcer refresh icônes PWA.
- **V21.39-V21.42** : **Chantier UI — POINTS 1-2** : composeur farines pain (bouton "+", liste inline) + sélecteur levain enrichi.
- **V21.43-V21.48** : **Chantier UI — POINTS 3-11** : bande fixe subheader (`.sub-header` sticky), synchronisation UI cross-onglets, fixes poolish Planning, alertes.
- **V21.49** : 6 correctifs ciblés — poolish (calcul eau disponible), composeur farines (bouton "+"), alertes fermentation, dose levure sèche/instant, froid long.
- **V21.50** : fix poolish Planning + bouton "+" composeur farines ; fix `APP_VERSION` resté à V21.48.
- **V21.51** : **Chantier UI — POINT 12** : fix export `.ics` — sélection des phases préservée entre ouvertures du panneau.
- **test(étape 0)** : création `tests/engine.test.js` — harnais 8 groupes (33 assertions) baseline avant correctifs ; 29 PASS · 4 FAIL attendus.
- **V21.52** : **Audit moteur — correctifs F-1.1 + F-1.2 + clamp** :
  - F-1.1 Steps 1-2-4 : `fermentTempFactor(T, 24, 2.1)` route poolish, factTfo Planning (×3), levain rafraîchi (×2). Élimine factTfo=0 à 34°C.
  - F-1.2 : `pBexTotal` (bread extras cochés) inclus dans diviseur de `computeCore` → poids cuit = cible.
  - Clamp : `Math.max(0,…)` sur `S.fDispo`/`S.wDispo` dans `computeDispo`.
  - **33/33 tests PASS.**
- **V21.53** : **F-1.1 Step 3 + C-2** :
  - `applyQ10Correction` et `computeHeqQ10` : Q10 2→2.1, refT 18/22→24 (unifié F-1.1).
  - Preset Napolitaine : hydratation 65 % → **60 %** (AVPN classique).
- **V21.54** : **C-1** — recalibration table YTBL poolish pain (ancres Calvel/Technomitron) :
  `{ 2:20, 3:13, 4:8, 5:8, 7:6.5, 10:5, 12:4, 16:2.5, 18:1.5, 20:1, 24:0.5 }`.
  Supprime le pic 4h=15 g/kg (1,5 %) → 8 g/kg (0,8 %).

#### Phase E — Audit post-correctifs (14 juin, V21.55-V21.56)
- **V21.55** : **3 correctifs des correctifs** détectés par re-vérification :
  - **Biga refT** : `pizzaBigaYeastInterp` repasse `refT=18` (la table `PIZZA_BIGA_YTBL` est calibrée Giorilli 18°C, le bump à 24 en V21.53 décalait les doses).
  - **F-1.2 mode guard** : `computeCore` skip `pBexTotal` si `MODE ∈ {pizza, focaccia}`. `S.breadExtras` persistant globalement aurait sinon faussé la pizza après cochage d'extras en pain.
  - **F-1.1 Step 5** : résidu `Math.pow(2,(22-T)/10)` ligne 8490 (`updatePhaseDurHints`) → migré `fermentTempFactor(T)`. Suggestions durées maintenant cohérentes Q10=2.1/refT=24.
- **V21.56** : **Inversion sign `applyQ10Correction`** — bug critique introduit en V21.53.
  - Diagnostic : l'original `base / Math.pow(2, (T-refT)/10)` équivaut à `base * Q10^((refT-T)/10)` = `base * fermentTempFactor(T, refT)`. En V21.53 j'avais conservé `divide` avec `fermentTempFactor`, ce qui inversait le signe → plus de levure au chaud, moins au froid.
  - Fix : `applyQ10Correction` passe à `base * fermentTempFactor(T, refT)`.
  - Impact : seul `pizzaBigaYeastInterp` était affecté (poolish utilise `fermentTempFactor` directement). Doses biga restaurées au sens physique.
  - Harnais : ajout T9 (biga refT + sens), T10 (mode guard pBex), T11 (hint Q10) → 46/46 PASS.

#### Phase F — Sprint 14 juin (V21.57-V21.63) : Autolyse + Fermentation & Process + bugs
- **V21.57** : **Module 4.3 Autolyse complet** (cf §4.3).
  - UI : card Autolyse (toggle Activer + durée + sel inclus + bassinage) entre T° et Pesée. Cachée en brioche.
  - Moteur : `readAutolyseState`, `renderAutolyseOut`, `syncAutolyseToPlanning` + intégration dans `computeWaterTemp` (frictionEff, autoFrictionBonus, tfEff).
  - Tests : T12 (inactive=no effect), T13 (30 min, friction -2°C), T14 (longue, shift tf vers tfo) → 63/63 PASS.
- **V21.58** : **BLOC 1 chantier Fermentation & Process** (cf §4.7).
  - Card renommée "Fermentation & Process".
  - 3 sub-cards accordéon (Pré-ferments & maturation OUVERT par défaut, Autolyse REPLIÉ, Process REPLIÉ).
  - Pattern dédié `.sub-card` avec handler indépendant pour éviter conflit avec `.collapsible` parent.
  - Tags dynamiques sur sous-headers via `renderSubCardTags`.
  - Cards orphelines supprimées (autolyse-card, Températures de coulage). Sélecteur PA/PVL/PI du pane-pain retiré (listeners JS deviennent no-op silencieux).
- **V21.59** : **Composeur farines (hors chantier)**.
  - PARTIE A : flags `composeFlours` en % normalisé (était brut → "20 % seigle" pour 20/140 réel = 14 %). Désormais `it.w * 100`.
  - PARTIE B : slot 'pn' slider → stepper −/+ pas 10 % (mobile-first, touch 44px). Suppression CSS slider mort.
- **V21.60** : **BUG 1 + bug Planning autolyse grisée**.
  - BUG 1 : règle `.fg input { appearance:none; padding; background; width:100% }` masquait le rendu natif des checkboxes Recette autolyse. Fix : exception `.fg input[type="checkbox"]` restaure `appearance:auto` + accent-color.
  - Planning autolyse : `syncAutolyseToPlanning` mettait `chk.checked` sans appeler `togglePhaseRow` → ligne restait grisée (opacity .62). Fix : appel explicite.
  - Bonus : transition opacity .18s sur `.phase-row` pour passage inactif↔actif fluide.
- **V21.61** : **BLOC 2 — TB pilotée par pétrin** (cf §4.8).
  - 5 types pétrin + Personnalisé. Maps centralisées (TB / friction / V1+V2 défauts).
  - `applyPetrDefaults()` helper, listener `pz-petr-type change` applique défauts.
  - 2 nouveaux inputs V1/V2 (mémo informationnel, hors calcul).
  - Migration legacy (`hand→manuel`, `spiral-*→spirale`).
  - Init + switchMode : fallback TB = pétrin défaut si pas de localStorage saved.
- **V21.62** : **3 fix** post-validation visuelle.
  - Poolish Pilote ne cochait pas la phase preferm du Planning sur modes non-pizza : `fermentSyncToLegacy` ne synchronisait pas `plan-agent`. Fix : sync explicite `plan-agent ← ferment.main`.
  - Sub-card "Pré-ferments & maturation" : `data-start="open"` → `"closed"` (cohérence anti-surcharge mobile).
  - "Oblique / Artofex" → "Oblique" (Artofex est en réalité un bras plongeants). Label "Bras plongeants" → "Bras plongeants / Artofex".
- **V21.63** : **Fix poolish/levain Planning preferm grisée**.
  - Cause : boucle de restauration `savedChecks` dans `renderPlanPhases` écrasait systématiquement l'état calculé par `renderPhaseRow`. Si preferm était décochée avant activation poolish, sync ramenait `checked=false` puis `togglePhaseRow(_, false)` rajoutait `.inactive`.
  - Filet de sécurité V18-1 (limité à 'pizza') étendu à tous les modes. Ajout filet équivalent pour phase `levain-refresh` quand agent='levain'.

> Convention : à chaque évolution notable, créer la nouvelle version du fichier doc concerné
> (`..._vX.Y.md`), mettre à jour son en-tête, et ajouter une ligne ici. À chaque commit applicatif,
> bumper `APP_VERSION` dans `index.html` et `CACHE` dans `sw.js`.
