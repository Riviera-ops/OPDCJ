# 🌾 Ô Pain De Ce Jour — Référentiel

> **Version : v1.1** · 10 juin 2026 · App ciblée : **OPDCJ V21**
> Fichier : `OPDCJ_02_Referentiel_v1.1.md`
> Doc projet (3 pièces) : ① Master-Prompt · **② Référentiel** · ③ Roadmap
> Connaissance stable du projet : règles métier, charte design, glossaire. À joindre comme fichier de connaissance.
> *v1.1 : précision du traitement des chiffres (§B.2) + renvoi à la maquette de référence.*

---

## A. Référentiel métier (boulangerie / meunerie)

Ces valeurs et conventions sont **celles de l'app** : elles doivent rester cohérentes dans tout calcul
ou évolution. Ne pas les contredire sans raison documentée.

**Levures** — référence ~0,4 % (instantanée). Conversions : **Fraîche ×1 · Instantanée ×0,33 ·
Active ×0,5**. Réfs par contexte : 0,03–0,1 % (longue fermentation), 5 % (rapide).

**Sel** — référence ~1,8 % de la farine.

**Protocoles de pétrissage/fermentation** : **PVL** (Pétrissage Vitesse Lente, lent), **PA**
(Amélioré), **PI** (Intensifié).

**Farines** : T65 Tradition · T80 Bise · T110 semi-complète · T150 complète · Seigle T130 ·
Épeautre T70. Paramètres force **W** et **protéines %**.

**Blé dur / semoule** (comportement ≠ blé tendre) : semoule · semoule fine · extra-fine
(**semola rimacinata**, « deux-fois-moulue »). Absorption d'eau **élevée** → hydratation conseillée
plus haute + temps d'hydratation/autolyse plus long. Gluten **ténace** (P/L élevé) → autolyse +
pétrissage doux, éviter le sur-pétrissage. Référentiel : Altamura / Pugliese = 100 % rimacinata,
maturation longue. Mie ambrée (caroténoïdes).

**Pré-ferments** :
- **Poolish** (liquide) : proportion d'eau totale, durée, T°, type de levure ; compense la force.
- **Biga** (solide, **Giorilli**) : **hydratation 44–45 % optimale**, % de farine totale, durée,
  T° idéale ~18 °C, appoint de levure pétrissée.

**Fermentation longue avec froid** : combinaison heures TA + heures froid + T° froid, avec calcul
auto de la levure suivant le protocole. Notion clé : **maturation ≠ levée** (*maturazione* vs
*lievitazione*) — la maturation dépend de temps × T° × **force de la farine** (W).

**Température de coulage (formule des 3T)** : T° pâte cible **23–24 °C** ;
`T°eau = (T°pâte_cible × 3) − T°fournil − T°farine − Friction_pétrin`. Frictions usuelles (pizza) :
manuel 0 °C · spirale lent 4 °C · spirale pro/rapide 9 °C. **Calcul de glace** quand l'eau froide ne
suffit pas (T° robinet 8 °C hiver → 25 °C été).

**Pizza** : standard **AVPN napolitain** — levure ~2,5–3,0 % sur farine ; farine type **Caputo
Saccorosso (W 320, ~13 % protéines)** ; **coefficient pizzaiolo personnel** (1,00 standard · 0,60 pro
· 1,20 farine W faible) ; styles Napo / Romana / Teglia (huile 0 % Napo, 2–3 % Romana/Teglia).

**Focaccia** : densité crue ≈ **0,65 g/cm³** ; épaisseur cuite Genovese ~20–25 mm ; ~220–240 °C.

**Brioche / viennoiserie** : ~50 g/œuf ; pain au lait ~20–40 % lait ; sucre ~2–4 % ; miel ~3–8 %.

**Ingrédients spéciaux** (ordres de grandeur) : pain aux noix 15–30 % · raisins 15–25 % · malt 1–3 %
· gluten pur 1–3 % · vitamine C 20–100 mg/kg farine.

**Levain naturel** : démarrage J1→J7 avec % de chef décroissant **50 → 33 → 20 → 12 → 10 %** ;
entretien et rafraîchi pré-fournée pilotés par poids/hydratation source → cible.

**Coûts** : matières (€/kg) + œufs (€/pce) + énergie (kWh × prix, via puissance four et durée
préchauffe + cuisson).

---

## B. Référentiel design

### B.1 — État existant (V20)
Palette « pain & blé », variables CSS sur `:root`. Fonts *Playfair Display* (titres) + *Nunito* (UI).
Mobile-first, conteneur `max-width: 700px`, en-tête fixe. Composants : `.card` (`.ch` + `.cb`),
segments `.pb`, toggles `.tsw/.tslider`, grilles `.g2`/`.g3`, alertes `.alert` (`.a-info/.a-warn/.a-ok`),
timeline (`.tl-step/.tl-time/.tl-dot/.tl-line`). Mode sombre via classe sur `<body>`.

### B.2 — Charte cible « Terracotta » (validée), jour + nuit
Direction retenue : **Terracotta chaleureux**, formes arrondies, identité « maison de passionné ».
Décliner en **jour ET nuit accordés** (même famille de teintes ; seules surface et texte s'inversent).
Icônes **SVG inline** (pas d'emoji). Gros chiffre de résultat isolé dans un encart teinté.

**Règle d'inversion jour→nuit** : fond nuit = **brun chaud** (jamais gris neutre) ; le terracotta de
l'action est **éclairci** en nuit, celui des chiffres/icônes encore un cran de plus (sinon il disparaît).

| Rôle | Token | Jour | Nuit |
|------|-------|------|------|
| Fond surface | `--bg` | `#FFF6EF` | `#2E1D15` |
| Encart résultat | `--surface-2` | `#FBE3D5` | `#3C271D` |
| Pastille icône | `--icon-bubble` | `#FBE3D5` | `#4A2E22` |
| Terracotta action | `--prim` | `#C4633F` | `#D86B45` |
| Terracotta accent (chiffres/icônes actives) | `--acc` | `#C4633F` | `#E8946B` |
| Texte principal | `--txt` | `#5A2E1B` | `#F3E3D5` |
| Texte secondaire | `--txt-2` | `#7A4E36` | `#C9A98C` |
| Label / muté | `--muted` | `#A55E3C` | `#C28A63` |
| Icône au repos | `--icon` | `#C99B7A` | `#B5895F` |
| Bordure carte | `--border` | `#F0D8C8` | `#4A3326` |
| Filet séparateur | `--rule` | `#F6E6DA` | `#3E2A1F` |
| Accent sauge (secondaire / étape finale) | `--sage` | `#7A8B5C` (texte `#fff`) | `#4C5A32` (texte `#D7E3BC`) |
| Texte sur action | `--on-prim` | `#FFFFFF` | `#241009` |

**Formes** : cartes `border-radius` ~20px · boutons en **pilule** (~24px) · pastille d'icône ronde
32px · encart résultat ~14px · chiffre de résultat ~36px. Implémenter via deux jeux de variables CSS
(`:root` et `:root.dark` ou `body.mode-nuit`), **pas de couleurs en dur**.

**Typographie** : *Playfair Display* **réservé aux titres** (cartes, sections). Corps d'interface en
*Nunito*. **Chiffres de résultat = Nunito 800 + `font-variant-numeric: tabular-nums`** (`"tnum"`), pour
des valeurs nettes et alignées quand elles changent — **ne pas** mettre les chiffres en Playfair.

**Implémentation de référence** : `OPDCJ_Maquette-Terracotta_v1.1.html` (deux jeux de variables CSS,
sprite d'icônes SVG, classes de composants). En cas d'écart, **le Référentiel prime** ; la maquette
se régénère pour s'y conformer.

**Sauge = second marqueur fonctionnel** (ex. étape « sortie du four » terminée), à utiliser avec
parcimonie pour ne pas concurrencer le terracotta d'action.

---

## C. Glossaire express

- **TA** : température ambiante. **Coulage** : eau de pétrissage. **Frasage** : mélange initial.
- **Pointage** : 1ʳᵉ fermentation en masse. **Apprêt** : 2ᵉ fermentation, pièces façonnées.
- **Rabats** : repli de la pâte pour la renforcer. **Ressuage** : refroidissement après cuisson.
- **Autolyse** : repos farine+eau (sans sel ni levure) avant pétrissage. **Bassinage** : eau réservée
  ajoutée en fin de pétrissage.
- **Maturation** (*maturazione*) : dégradation enzymatique liée à temps × T° × force ; distincte de la
  **levée** (*lievitazione*, production de gaz).
- **Poolish** : pré-ferment liquide. **Biga** : pré-ferment solide (Giorilli ~45 %).
- **Chef** : levain mère servant de base au rafraîchi. **W** : force boulangère de la farine.
- **P/L** : rapport ténacité/extensibilité (alvéographe). **Rimacinata** : semoule de blé dur extra-fine.
- **AVPN** : Associazione Verace Pizza Napoletana (standard pizza napolitaine).
