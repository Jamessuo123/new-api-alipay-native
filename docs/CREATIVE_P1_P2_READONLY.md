# Creative P1 + P2 Read-only Closure

This stage intentionally does not write Creative business data and does not migrate the database.

## P1

- Creative Header and workbench empty state use `/images/feixiang-logo.png`, the same logo source as the public homepage.
- The application image has a Docker healthcheck against `/api/status`.
- A candidate-only Compose service runs on `127.0.0.1:3001` without recreating PostgreSQL or the production `3000` container.

## P2

Authenticated read-only endpoints:

- `GET /api/creative/capabilities`
- `GET /api/creative/tasks`
- `GET /api/creative/tasks/:id`
- `GET /api/creative/assets`
- `GET /api/creative/assets/:id`
- `GET /api/creative/projects`
- `GET /api/creative/projects/:id`
- `GET /api/creative/preferences`

The implementation reuses the existing Creative tables and does not add them to `AutoMigrate`.

## Not included in this stage

- Uploads
- Task creation
- Asset deletion
- Project creation or updates
- Preference writes
- Image or video generation
- Quota charging
- Nginx cutover
