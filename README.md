# DGA — Front-end de Gestion Académique

Interface web du Système de Gestion Académique et Administrative de **Digital Generation Academy**. Consomme l'API FastAPI (par défaut `http://localhost:8001`).

## Stack

- **React 18 + TypeScript strict** (Vite)
- **TanStack Query v5** — tous les appels API (cache, invalidation, états loading/error)
- **Tailwind CSS + shadcn/ui** — thème institutionnel sobre
- **React Router v6** — routes protégées par rôle
- **React Hook Form + Zod** — formulaires validés
- **openapi-typescript + openapi-fetch** — client API entièrement typé, généré depuis la spec OpenAPI du backend (aucun type de réponse écrit à la main)

## Prérequis

- Node.js ≥ 20
- Backend DGA démarré sur `http://localhost:8001` (CORS déjà configuré côté API)

## Installation

```bash
npm install
cp .env.example .env   # puis ajuster si besoin
npm run dev            # http://localhost:5173
```

### Variables d'environnement

| Variable | Défaut | Rôle |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:8001` | URL de base de l'API |
| `VITE_AUTH_MOCK` | `true` | Authentification simulée (choix du rôle au login) |

## Authentification

Le backend n'expose pas encore `/auth/login`. Toute l'architecture d'auth est en place
(page de login, contexte, guards par rôle, intercepteur 401 → redirection login) derrière
une abstraction `AuthAdapter` :

- **Mode mock** (`VITE_AUTH_MOCK=true`) : on choisit son rôle sur l'écran de connexion.
  Si le backend tourne, la session se lie au premier utilisateur réel de ce rôle pour que
  les identifiants (`cree_par`, `enseignant_id`…) soient valides en base.
- **Mode réel** (`VITE_AUTH_MOCK=false`) : adaptateur `http` prêt pour
  `POST /auth/login` → JWT Bearer (payload `{sub, role}`). Quand le backend publiera ce
  contrat, seul `src/features/auth/adapters/http.ts` est à ajuster.

## Client API généré

Les types sont générés depuis la spec OpenAPI du backend dans `src/api/schema.d.ts` :

```bash
# après une mise à jour du backend, ré-exporter openapi.json puis :
npm run generate:api
```

Les erreurs API (`{"detail": "..."}`) sont normalisées en `ApiError` et affichées en toast.

## Structure

```
src/
  api/            client openapi-fetch, types générés, QueryClient
  app/            routeur, pages génériques (404, en construction)
  components/
    ui/           primitives shadcn/ui
    shared/       DataTable, FormDialog, ConfirmDialog, StatusBadge, EmptyState…
  features/       un dossier par module métier (auth, students, matieres…)
    <feature>/api.ts   hooks TanStack Query du module
  layout/         sidebar par rôle, header, fil d'Ariane
  lib/            utilitaires, libellés français des enums métier
```

## Scripts

| Commande | Description |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` | Typecheck + build de production |
| `npm run preview` | Prévisualisation du build |
| `npm run generate:api` | Régénère les types depuis `openapi.json` |

## Rôles et accès

| Module | Rôles autorisés |
| --- | --- |
| Tableau de bord | tous |
| Étudiants | DIRECTION, ADMIN, SECRETARIAT |
| Présences | DIRECTION, ADMIN |
| Notes | DIRECTION, ADMIN, ENSEIGNANT |
| Paiements | DIRECTION, ADMIN, COMPTABLE |
| Sanctions | DIRECTION, ADMIN, SECRETARIAT |
| Matières / Personnel | DIRECTION, ADMIN |

⚠️ Rappel métier : un étudiant a deux identifiants — son compte (`users.id`) et son
dossier scolaire (`students.id`). Les notes, présences, paiements et sanctions référencent
**toujours** `students.id`.
