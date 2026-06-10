# 🌾 Ô Pain De Ce Jour — Roadmap

> **Version : v1.2** · 10 juin 2026 · App ciblée : **OPDCJ V21**
> Fichier : `OPDCJ_03_Roadmap_v1.2.md`
> Doc projet (3 pièces) : ① Master-Prompt · ② Référentiel · **③ Roadmap**
> Pilote du projet : périmètre, architecture, axes d'évolution, specs des fonctionnalités, historique. À joindre comme fichier de connaissance.
> *v1.2 : build applicatif V21 — fondation UI Terracotta posée dans l'app (changelog §6).*

---

## 1. Périmètre fonctionnel actuel (V20)

Page unique, **5 onglets** (barre de navigation fixe).

**🍞 Recette — cœur de calcul.** Multi-produits : Pain · Pizza · Focaccia · Petit Pain · Brioche.
Pain en 4 étapes (Farine → Fermentation → Poolish → Pâton & quantité) : choix de farine + W +
protéines ; pré-ferments (poolish/biga/pâte fermentée/levain) ; fermentation longue avec froid + calcul
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

*(Vérifié sur le source V20 : 1 fichier `.html`, ~9 280 lignes, ~310 ko de JS, 196 fonctions.)*

- **Mono-fichier** HTML + CSS + JS inline (un seul `<script>`). Aucun framework, aucun build, tout
  côté client. Hébergé sur GitHub Pages. `APP_VERSION` affichée en pied de page.
- **Seule dépendance externe** : Google Fonts → ⚠️ casse l'affichage hors-ligne.
- **Clés `localStorage`** : `opdcj_theme`, `opdcj_lev_types`, `opdcj-levain-journal`,
  `opdcj_default_recipes`, `opdcj_custom_prices`, `opdcj_hidden_toppings`, `opdcj_v14` (hérité),
  config cloud `opdcj_cloud_*`, `opdcj_tombstones`, drapeaux one-shot `opdcj_v18_purge_done` /
  `opdcj_foc_first_visit_done`.
- **Sync Gist** : `gistCreate/Read/Update`, `cloudPush/Pull/Sync`, **gestion de conflits par
  tombstones** (propage les suppressions). ✅ déjà solide. ⚠️ token GitHub stocké en clair.
- **Moteur de calcul** factorisé et **commenté avec sources** : `computeCore`, `computePoolish`,
  `computePizzaBiga`, `computeWaterTemp` (3T), `yeastInterp` (falsy-safe), `wIdealForDuration`,
  `computeFlourBreakdown/computePizzaFlourMix`, `computeCosts`, `computeTimeline`, blocs `levain*`,
  `*Ics*`.

> ⚠️ Toujours coder à partir du `.html` source. Un `.mht` (snapshot) ne contient pas le JS.

---

## 3. Axes d'évolution

### A. Consolidation (fiabiliser)
1. **PWA réellement hors-ligne — priorité n°1** : `manifest.webmanifest` + service worker (app shell +
   polices), **auto-héberger les polices**. Indispensable en fournil. Ne touche pas au moteur de calcul.
2. **Sécuriser le token GitHub** : token *fine-grained* scope gist uniquement, jamais committé, alerte
   appareil partagé.
3. **Migration de schéma unifiée** : champ `schemaVersion` + fonction `migrate()` (aujourd'hui versioning
   implicite via noms de clés).
4. **Robustesse stockage** : perte de `localStorage`, quota, échec réseau de sync.
5. **Validation des saisies** : bornes hydratation/%/températures, alertes `.a-warn`.
6. **Tests des formules** : jeu de cas de référence (pain 1 kg, pizza Napo, brioche) anti-régression.
7. **Accessibilité tactile** : cibles, contrastes, `inputmode` numérique.

### B. Améliorations UI/UX
- Fiche fournée **imprimable** (pesée + timeline + coûts).
- Timeline **temps réel** : phase en cours surlignée + compte à rebours.
- Comparateur de recettes côte à côte. Mémoire des derniers réglages par famille. Mode « gros chiffres ».
- **Refonte UI Terracotta** (jour/nuit) → tokens dans le ② Référentiel §B.2.

### C. Nouvelles fonctionnalités
- Voir specs détaillées §4 (modules farine, fermentation, autolyse, chrono).
- Aussi en réserve : mise à l'échelle de lot · journal de fournées (REX) · calcul de buée/conduite de
  cuisson · liste de courses · export/partage de recette lisible.

---

## 4. Spécifications des fonctionnalités validées

*Cinq chantiers décidés. Les modules 4.1 et 4.2 sont conçus pour se coupler (voir 4.1.d).*

### 4.1 — Module « Assemblage de farines » (meunerie, transverse)
Généralise à tous les produits ce que `computePizzaFlourMix` fait déjà côté pizza.
- **a) Bibliothèque de farines** persistante (source unique réutilisée en recette ET coûts, branchée
  sur `opdcj_custom_prices`) : appellation · **espèce** (blé tendre/blé dur/seigle/épeautre) ·
  granulométrie pour le blé dur (semoule → **rimacinata**) · cendres · protéines · **W** · **P/L** ·
  **coefficient d'absorption** · prix €/kg.
- **b) Composeur** : N farines en %, sortie **pondérée** (W, protéines, cendres, P/L, drapeaux
  % blé dur / seigle / complète). W pondéré = approximation pratique, suffisante pour piloter.
- **c) Spécificités blé dur / rimacinata** : voir ② Référentiel §A (absorption ↑, autolyse longue,
  pétrissage doux, P/L élevé).
- **d) Couplage fermentation (le vrai gain)** : le composeur sort un **W de mélange** ;
  `wIdealForDuration`/`wDurationRange` donnent le W requis pour une durée → alerte de cohérence
  **maturation ↔ force** (ex. « W≈230 mais 18 h froid demande W≥280 → raccourcir / renforcer / ajouter
  du gluten » ; inversement 100 % rimacinata → maturation longue validée).

### 4.2 — Module « Pilote de fermentation » (transverse)
Remonter longue-fermentation-froid + poolish/biga en **bloc unique appelé par tous les produits**.
- Stratégie (XOR via `enforcePoolBigaXOR`) : directe · poolish · biga · pâte fermentée · levain.
- Profil de maturation : tout TA · TA + froid retardé · froid long ; durées + T°.
- Sorties : dose de levure (`yeastInterp`) **corrigée en température** (Q10≈2 → « équivalent-temps à T°
  de référence ») · sous-recette du pré-ferment (poolish, ou biga Giorilli 44–45 %) · **injection auto
  dans le Planning** (phases froid masse / retour TA / alarmes) · report dans `computeWaterTemp`.

### 4.3 — Autolyse dans la recette
Paramètre de recette : durée · sel inclus ou non (vraie autolyse = farine+eau) · bassinage optionnel.
Effet **indirect** sur `computeWaterTemp` : (a) baisse la **friction** (pétrissage final plus court →
eau un peu plus chaude) ; (b) au-delà d'un **seuil de durée**, la masse a dérivé vers l'ambiant →
décaler la référence « farine » vers la T° fournil. *(Autolyse courte 20–45 min : effet 1–2 °C, garder
simple.)* Peut auto-renseigner la durée de la phase « Autolyse » du Planning.

### 4.4 — Onglet Chronomètre (partiel / total / compte à rebours + alarme)
Outil du **moment actif**. **Limite mobile à assumer** : iOS/Android suspendent les timers JS écran
éteint → **ne pas promettre d'alarme fiable hors-écran** (le `.ics` reste le filet « je m'absente »).
- Temps calculé depuis un **timestamp de fin** (`Date.now()`), jamais par comptage de ticks.
- **Wake Lock** (`navigator.wakeLock`) pour garder l'écran allumé. Son **armé par un premier tap**.
- **Branché sur les phases du Planning** : « démarrer cette phase » → charge la durée, enchaîne.

### 4.5 — Refonte UI « Terracotta » (jour + nuit)
Direction validée et déclinée (cartes, Planning/timeline, Coûts). **Tokens jour/nuit complets dans le
② Référentiel v1.1 §B.2** (y compris le traitement des chiffres : Nunito 800 tabulaire). **Implémentation
de référence : `OPDCJ_Maquette-Terracotta_v1.1.html`.** Principes : icônes SVG inline, accent terracotta
unique, sauge en second marqueur fonctionnel, gros chiffre de résultat, formes arrondies.

---

## 5. Ordre d'attaque conseillé
Du moins risqué au plus risqué pour le moteur :
1. **PWA hors-ligne** (ne touche pas aux calculs).
2. **Refonte UI Terracotta** (cosmétique).
3. **Modules métier** farine + fermentation, puis autolyse (touchent aux calculs → tests requis §3.A.6).
4. **Chronomètre** (autonome, se branche sur le Planning).

---

## 6. Historique des versions

### Documentation projet
- **Docs v1.2 — 10 juin 2026** : Roadmap → v1.2 (suivi du build applicatif V21 ci-dessous). Pas de changement de fond ; mise à jour de l'historique.
- **Docs v1.1 — 10 juin 2026** : Référentiel → v1.1 (traitement des chiffres : Nunito 800 tabulaire ;
  renvoi à la maquette de référence). Ajout de la **maquette codée** `OPDCJ_Maquette-Terracotta_v1.1.html`
  (base CSS jour/nuit + sprite SVG ; v1.0 chiffres Playfair → v1.1 chiffres Nunito tabulaire). Roadmap → v1.1.
- **Docs v1.0 — 10 juin 2026** : éclatement du master monolithique (V1→V4) en **3 fichiers versionnés**
  (① Master-Prompt, ② Référentiel, ③ Roadmap). Contenu inchangé sur le fond ; tokens design déplacés
  dans le Référentiel §B.2. *(Historique du master pré-éclatement : V1 analyse sur snapshot → V2
  vérifié sur source → V3 ajout des 5 specs → V4 direction Terracotta jour/nuit.)*

### Application (à tenir à jour à chaque build)
- **V20** — version analysée (état de départ du projet Claude). Référence.
- **V21 — 10 juin 2026** : **fondation UI Terracotta** (chantier §4.5, phase A). Réaffectation des tokens couleur jour + nuit sur les noms de variables V20 existants + ajout des tokens manquants (`--surface-2`, `--icon-bubble`, `--icon`, `--rule`, `--sage`, `--sage-on`, `--on-prim`) ; nuit en brun chaud, terracotta éclairci (§B.2). Chiffres en Nunito 800 tabulaire ; encart résultat `.result` réutilisable (pas encore câblé aux résultats de calcul). Formes : cartes 20px, boutons pilule. Sprite SVG inline injecté + 4 icônes de nav passées en SVG (Levain l'était déjà). Nettoyage : préfixe parasite `boula` retiré, sous-titre câblé sur `APP_VERSION`. **Moteur de calcul non touché.** *Reste (phase B) : câbler `.result` aux calculs, icônes d'en-têtes de cartes, éradication de la longue traîne d'emoji (~320 en JS).*
- *(V21, V22… : ajouter ici date + résumé des changements à chaque nouvelle version produite, et
  incrémenter `APP_VERSION` dans le code + le n° de version des fichiers doc concernés.)*

> Convention : à chaque évolution notable, créer la nouvelle version du fichier doc concerné
> (`..._vX.Y.md`), mettre à jour son en-tête, et ajouter une ligne ici.
