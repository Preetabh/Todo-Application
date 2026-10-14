# Frontend Mobile Application - MyFirstApp

A lightweight, modern, production-quality mobile application built with **React Native**, **Expo (SDK 57)**, **TypeScript**, and **Expo Router**.

Designed with a sleek **dark navy & indigo** palette, rounded cards, keyboard-safe layouts, and robust backend synchronization.

---

## Features & Screens

1. **Authentication Gate**: Automatically checks encrypted local session on startup and routes users accordingly.
2. **Login Screen (`LoginScreen.tsx`)**:
   - Modern brand logo & header
   - Email & password inputs with live validation
   - Show / hide password toggle
   - Direct integration with backend JWT authentication
   - Instant navigation to Signup
3. **Signup Screen (`SignupScreen.tsx`)**:
   - Full name, email, password, and confirm password fields
   - Strict format validation
   - Automatic login and redirect to Home upon account creation
4. **Home Screen (`HomeScreen.tsx`)**:
   - Dynamic time-based greeting (Morning/Afternoon/Evening)
   - Real-time statistics cards: Total, Pending, and Completed tasks
   - Quick action shortcuts to Manage Tasks and My Profile
   - Pull-to-refresh to sync stats from the MongoDB backend
5. **Todo Management Screen (`TodoScreen.tsx`)**:
   - Complete CRUD operations persisted in MongoDB
   - Filter tabs: All, Pending, Completed
   - Circular checkbox with completion status toggle
   - Task creation date display
   - Modal for adding and editing tasks
   - Confirmation dialog before deleting any task
   - Empty states and network error banners with dismiss/retry
6. **Profile Screen (`ProfileScreen.tsx`)**:
   - User initials avatar and account details
   - Account creation date
   - In-place profile editing for name and email
   - Secure logout with token removal

---

## Directory Structure

```
frontend/
├── src/
│   ├── app/                    # Expo Router route definitions
│   │   ├── _layout.tsx         # Root Stack & AuthProvider
│   │   ├── index.tsx           # Session restore & auth gate
│   │   ├── login.tsx           # Route for Login
│   │   ├── signup.tsx          # Route for Signup
│   │   ├── home.tsx            # Route for Home Dashboard
│   │   ├── profile.tsx         # Route for User Profile
│   │   └── todo.tsx            # Route for Todo List
│   ├── components/
│   │   ├── Button.tsx          # Custom primary, secondary, danger button
│   │   ├── Card.tsx            # Rounded elevated card
│   │   ├── ConfirmModal.tsx    # Deletion confirmation dialog
│   │   ├── EmptyState.tsx      # Friendly empty list view
│   │   ├── ErrorMessage.tsx    # Styled error alert banner
│   │   ├── Header.tsx          # Safe-area title and back header
│   │   ├── Input.tsx           # Text input with password toggle & validation
│   │   └── LoadingSpinner.tsx  # Activity indicator with text
│   ├── constants/
│   │   └── theme.ts            # Dark navy & indigo color tokens, spacing
│   ├── context/
│   │   └── AuthContext.tsx     # Global authentication provider
│   ├── hooks/
│   │   └── useAuth.ts          # Auth state & actions hook
│   ├── navigation/
│   │   └── types.ts            # Screen route parameter types
│   ├── services/
│   │   ├── api.ts              # Fetch client with token headers & timeout
│   │   └── storage.ts          # SecureStore encrypted token storage
│   └── types/
│       └── index.ts            # TypeScript interfaces & models
├── assets/                     # App icons and splash images
├── app.json                    # Expo configuration
├── eas.json                    # EAS Build profiles (APK configured)
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

---

## Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set `EXPO_PUBLIC_API_URL` depending on where you are testing:

| Environment | Value | Description |
|---|---|---|
| **Android Emulator** | `http://10.0.2.2:5000/api` | `10.0.2.2` routes to host machine's `localhost` |
| **Physical Android Phone** | `http://<YOUR_LAN_IP>:5000/api` | e.g. `http://192.168.1.105:5000/api` (phone on same Wi-Fi) |
| **iOS Simulator** | `http://localhost:5000/api` | Simulator shares Mac network stack |
| **Production (Render)** | `https://your-backend.onrender.com/api` | Production cloud backend |

---

## Running the Application Locally

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Start the Expo development server**:
   ```bash
   npx expo start
   ```

3. **Running on Android**:
   - **Android Emulator**: Press `a` in the terminal or launch an emulator via Android Studio.
   - **Physical Phone**: Scan the QR code displayed in the terminal with the **Expo Go** app.

---

## Building an Android APK with EAS Build

The project includes an installable APK profile configured in `eas.json`:

```json
"preview": {
  "distribution": "internal",
  "android": {
    "buildType": "apk"
  }
}
```

### Steps to Build the APK:

1. **Log in to your Expo account**:
   ```bash
   npx eas-cli login
   ```

2. **Trigger the cloud APK build**:
   ```bash
   npx eas-cli build --profile preview --platform android
   ```

3. **Download and Install**:
   - EAS will generate a direct download link to the `.apk` file when the build completes.
   - Download the APK directly onto your Android phone or transfer it via USB.
   - Open the `.apk` file on the Android device and select **Install** (allow installs from your browser or file manager if prompted).
   - Alternatively, install via ADB:
     ```bash
     adb install application.apk
     ```

---

## Lightweight Optimization Details

- **Bundle Size**: Only essential Expo modules are used (`expo-secure-store`, `expo-router`, `@expo/vector-icons`).
- **No Heavy Frameworks**: Pure React Native StyleSheet is used throughout. No web-only libraries, no heavy state management like Redux.
- **Secure Token Storage**: Authentication tokens are encrypted in hardware-backed keystores via `expo-secure-store` instead of plain text storage.
