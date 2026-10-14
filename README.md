# MyFirstApp - Full-Stack Mobile Application

A complete, lightweight, production-quality mobile application built with **React Native (Expo SDK 57)** for Android/iOS and a robust **Node.js, Express, MongoDB (Mongoose)** REST API backend with secure JWT authentication and encrypted local credential storage.

---

## 1. Project Architecture

The application is structured as a decoupled client-server architecture:

```
┌────────────────────────────────────────┐
│     React Native (Expo SDK 57)         │
│  - Dark Navy & Indigo UI Design System │
│  - Hardware-Backed SecureStore         │
│  - Expo Router File-Based Navigation   │
└───────────────────▲────────────────────┘
                    │
                    │ JSON / HTTPS (JWT Bearer Auth)
                    ▼
┌────────────────────────────────────────┐
│      Node.js / Express.js REST API     │
│  - Helmet Security & CORS              │
│  - Express Rate Limiting               │
│  - Centralized Error & 404 Handlers    │
│  - Stateless JWT Token Issuance        │
└───────────────────▲────────────────────┘
                    │
                    │ Mongoose ODM
                    ▼
┌────────────────────────────────────────┐
│          MongoDB Atlas / Local         │
│  - User Schema (Bcrypt Hash)           │
│  - Todo Schema (User-Scoped & Indexed) │
└────────────────────────────────────────┘
```

---

## 2. Folder Structure

```
MyFirstApp/
│
├── frontend/                     # Mobile Client (React Native + Expo SDK 57)
│   ├── src/
│   │   ├── app/                  # Expo Router route definitions
│   │   │   ├── _layout.tsx       # Root stack navigator & AuthProvider
│   │   │   ├── index.tsx         # Splash session bootstrap & auth gate
│   │   │   ├── login.tsx         # /login screen route
│   │   │   ├── signup.tsx        # /signup screen route
│   │   │   ├── home.tsx          # /home screen route
│   │   │   ├── profile.tsx       # /profile screen route
│   │   │   └── todo.tsx          # /todo screen route
│   │   ├── components/
│   │   │   ├── Button.tsx        # Modular button (primary, outline, danger)
│   │   │   ├── Card.tsx          # Elevated rounded container
│   │   │   ├── ConfirmModal.tsx  # Confirmation dialog for destructive actions
│   │   │   ├── EmptyState.tsx    # Empty list placeholder
│   │   │   ├── ErrorMessage.tsx  # Dynamic error/warning alert banner
│   │   │   ├── Header.tsx        # Top navigation header with actions
│   │   │   ├── Input.tsx         # TextInput with password toggle & validation
│   │   │   └── LoadingSpinner.tsx# Screen & inline loading indicators
│   │   ├── constants/
│   │   │   └── theme.ts          # Dark navy & indigo color tokens, spacing
│   │   ├── context/
│   │   │   └── AuthContext.tsx   # Global auth state & session recovery
│   │   ├── hooks/
│   │   │   └── useAuth.ts        # Authentication hook
│   │   ├── navigation/
│   │   │   └── types.ts          # Screen navigation parameter types
│   │   ├── services/
│   │   │   ├── api.ts            # Centralized API client with timeout
│   │   │   └── storage.ts        # Encrypted token storage (expo-secure-store)
│   │   ├── types/
│   │   │   └── index.ts          # TypeScript domain interfaces & API contracts
│   │   └── screens/
│   │       ├── LoginScreen.tsx   # Login UI & form validation
│   │       ├── SignupScreen.tsx  # Registration UI & duplicate account guard
│   │       ├── HomeScreen.tsx    # Dashboard with summary statistics
│   │       ├── ProfileScreen.tsx # User profile viewing and updating
│   │       └── TodoScreen.tsx    # User-scoped Todo CRUD & filters
│   ├── assets/                   # App logos, splash images, adaptive icons
│   ├── app.json                  # Expo project metadata & plugins
│   ├── eas.json                  # EAS Build profiles (configured for APK)
│   ├── tsconfig.json             # TypeScript configuration
│   ├── .env.example              # Client environment template
│   ├── .gitignore
│   ├── package.json
│   └── README.md
│
├── backend/                      # REST API Server (Node.js + Express + MongoDB)
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js       # MongoDB Mongoose connection
│   │   ├── controllers/
│   │   │   ├── auth.controller.js# Register, login, get current user
│   │   │   ├── user.controller.js# Profile viewing & updating
│   │   │   └── todo.controller.js# User-scoped Todo CRUD
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js# JWT Bearer token protection
│   │   │   ├── error.middleware.js# Centralized 404 & error handling
│   │   │   └── validate.middleware.js # Request payload validation
│   │   ├── models/
│   │   │   ├── User.js           # User model with salted bcrypt hashing
│   │   │   └── Todo.js           # Todo model with user reference
│   │   ├── routes/
│   │   │   ├── auth.routes.js    # /api/auth routes
│   │   │   ├── user.routes.js    # /api/users routes
│   │   │   └── todo.routes.js    # /api/todos routes
│   │   ├── utils/
│   │   │   ├── jwt.js            # JWT signing & verification
│   │   │   └── logger.js         # Structured logger without leaking secrets
│   │   ├── app.js                # Express app setup & middleware
│   │   └── server.js             # Server listener bound to 0.0.0.0
│   ├── tests/
│   │   ├── auth.test.js          # Auth & protection automated tests
│   │   ├── health.test.js        # Health check & 404 tests
│   │   └── todo.test.js          # Todo ownership isolation tests
│   ├── .env.example              # Server environment template
│   ├── .gitignore
│   ├── package.json
│   └── README.md
│
├── .gitignore                    # Root gitignore
├── package.json                  # Root orchestration scripts
└── README.md                     # Comprehensive documentation
```

---

## 3. Prerequisites

Before running the project, ensure you have:
- **Node.js**: `v18.0.0` or higher (`node -v`)
- **npm**: `v9.0.0` or higher (`npm -v`)
- **MongoDB**: A free MongoDB Atlas cluster account OR local MongoDB instance
- **Expo Go App** (optional): Installed on your physical Android phone from Google Play Store
- **Android Studio** (optional): For running an Android Virtual Device (AVD) emulator
- **EAS CLI** (for building APKs): Install via `npm install -g eas-cli` or run with `npx eas-cli`

---

## 4. Frontend Installation

Navigate to the `frontend/` directory and install dependencies:

```bash
cd frontend
npm install
```

Verify that TypeScript passes with zero errors:

```bash
npm run typecheck
```

---

## 5. Backend Installation

Navigate to the `backend/` directory and install dependencies:

```bash
cd backend
npm install
```

Run the automated backend test suite:

```bash
npm test
```

---

## 6. Environment Configuration

### Backend `.env`

Create `backend/.env` from `backend/.env.example`:

```bash
cd backend
cp .env.example .env
```

Populate the following variables:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER>.mongodb.net/<DB_NAME>?retryWrites=true&w=majority
JWT_SECRET=replace_with_a_long_random_secret_at_least_32_chars
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
```

> **Generating a secure JWT Secret**:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### Frontend `.env`

Create `frontend/.env` from `frontend/.env.example`:

```bash
cd frontend
cp .env.example .env
```

Populate the backend endpoint:

```env
EXPO_PUBLIC_API_URL=http://<YOUR_COMPUTER_LAN_IP>:5000/api
```

- **Physical Android Phone**: Use your computer's local Wi-Fi IP address (e.g., `http://192.168.1.105:5000/api`). Find it on Mac with `ipconfig getifaddr en0`.
- **Android Emulator**: Use `http://10.0.2.2:5000/api` (`10.0.2.2` aliases localhost).
- **iOS Simulator**: Use `http://localhost:5000/api`.
- **Deployed Backend (Render)**: Use your public HTTPS URL (e.g., `https://myfirstapp-api.onrender.com/api`).

---

## 7. MongoDB Atlas Configuration

1. **Create an Account & Cluster**:
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign in.
   - Deploy a free M0 cluster.
2. **Create a Database User**:
   - Under **Security** > **Database Access**, click **Add New Database User**.
   - Select **Password Authentication**. Set a username and secure password.
   - Assign the **Read and write to any database** privilege.
3. **Configure Network Access**:
   - Under **Security** > **Network Access**, click **Add IP Address**.
   - Click **Allow Access From Anywhere** (`0.0.0.0/0`) so that mobile testing and Render dynamic containers can connect.
4. **Retrieve Connection String**:
   - Under **Deployments** > **Database**, click **Connect**.
   - Choose **Drivers** (Node.js).
   - Copy the URI, replacing `<password>` with your database user password and specifying your database name (e.g., `/myfirstapp`).

---

## 8. How to Run the Backend Locally

From the root workspace or `backend/` folder:

```bash
# From workspace root
npm run start:backend

# Or directly inside backend/
cd backend
npm run dev
```

The server binds to `0.0.0.0:5000` to allow both localhost and mobile LAN traffic.

Verify the server is running by opening:
[http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 9. How to Run the React Native Application

From the root workspace or `frontend/` folder:

```bash
# From workspace root
npm run start:frontend

# Or directly inside frontend/
cd frontend
npx expo start
```

- **On Physical Android Phone**:
  1. Ensure your phone and development computer are connected to the same Wi-Fi network.
  2. Open the **Expo Go** app on your phone.
  3. Scan the terminal QR code.
- **On Android Virtual Device (AVD)**:
  1. Press `a` in the terminal to launch on the running emulator.

---

## 10. How to Test APIs

### Automated Tests:
Run the comprehensive integration test suite:

```bash
npm run test:backend
```

### Manual Testing with cURL:

1. **Health Check**:
   ```bash
   curl -i http://localhost:5000/api/health
   ```

2. **Register a User**:
   ```bash
   curl -i -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'
   ```
   *(Copy the returned `"token"` for protected requests)*

3. **Login**:
   ```bash
   curl -i -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"john@example.com","password":"password123"}'
   ```

4. **Get Profile** *(Protected)*:
   ```bash
   curl -i http://localhost:5000/api/users/me \
     -H "Authorization: Bearer <TOKEN>"
   ```

5. **Create a Todo** *(Protected)*:
   ```bash
   curl -i -X POST http://localhost:5000/api/todos \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <TOKEN>" \
     -d '{"title":"Test Todo","description":"Testing from cURL"}'
   ```

6. **List User Todos** *(Protected)*:
   ```bash
   curl -i http://localhost:5000/api/todos \
     -H "Authorization: Bearer <TOKEN>"
   ```

---

## 11. How to Deploy the Backend to Render

1. Push your repository to **GitHub**.
2. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** > **Web Service**.
3. Select your GitHub repository.
4. Configure the Web Service:
   - **Name**: `myfirstapp-api`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Under **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `<Your MongoDB Atlas Connection String>`
   - `JWT_SECRET`: `<Your 64-character hex secret>`
   - `JWT_EXPIRES_IN`: `7d`
   - `CORS_ORIGIN`: `*`
6. Click **Create Web Service**. Render will provision, build, and deploy the service. Note your public URL (e.g., `https://myfirstapp-api.onrender.com`).

---

## 12. How to Configure the Production API URL

Once your backend is deployed to Render:
1. Update `frontend/.env`:
   ```env
   EXPO_PUBLIC_API_URL=https://myfirstapp-api.onrender.com/api
   ```
2. Any subsequent EAS Build will automatically bundle this production API URL into the APK.

---

## 13. How to Build an Android APK with Expo EAS

The `frontend/eas.json` file is pre-configured with a preview profile for direct APK output:

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### Steps to Build:
1. Navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Log in with your Expo credentials:
   ```bash
   npx eas-cli login
   ```
3. Run the build command:
   ```bash
   npx eas-cli build --profile preview --platform android
   ```
4. EAS Build runs in the cloud. When complete, it outputs a direct download link for the `.apk` package.

---

## 14. How to Install the APK on Another Android Phone

1. **Direct Download**:
   - Open the EAS build completion URL in Chrome on any Android phone.
   - Tap **Download APK**.
2. **Allow Installation**:
   - When opening the downloaded APK, if prompted with "Install unknown apps", tap **Settings** and enable **Allow from this source**.
3. **Install & Launch**:
   - Tap **Install**. Once installed, launch **MyFirstApp** directly from the app drawer!
4. **Alternative (USB / ADB)**:
   ```bash
   adb install path/to/myfirstapp.apk
   ```

---

## 15. Common Troubleshooting Steps

| Issue | Cause | Solution |
|---|---|---|
| `Network request failed` on physical phone | Mobile cannot reach backend `localhost` | Ensure computer and phone are on the same Wi-Fi. In `frontend/.env`, set `EXPO_PUBLIC_API_URL` to your computer's LAN IP (e.g. `192.168.x.x`), not `localhost`. |
| `Network request failed` on Android Emulator | Emulator loopback mismatch | Use `http://10.0.2.2:5000/api` as the API URL for Android emulator. |
| MongoDB `MongooseServerSelectionError` | IP not whitelisted in Atlas | In MongoDB Atlas under **Network Access**, ensure `0.0.0.0/0` is added to allow connections. |
| `expo-secure-store` session error | Stale encrypted keystore | Clear app data in Android Settings > Apps > MyFirstApp > Storage > Clear Data. |
| Metro bundler caching issues | Stale JavaScript cache | Restart Metro bundler with cache reset: `npx expo start -c`. |
| APK build asks for credentials | First EAS run on account | Follow EAS interactive prompt to let Expo automatically generate the Android keystore. |
