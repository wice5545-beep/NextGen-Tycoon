# 🎮 NextGen Tycoon — Architecture AAA

> Jeu de simulation/tycoon AAA. Timeline 1970 → 2100. Web + PWA + APK Android + Cloud save.
> Inspirations (non-clonage) : Game Dev Tycoon, Mad Games Tycoon, Console Tycoon.

---

## 1. Vision technique

| Couche | Choix | Raison |
|---|---|---|
| Frontend | **Next.js 14 (App Router, `output: export`)** + React 18 + TypeScript strict | SSG/SPA exportable en statique → wrappable Capacitor → APK. Pas de serveur runtime requis. |
| UI | **TailwindCSS** + **Framer Motion** + tokens glassmorphism maison | Dashboard premium type Steam / PlayStation / Vision Pro. Mobile-first. |
| State | **Zustand** (+ `immer`, `persist`) | Store global léger, sérialisable → save/load trivial, performant sur mobile. |
| Moteur | **Pure TypeScript** (`src/engine/*`), zéro dépendance React | Testable, déterministe (seed RNG), réutilisable côté worker. |
| Backend | **Supabase** (PostgreSQL + Auth + RLS) | Cloud save, auth, multi-device sync, versioning. Pas de backend custom à maintenir. |
| Persistance locale | `localStorage` (autosave) + Supabase (cloud) | Offline-first ; sync best-effort. |
| Packaging | **Capacitor** → Android APK via **GitHub Actions** | Web → PWA → APK signé, artefact téléchargeable. |

### Principe directeur
Le **moteur de simulation est totalement découplé du rendu**. React n'observe que des snapshots immuables produits par le moteur. Cela garantit :
- déterminisme (même seed → même partie),
- testabilité (le moteur tourne sans DOM),
- portabilité (web, worker, headless tests).

---

## 2. Arborescence

```
nextgen-tycoon/
├── ARCHITECTURE.md                # ce document
├── README.md
├── package.json / tsconfig / next.config.mjs / tailwind.config.ts
├── capacitor.config.ts
├── .github/workflows/android.yml  # build APK
├── supabase/
│   └── migrations/0001_init.sql   # schéma complet + RLS
├── public/                        # icons, splash, manifest.webmanifest
└── src/
    ├── app/                       # Next App Router (1 route par écran)
    │   ├── layout.tsx  globals.css
    │   ├── page.tsx                # Dashboard
    │   ├── research/  product/  game/  market/
    │   ├── competitors/  events/  hq/  settings/
    ├── components/
    │   ├── shell/                 # Sidebar, TopBar, AppShell
    │   ├── ui/                    # Glass, Card, Stat, Button, Gauge, Sparkline…
    │   └── screens/               # gros composants par écran
    ├── engine/                    # ⚙️ CŒUR — pur TS
    │   ├── types.ts               # tous les types du domaine
    │   ├── rng.ts                 # PRNG mulberry32 seedé
    │   ├── engine.ts              # GameEngine: tick mensuel/annuel
    │   ├── economy.ts             # économie mondiale + demande
    │   ├── events.ts              # RNG pondéré + résolution effets
    │   ├── competitors.ts         # IA persistantes (12+)
    │   ├── stock.ts               # bourse simulée
    │   ├── products.ts            # calcul score produit (perf/fiab/temp…)
    │   ├── games.ts               # dev de jeux + review score
    │   ├── employees.ts           # RPG employés + progression
    │   ├── marketing.ts           # courbe de hype
    │   └── newgame.ts             # factory d'un GameState neuf
    ├── data/                      # 📚 contenu (data-driven)
    │   ├── technologies.ts        # tech tree verrouillé par époque
    │   ├── components.ts          # composants produits
    │   ├── genres.ts              # genres de jeux + affinités
    │   ├── buildings.ts           # bâtiments + déblocages
    │   └── names.ts               # générateurs de noms (IA, employés)
    ├── store/
    │   └── gameStore.ts           # Zustand: wrap engine + actions + autosave
    ├── lib/
    │   ├── supabase.ts            # client
    │   ├── cloudSave.ts           # save/load/versioning
    │   └── format.ts              # $ , %, dates
    └── hooks/                     # useGameLoop, useAutosave, useAuth
```

---

## 3. Modèle d'état global (`GameState`)

Snapshot immuable, 100 % sérialisable (→ save/load = `JSON.stringify`).

```
GameState {
  meta:        { seed, version, createdAt, lastTickAt }
  clock:       { year, month, ticks }          // 1970-01 → 2100-12
  player:      { id, companyId }
  company:     Company                          // entreprise du joueur
  competitors: Competitor[]                     // 12+ IA persistantes
  market:      MarketState                      // demande par segment, taille mondiale
  stock:       StockMarket                      // tickers + historiques
  tech:        { unlocked: TechId[], researching, points }
  products:    Product[]                        // consoles/headsets/PC… du joueur
  games:       Game[]                           // jeux du joueur
  employees:   Employee[]
  buildings:   BuildingId[]
  marketing:   Campaign[]
  events:      GameEvent[]                       // historique
  log:         LogEntry[]                        // feed UI
}
```

Le `seed` rend **chaque partie unique et reproductible**.

---

## 4. Boucle de simulation

```
useGameLoop (UI, vitesse réglable: pause / x1 / x2 / x3)
   └─ store.tick()
        └─ engine.tick(state) ── PURE, déterministe
             1. clock++ (mois ; si déc → fin d'année)
             2. economy.update()        → demande, inflation, cycles
             3. events.maybeFire()      → RNG pondéré par contexte/époque
             4. products.updateSales()  → ventes = f(score, prix, hype, demande, concurrence)
             5. games.updateSales()
             6. competitors.act()       → R&D, lancements, M&A, faillites
             7. marketing.decayHype()
             8. employees.progress()    → XP, montée de tier
             9. stock.update()          → prix = f(ventes, hype, réputation, innovation)
            10. finance.settle()        → cash, salaires, coûts fixes
            11. tech.advanceResearch()
            12. log + snapshot
```

- **Tick mensuel** : flux financiers, ventes, hype, recherche.
- **Bilan annuel** (décembre) : rapport, bonus/malus, recalcul parts de marché, IA stratégie long terme.

---

## 5. Sous-systèmes

### 5.1 Économie mondiale (`economy.ts`)
- Taille de marché par **segment** (console salon, portable, VR/AR, smartphone gaming, PC, cloud) qui **croît avec les époques** et les déblocages tech.
- Cycles macro (croissance/récession) modulés par les événements mondiaux.
- Demande = base segment × multiplicateur époque × sentiment × saisonnalité (fêtes Q4).

### 5.2 Événements mondiaux (`events.ts`)
- Pool d'événements typés, chacun avec : `weight`, `eraRange`, `conditions`, `effects[]`.
- Sélection **RNG pondérée** selon époque + état du marché (ex: crise plus probable après surchauffe).
- Effets appliqués sur `market`, `stock`, `tech`, `company` (ex: crise → ventes -40 % ; boom VR → segment VR ×3 ; révolution IA → tech débloquées).
- Tout passe par le `rng` seedé → reproductible.

### 5.3 IA concurrentes (`competitors.ts`)
12+ entreprises **persistantes** (noms originaux inspirés Nintendo/Sony/MS/Valve/Sega/Atari). Chacune a : cash, réputation, R&D, portefeuille produits, **personnalité** (agressif, innovateur, low-cost, premium). Comportements : lancer produits, investir R&D, **faire faillite**, **racheter studios**, **fusionner**, adapter la stratégie au marché.

### 5.4 Produits (`products.ts`)
Console salon / portable / VR-AR / smartphone gaming / PC / cloud. Chaque produit : nom, design, couleur, prix, **composants** (choisis dans le catalogue selon tech débloquée), et stats dérivées : **performance, fiabilité, température, autonomie, satisfaction**. Score global → adoption marché.

### 5.5 Jeux (`games.ts`)
Genres : FPS, RPG, MMO, Survival, Horror, Sandbox, Simulation, Open world. Variables : budget, temps de dev, qualité équipe, moteur, marketing. → **review score** + ventes + boost réputation.

### 5.6 Employés RPG (`employees.ts`)
Tiers : Junior → Confirmé → Senior → Expert → Légende. Stats : programmation, design, management, créativité, vitesse. Gagnent de l'XP, montent de tier, influencent vitesse/qualité de dev.

### 5.7 Bâtiments (`buildings.ts`)
Garage → Bureau → Campus → Siège → R&D Center → Usine → Data Center. Chacun **débloque des mécaniques** (capacité employés, R&D, production interne, cloud gaming…).

### 5.8 Marketing & Hype (`marketing.ts`)
Canaux : réseaux sociaux, TV, influenceurs, events, teasing. Construit une **courbe de hype** avant la sortie produit, qui décroît ensuite et amplifie les ventes au lancement.

### 5.9 Bourse (`stock.ts`)
Actions entreprises (joueur + IA), actions tech, **crypto fictive**. Prix dynamiques pilotés par ventes, hype, réputation, innovation et événements. Le joueur peut investir.

---

## 6. Tech tree verrouillé par époque
(données dans `data/technologies.ts`)

| Période | Technologies clés |
|---|---|
| 1970–1980 | CPU 8-bit, Cartouches, CRT, Arcade |
| 1980–1990 | CPU 16-bit, Audio stéréo, Sauvegarde, Écrans couleur |
| 1990–2000 | CD-ROM, GPU 3D, Internet, Jeux en ligne |
| 2000–2010 | DVD, Wi-Fi, HDD, MMO, Digital store |
| 2010–2020 | SSD, Cloud gaming, VR early, OLED, IA basique |
| 2020–2030 | Ray tracing, IA avancée, AR, Cloud streaming, 8K |
| 2030–2050 | Neural interfaces, Ultra VR, Holographie, Generative AI |
| 2050–2100 | Quantum computing, Mondes full-sim, Neural reality, Univers procéduraux |

Une techno n'est **researchable que si l'année courante ≥ début d'époque** et ses prérequis débloqués.

---

## 7. Save / Load Cloud (`lib/cloudSave.ts`)
- **Autosave** local (`localStorage`) à chaque fin d'année + toutes N ticks.
- **Cloud** : table `save_states` (Supabase) avec `version` croissante → **versioning** et **multi-device sync**.
- Auth Supabase (email/OAuth). RLS : un joueur ne lit/écrit que SES lignes.
- Stratégie : `GameState` sérialisé en `jsonb`. Au login → on récupère la dernière version ; conflit → on garde la plus récente (`updated_at`) + on conserve l'historique.

---

## 8. Pipeline APK
```
next build  (output: export)  →  out/
   → npx cap sync android
   → Gradle assembleDebug  (GitHub Actions, runner ubuntu + JDK 17 + Android SDK)
   → artefact app-debug.apk téléchargeable
```
PWA : `manifest.webmanifest` + icônes + splash. Capacitor charge `out/` en WebView. Permissions Android minimales (INTERNET pour Supabase).

---

## 9. Règles de production (respectées)
1. Architecture complète ✅ (ce doc) 2. DB schema ✅ 3. Core engine ✅
4. UI screens ✅ 5. Implémentation module par module ✅ 6. Test simulation ✅
7. Optimisation mobile ✅ 8. Pack APK ✅
