# 🎮 NextGen Tycoon

Jeu de simulation/tycoon **AAA** de l'industrie du jeu vidéo. Gère une entreprise
de **1970 à 2100** : recherche technologique, conception de consoles, développement
de jeux, marketing & hype, bourse, IA concurrentes persistantes et économie mondiale
vivante. **Web + PWA + APK Android + sauvegarde cloud Supabase.**

> Inspirations (non-clonage) : Game Dev Tycoon, Mad Games Tycoon, Console Tycoon.

---

## ✨ Fonctionnalités

- ⏳ **Timeline 1970 → 2100** avec tech tree verrouillé par époque (CPU 8-bit → quantum/neural reality)
- ⚙️ **Moteur de simulation déterministe** (seed RNG) : tick mensuel + bilan annuel
- 🌍 **Économie mondiale** : 6 segments de marché, cycles macro, saisonnalité
- 🎲 **Événements mondiaux** pondérés (crise, boom, révolution IA, explosion VR, cyberattaque…)
- 🤖 **12+ IA concurrentes persistantes** : R&D, lancements, faillites, rachats, fusions
- 🛠️ **Product builder** : consoles, portables, VR/AR, smartphones, PC, cloud — composants, stats, prix, design
- 🎬 **Game creator** : 8 genres, budget, marketing, note de review, ventes
- 👨‍💼 **Employés RPG** : Junior → Légende, 5 stats, progression XP
- 🏢 **Bâtiments** : Garage → Data Center, chacun débloque des mécaniques
- 📈 **Bourse simulée** : actions, tech, crypto fictive
- ☁️ **Cloud save** Supabase : auth, autosave, multi-device, versioning
- 🎨 **UI premium AAA** : glassmorphism, dark mode, Framer Motion, mobile-first

---

## 🚀 Démarrage

```bash
npm install
npm run dev            # http://localhost:3000
```

Le jeu tourne **100 % hors-ligne** (autosave localStorage). Le cloud est optionnel.

### Activer le cloud (optionnel)
1. Crée un projet [Supabase](https://supabase.com).
2. Exécute la migration `supabase/migrations/0001_init.sql` (SQL editor).
3. Copie `.env.example` → `.env.local` et renseigne :
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

---

## 🧪 Tests moteur

```bash
npm test     # simulation headless 1970→2100 + assertions de déterminisme
```

---

## 📱 Build APK Android

### En local
```bash
npm i -D sharp && node scripts/gen-icons.mjs   # génère les icônes (une fois)
npm run build           # export statique → ./out
npx cap add android     # une seule fois
npm run apk:debug       # → android/app/build/outputs/apk/debug/app-debug.apk
```

### Via GitHub Actions
Pousse un tag `v*` ou lance le workflow **« Build Android APK »** manuellement.
L'APK est produit en artefact téléchargeable. (Secrets Supabase optionnels.)

---

## 🏗️ Architecture

Voir **[ARCHITECTURE.md](./ARCHITECTURE.md)** pour le détail complet.

```
src/
  engine/   # ⚙️ moteur pur TypeScript (déterministe, testable, sans React)
  data/     # 📚 contenu data-driven (tech, composants, genres, bâtiments)
  store/    # 🧠 Zustand (wrap moteur + autosave)
  components/  # 🎨 UI (shell, primitives, écrans)
  app/      # routes Next.js (1 écran par route)
  lib/      # supabase, cloud save, format, cn
  hooks/    # game loop, autosave
```

**Principe clé** : le moteur produit des snapshots immuables ; React ne fait que
les afficher. Même seed + mêmes actions ⇒ partie identique.

---

## 🗺️ Roadmap (extensible)

- Vue carte du monde isométrique (parts de marché géographiques)
- Arbre de compétences employés + formations
- Multijoueur asynchrone / classements via la vue `leaderboard`
- Événements scénarisés en chaîne
- Mod support (data-driven : ajoute un fichier dans `src/data/`)

Chaque système est **modulaire et data-driven** : étendre le contenu = éditer `src/data/`.
