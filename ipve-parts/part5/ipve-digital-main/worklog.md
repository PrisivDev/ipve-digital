---
Task ID: 1
Agent: Super Z (Main)
Task: Créer un système d'API REST avec clé API pour le frontend de l'école

Work Log:
- Analysé le projet existant (Prisma schema, auth system, structure API)
- Ajouté le modèle `ApiKey` au schéma Prisma (id, name, keyHash, keyPrefix, permissions, isActive, lastUsedAt, expiresAt, requestCount)
- Créé `src/lib/api-key.ts` : génération de clés (préfixe ipve_), validation SHA-256, vérification de permissions, extraction multi-source (Authorization, X-Api-Key, query param)
- Créé 6 endpoints API :
  - GET /api/v1/health (public, pas d'auth)
  - GET /api/v1/filieres (admissions:read required)
  - GET /api/v1/filieres/[id]/levels (levels:read required)
  - GET /api/v1/admissions (admissions:read, pagination, filtres)
  - POST /api/v1/admissions (admissions:write, validation complète)
  - GET /api/v1/admissions/[id] (admissions:read)
- Créé 3 endpoints admin pour gérer les clés API :
  - GET/POST /api/settings/api-keys
  - GET/PATCH/DELETE /api/settings/api-keys/[id]
- Synchronisé le schéma Prisma avec Supabase (prisma db push)
- Généré et inséré la clé API initiale "Frontend École IPVE"
- Testé tous les endpoints avec succès (200, 201, 401)

Stage Summary:
- Clé API générée : ipve_3jV5S4E-Vy52wfu1LV7GESmU6biwzf5Wlw56sBw66eVODazH
- Permissions : admissions:read, admissions:write, filieres:read, levels:read
- Domaine API : https://administration.ipve.edu.ci/api/v1/
- Tous les tests passés : health, filieres, admissions CRUD, auth rejection
- Fichiers créés : src/lib/api-key.ts, 6 fichiers de routes v1, 2 fichiers admin routes
- Candidature de test nettoyée de la base
