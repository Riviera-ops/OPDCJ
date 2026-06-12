# 🌾 Ô Pain De Ce Jour — Roadmap

> **Version : v1.3** · 12 juin 2026 · App ciblée : **OPDCJ V21.29**
> Fichier : `OPDCJ_03_Roadmap_v1.3.md` (remplace v1.2)
> Doc projet (3 pièces) : ① Master-Prompt · ② Référentiel · **③ Roadmap**
> Pilote du projet : périmètre, architecture, axes d'évolution, specs des fonctionnalités, historique. À joindre comme fichier de connaissance.
> *v1.3 : sprint 11–12 juin 2026 — PWA offline · UI Terracotta phase B · Module 4.1 ✅ · Module 4.2 ✅ · combinaison de pré-ferments ✅.*

---

## 1. Périmètre fonctionnel actuel (V21.29)

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

*(État au 12 juin 2026 après sprint V21 : ~9 900 lignes, ~340 ko HTML, ~210 fonctions, **PWA offline complète**.)*

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
6. **Tests des formules** : jeu de cas de référence (pain 1 kg, pizza Napo, brioche) anti-régression. *Partiel : 8 tests pré-ferments en V21.28 (script Node externe, formules pures).*
7. **Accessibilité tactile** : cibles, contrastes, `inputmode` numérique.

### B. Améliorations UI/UX
- Fiche fournée **imprimable** (pesée + timeline + coûts).
- Timeline **temps réel** : phase en cours surlignée + compte à rebours.
- Comparateur de recettes côte à côte. Mémoire des derniers réglages par famille. Mode « gros chiffres ».
- **Refonte UI Terracotta** (jour/nuit). ✅ **Fondation + phase B faites V21–V21.13** (tokens, Nunito tabulaire, `.result` câblé, icônes SVG, éradication des ~320 emoji, Technomitron).
- Halo header bas-gauche retiré V21.26 (empiétait sur bouton Recette).

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
F_dispo = F − F_PF − F_lev    · W_dispo = W − W_PF − W_lev
F_pool = W_pool = W_dispo × pool.pct/100      (si main='poolish')
F_biga = F_dispo × biga.prop/100              (si main='biga')
F_pétrie = F − F_pool − F_biga − F_PF − F_lev
```

**Garde-fou** : alerte rouge sous le Pilote si somme PF + Levain > 100 % de la farine ou de l'eau (`S.preFermOverflow`).
**Rétro-compat** : sans booster, `F_dispo === F` → calculs identiques à V21.26.
**Migration** : `fermentNormalizeState` (V21.27) mappe l'ancien `strategy` ('pf'/'levain') vers `main='directe' + add*=true`.

### 4.3 — Autolyse dans la recette — ⚪ NON DÉMARRÉ
Paramètre de recette : durée · sel inclus ou non · bassinage optionnel.
Effet **indirect** sur `computeWaterTemp` : (a) baisse la **friction** (eau un peu plus chaude) ; (b) au-delà d'un **seuil de durée**, décale la référence « farine » vers la T° fournil. Peut auto-renseigner la durée de la phase « Autolyse » du Planning.

### 4.4 — Onglet Chronomètre — ⚪ NON DÉMARRÉ
Outil du **moment actif**. **Limite mobile à assumer** : iOS/Android suspendent les timers JS écran éteint → ne pas promettre d'alarme fiable hors-écran (le `.ics` reste le filet).
- Temps calculé depuis un **timestamp de fin** (`Date.now()`).
- **Wake Lock** (`navigator.wakeLock`) armé par un premier tap.
- **Branché sur les phases du Planning** : « démarrer cette phase » → charge la durée, enchaîne.

### 4.5 — Refonte UI « Terracotta » (jour + nuit) — ✅ COMPLET V21-V21.13
Tokens jour/nuit dans le Référentiel §B.2. Phase A (fondation) puis phase B (câblage `.result`, icônes en-têtes SVG, éradication des ~320 emoji, Technomitron levure, séparateurs ing-row affinés).

---

## 5. Ordre d'attaque conseillé

Statut au 12 juin 2026 :
1. ✅ **PWA hors-ligne** — fait V21.5-V21.10
2. ✅ **Refonte UI Terracotta** — fait V21-V21.13
3. ✅ **Modules métier farine + fermentation** — fait V21.14-V21.28 (Modules 4.1 et 4.2 complets, combinaison pré-ferments)
4. ⚪ **Autolyse** (§4.3) — à attaquer
5. ⚪ **Chronomètre** (§4.4) — à attaquer

---

## 6. Historique des versions

### Documentation projet
- **Docs v1.3 — 12 juin 2026** : Roadmap → v1.3 (acte le sprint 11-12 juin : Modules 4.1, 4.2 et 4.2bis complets ; PWA offline ; UI Terracotta finalisée). §1 mis à jour pour refléter les pré-ferments combinables. §2 actualisé sur la PWA et le moteur enrichi. §4 marque les modules ✅/⚪. §5 réordonné selon statut.
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

> Convention : à chaque évolution notable, créer la nouvelle version du fichier doc concerné
> (`..._vX.Y.md`), mettre à jour son en-tête, et ajouter une ligne ici. À chaque commit applicatif,
> bumper `APP_VERSION` dans `index.html` et `CACHE` dans `sw.js`.
