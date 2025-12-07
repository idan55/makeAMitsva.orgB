# Make a Mitzva API
Backend for the Make a Mitzva platform: users post mitzva requests with locations, volunteers claim and complete them, chat around each request, and admins keep things healthy.

## Stack
- Node.js + Express 5, MongoDB/Mongoose
- JWT auth with role-based admin guard
- Cloudinary uploads (profile images, chat media) via Multer
- Security middleware: Helmet, CORS, dotenv

## Quick start
```bash
npm install
cp .env.example .env    # or create it manually (see below)
npm run dev             # starts nodemon on http://localhost:4000
```

## Environment
Create a `.env` with:
```
PORT=4000
MONGODB_URI=mongodb://localhost:27017/make-a-mitzva
JWT_SECRET=replace_me
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```
Notes:
- The server defaults to `http://localhost:5173` for CORS; adjust in `index.js` if your frontend lives elsewhere.
- MongoDB must have geospatial support enabled (default for modern versions) for the nearby query.

## Scripts
- `npm run dev` – start with nodemon
- `npm start` – start with node

## Core routes (prefix `/api`)
- **Health**: `GET /health` – liveness and DB status.
- **Auth**: `POST /users/register`, `POST /users/login`, `GET /users/me`, `PATCH /users/profile-image`, `DELETE /users/delete/:id`.
- **Requests**: `POST /requests` (create), `GET /requests/nearby?longitude=&latitude=&distanceInMeters=`, `GET /requests/my-open`, `GET /requests/my-completed`, `GET /requests/i-solved`, `PATCH /requests/:id/help`, `PATCH /requests/:id/complete`.
- **Chat**: `POST /chats/start`, `GET /chats/my`, `GET /chats/:chatId/messages`, `POST /chats/:chatId/messages`, `POST /chats/:chatId/attachments` (multipart field `file`).
- **Uploads**: `POST /upload` with multipart field `image`; returns Cloudinary URL.
- **Admin** (requires admin JWT): `GET /admin/users`, `PATCH /admin/users/:id/ban`, `PATCH /admin/users/:id/unban`, `DELETE /admin/users/:id`, `GET /admin/requests`, `DELETE /admin/requests/:id`.
- **Graphs**: `GET /graphs/user-activity` – returns a PNG bar chart of user stats.

## Data highlights
- **User**: name, age, email, phone (normalized to +972…), role (`user|admin`), stars/coupon flags, `profileImage`.
- **Request**: title/description (short), GeoJSON `location`, `createdBy`, optional `completedBy`, completion flags, TTL on `createdAt` for expiry.
- **Chat**: participants, messages with optional attachments stored in Cloudinary.

## Development tips
- Authenticated routes expect `Authorization: Bearer <token>`.
- Health check (`/api/health`) is handy for readiness probes.
- Change upload folders or Cloudinary options in `routers/uploadRouter.js` and `controllers/chatController.js`.
