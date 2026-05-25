# TOPLOLIPOP — Gestion Événementielle

Application de gestion complète pour une entreprise spécialisée en location de matériel événementiel, animation et baby-sitting.

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 18 + TypeScript + Vite |
| Styles | Tailwind CSS |
| État serveur | TanStack Query v5 |
| Formulaires | React Hook Form + Zod |
| Calendrier | FullCalendar v6 |
| API | Hono (Cloudflare Pages Functions) |
| Base de données | Cloudflare D1 (SQLite) |
| Déploiement | Wrangler (Cloudflare Pages) |

## Lancement en développement

### 1. Installer les dépendances

```bash
npm install
```

### 2. Créer la base de données locale

La base de données locale est automatiquement gérée par Wrangler. Il suffit d'appliquer les migrations :

```bash
npm run db:migrate:local
```

### 3. Lancer le serveur de développement

**Terminal 1 — Frontend (Vite) :**
```bash
npx vite --port 5173
```

**Terminal 2 — Backend (Wrangler + D1) :**
```bash
npx wrangler pages dev --proxy 5173 --port 8788 --compatibility-date=2024-09-09
```

L'application est disponible sur **http://localhost:8788** (avec l'API complète).

> Pour une préversion rapide du frontend seul (sans API) : http://localhost:5173

## Déploiement sur Cloudflare

### 1. Créer la base de données D1

```bash
npx wrangler d1 create toplolipop-db
```

Copiez le `database_id` retourné et mettez-le dans `wrangler.toml` :

```toml
[[d1_databases]]
binding = "DB"
database_name = "toplolipop-db"
database_id = "VOTRE-DATABASE-ID-ICI"
```

### 2. Appliquer les migrations en production

```bash
npm run db:migrate
```

### 3. Déployer

```bash
npm run deploy
```

### 4. (Optionnel) Créer le bucket R2 pour les fichiers

```bash
npx wrangler r2 bucket create toplolipop-storage
```

Puis décommenter la section `[[r2_buckets]]` dans `wrangler.toml`.

## Structure de l'application

```
toplolipop/
├── src/
│   ├── components/
│   │   ├── ui/          # Composants réutilisables (Button, Modal, Badge…)
│   │   ├── layout/      # Header et navigation
│   │   └── …
│   ├── pages/           # 4 pages principales + détails
│   ├── lib/
│   │   ├── api.ts       # Client API REST
│   │   ├── utils.ts     # Utilitaires (formatage, parsing…)
│   │   └── constants.ts # Labels et couleurs par type
│   └── types/           # Types TypeScript complets
├── functions/
│   └── api/
│       └── [[route]].ts # API Hono (tous les endpoints REST)
├── migrations/
│   └── 0001_initial.sql # Schéma complet de la base de données
└── wrangler.toml        # Configuration Cloudflare
```

## Fonctionnalités

### Onglet Général
- **Baby-sitters** : profils complets, compétences, langues, tarifs, statut
- **Matériel** : catalogue par catégorie, statut, caution, prix location
- **Tarifs** : grilles tarifaires par catégorie (baby-sitting, événements, location…)
- **Devis & Factures** : suivi des documents avec changement de statut

### Onglet Dossier Client
- Fiche client complète (coordonnées, tags, notes)
- Historique des événements par client
- Documents associés (devis, factures, contrats)
- Navigation directe depuis la liste

### Onglet Calendrier
- Vue mensuelle / hebdomadaire / journalière / liste
- Code couleur par type d'événement
- Filtres rapides (animation, baby-sitting, location, livraison)
- Drag & drop pour déplacer les événements
- Création d'événement par clic sur une date

### Onglet Collaborateurs
- Profils complets avec rôle, statut, compétences, langues
- Filtrage par rôle
- Historique des missions
- Vue détail avec compteurs de missions

## Évolutions futures prévues

L'architecture est conçue pour évoluer vers :
- Authentification multi-utilisateurs (Cloudflare Access)
- Synchronisation temps réel (Durable Objects)
- Génération PDF (jsPDF ou Puppeteer Worker)
- Envoi d'emails (Resend ou Mailgun via Workers)
- Portail client
- Application mobile (même API)
- Notifications SMS
- Dashboard analytique
