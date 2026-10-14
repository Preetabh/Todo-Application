# Backend REST API - MyFirstApp

Production-ready, lightweight REST API backend built with Node.js, Express.js, MongoDB (Mongoose), and JSON Web Token (JWT) authentication.

---

## Architecture & Technology Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB (Atlas compatible) via Mongoose ODM
- **Authentication**: JWT (`jsonwebtoken`) with `Bearer` header token verification
- **Password Security**: `bcryptjs` (salted hashing with 10 rounds)
- **Security**: `helmet` (HTTP headers), `cors` (configurable origins), `express-rate-limit` (DDoS & brute force prevention)
- **Testing**: Built-in Node.js native test runner (`node:test`, `node:assert`) and `supertest`

---

## Directory Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js         # MongoDB connection & disconnect
│   ├── controllers/
│   │   ├── auth.controller.js  # Registration, login, current user
│   │   ├── user.controller.js  # User profile viewing & updating
│   │   └── todo.controller.js  # User-scoped Todo CRUD
│   ├── middleware/
│   │   ├── auth.middleware.js  # JWT Bearer token protection
│   │   ├── error.middleware.js # Centralized 404 & error handlers
│   │   └── validate.middleware.js # Strict input validation
│   ├── models/
│   │   ├── User.js             # User schema with bcrypt hooks
│   │   └── Todo.js             # Todo schema indexed by user
│   ├── routes/
│   │   ├── auth.routes.js      # /api/auth/*
│   │   ├── user.routes.js      # /api/users/*
│   │   └── todo.routes.js      # /api/todos/*
│   ├── utils/
│   │   ├── jwt.js              # Token generation and verification
│   │   └── logger.js           # Safe structured logger
│   ├── app.js                  # Express application setup
│   └── server.js               # Server bootstrap & DB connection
├── tests/
│   ├── auth.test.js            # Auth validation & route protection tests
│   ├── health.test.js          # Health check & 404 route tests
│   └── todo.test.js            # Todo protection & ownership tests
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Environment Configuration

Create a `.env` file in the `backend/` directory by copying `.env.example`:

```bash
cp .env.example .env
```

| Variable | Description | Example |
|---|---|---|
| `PORT` | Port for the Express server | `5000` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `MONGODB_URI` | MongoDB Atlas or local connection string | `mongodb+srv://<user>:<password>@cluster0.mongodb.net/myfirstapp?retryWrites=true&w=majority` |
| `JWT_SECRET` | Secret key for signing JWT tokens | Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_EXPIRES_IN` | Token expiration period | `7d` |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated or `*`) | `*` |

> **Security Note**: Never commit `.env` or hardcode credentials into source control.

---

## Quickstart & Commands

```bash
# Install dependencies
npm install

# Run automated tests
npm test

# Run development server with auto-reload
npm run dev

# Run production server
npm start
```

---

## API Endpoints

### 1. Health Check
- `GET /api/health` — Public endpoint to verify server status.
  - Response: `{ "success": true, "message": "API is running", "timestamp": "...", "uptime": 120 }`

### 2. Authentication (`/api/auth`)
- `POST /api/auth/register` — Create new user account.
  - Body: `{ "name": "Jane Doe", "email": "jane@example.com", "password": "password123" }`
  - Response: `{ "success": true, "token": "...", "user": { "id": "...", "name": "...", "email": "..." } }`
- `POST /api/auth/login` — Authenticate and receive JWT.
  - Body: `{ "email": "jane@example.com", "password": "password123" }`
  - Response: `{ "success": true, "token": "...", "user": { "id": "...", "name": "...", "email": "..." } }`
- `GET /api/auth/me` *(Protected)* — Retrieve authenticated user profile.
  - Headers: `Authorization: Bearer <token>`

### 3. User Profile (`/api/users`)
- `GET /api/users/me` *(Protected)* — Get current user profile details.
- `PATCH /api/users/me` *(Protected)* — Update name or email.
  - Body: `{ "name": "New Name", "email": "newemail@example.com" }`

### 4. Todo Management (`/api/todos`)
- `GET /api/todos` *(Protected)* — Fetch user's todos. Optional filter: `?completed=true|false`.
- `POST /api/todos` *(Protected)* — Create a todo.
  - Body: `{ "title": "Buy groceries", "description": "Milk, eggs, fruit", "completed": false }`
- `GET /api/todos/:id` *(Protected)* — Retrieve specific todo (verifies ownership).
- `PATCH /api/todos/:id` *(Protected)* — Update todo title, description, or completed status.
  - Body: `{ "completed": true }`
- `DELETE /api/todos/:id` *(Protected)* — Delete todo (verifies ownership).

---

## Render Deployment Guide

1. **Create Web Service**:
   - In Render Dashboard, select **New** > **Web Service**.
   - Connect your GitHub repository.
   - Root Directory: `backend`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
2. **Configure Environment Variables**:
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (Render injects its own PORT automatically)
   - `MONGODB_URI`: Your MongoDB Atlas connection URI
   - `JWT_SECRET`: A secure 64-character hex string
   - `JWT_EXPIRES_IN`: `7d`
   - `CORS_ORIGIN`: `*`
3. **MongoDB Atlas Network Access**:
   - In MongoDB Atlas, go to **Network Access** > **Add IP Address**.
   - Add `0.0.0.0/0` (Allow Access from Anywhere) so Render dynamic instances can connect.
   - Ensure the database user has Read & Write privileges on the targeted database.
4. **Health Check Path**:
   - Set health check path to `/api/health`.
