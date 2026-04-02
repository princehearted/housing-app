# Habitra Homes Backend Architecture

## Entry Points
- `server.js`: bootstraps server and listens on `PORT`.
- `app.js`: express app setup, route mounting, error middleware.

## Layers
- `config/`: infrastructure clients (`supabaseClient.js`).
- `routes/`: URL mapping only.
- `controllers/`: request/response logic.
- `services/`: reusable business helpers (`storageService.js`).
- `middleware/`: upload + error handlers.
- `utils/`: async wrapper + small validators.

## Mounted API Groups
- `/api/landlord`
- `/api/tenant`
- `/api`
- `/api/admin`
- `/api/upload`

## Core Rules
1. Add new endpoint in this order: route -> controller -> (service if needed).
2. Keep Supabase queries in controllers/services only.
3. Keep `server.js` tiny (startup only).
4. Add request validation before DB calls.
5. Keep upload constraints centralized in `middleware/uploadMiddleware.js`.
