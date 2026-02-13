# DG (Deepfake Guard) - Full Stack Application

A comprehensive Firebase-based full-stack application for detecting and managing deepfakes in video communications. Features real-time call tracking, user reviews, admin dashboards, and deepfake detection scoring.

## Project Overview

**DG** is a full-stack web application built with:
- **Frontend:** React + Vite (web-react/)
- **Backend:** Firebase Cloud Functions (Node.js + TypeScript)
- **Database:** Firestore
- **Hosting:** Firebase Hosting
- **Authentication:** Firebase Auth

### Key Features

- **User Authentication** - Phone verification, username registration, admin accounts
- **Call Management** - Track calls, flag suspicious callers, real-time updates
- **Deepfake Detection** - AI-powered detection scoring and analysis
- **Reviews & Ratings** - Community reviews with statistics
- **Admin Dashboard** - Analytics, user management, audit logs
- **Subscription Management** - Upgrade/downgrade user plans

## Repository Structure

```
DG_FirebaseBackend/
├── functions/              # Firebase Cloud Functions (Backend)
│   ├── src/              # TypeScript source
│   ├── lib/              # Compiled JavaScript
│   └── package.json
├── web-react/            # React Frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   └── styles/      # CSS files
│   ├── index.html
│   └── package.json
├── firestore.rules       # Security rules for Firestore
├── firestore.indexes.json # Firestore indexes
├── firebase.json         # Firebase configuration
└── README.md            # This file
```

## Prerequisites

- **Node.js 20+** ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Firebase CLI** (for local development and deployment)

```bash
npm install -g firebase-tools
```

## Quick Start

### 1. Clone & Setup

```bash
git clone <repository-url>
cd DG_FirebaseBackend
```

### 2. Setup Backend

```bash
cd functions
npm install
npm run build
```

### 3. Setup Frontend

```bash
cd ../web-react
npm install
npm run dev
```

### 4. Firebase Configuration

```bash
firebase login
firebase use --add
```

## Detailed Setup

### Backend Development

**Build TypeScript:**
```bash
cd functions
npm run build          # Compile TypeScript to JavaScript
npm run build:watch   # Compile with auto-reload on file changes
```

**Run Local Emulator:**
```bash
npm run serve
```
Starts Firebase Local Emulator Suite. Functions available at `http://localhost:5001`.

**Interactive Testing:**
```bash
npm run start          # Firebase shell
```

**View Logs:**
```bash
npm run logs           # Real-time logs from deployed functions
```

**Lint Code:**
```bash
npm run lint           # Check TypeScript style and errors
```

### Frontend Development

**Start Dev Server:**
```bash
cd web-react
npm run dev
```
Starts Vite dev server with hot module replacement (HMR).

**Build for Production:**
```bash
npm run build          # Build optimized bundle
npm run preview        # Preview production build locally
```

**Lint React Code:**
```bash
npm run lint
```

### Full-Stack Local Development

Run backend emulator and frontend dev server simultaneously:

**Terminal 1 - Backend:**
```bash
cd functions
npm run serve
```

**Terminal 2 - Frontend:**
```bash
cd web-react
npm run dev
```

Frontend will be available at `http://localhost:5173` and will call backend functions at `http://localhost:5001`.

## Project Structure

### Backend (functions/)

```
functions/
├── src/                           # TypeScript source
│   ├── index.ts                  # Main entry point, exports all functions
│   ├── auth.ts                   # Authentication: signup, login, verification
│   ├── reviews.ts                # Review management: create, read, delete
│   ├── calls.ts                  # Call tracking: history, status updates
│   ├── adminUsers.ts             # Admin: manage users, disable/delete
│   ├── adminReviews.ts           # Admin: manage reviews
│   ├── adminAudit.ts             # Audit logging of admin actions
│   ├── stats.ts                  # Statistics: compute aggregations
│   └── firebase.ts               # Firebase initialization
├── lib/                          # Compiled JavaScript (auto-generated)
├── package.json                  # Dependencies and build scripts
├── tsconfig.json                 # TypeScript compiler config
└── eslintrc.json                 # Code style rules
```

### Frontend (web-react/)

```
web-react/
├── src/
│   ├── App.jsx                   # Main app component
│   ├── main.jsx                  # React entry point
│   ├── firebase.js               # Firebase config
│   ├── components/               # Reusable React components
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   ├── ReviewSlider.jsx
│   │   ├── SubscribeButton.jsx
│   │   ├── DowngradeButton.jsx
│   │   └── admin/               # Admin-specific components
│   │       ├── AdminSection.jsx
│   │       ├── DeepfakePieChart.jsx
│   │       ├── DetectionScoreHistogram.jsx
│   │       ├── DetectionTrendChart.jsx
│   │       ├── PerformancePanel.jsx
│   │       ├── ReviewCard.jsx
│   │       ├── StatCard.jsx
│   │       └── UserRow.jsx
│   ├── pages/                    # Page components
│   │   ├── Home.jsx
│   │   ├── About.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── Checkout.jsx
│   │   ├── PaymentSuccess.jsx
│   │   ├── Download.jsx
│   │   └── Reviews.jsx
│   ├── assets/                   # Images, team photos, etc.
│   └── styles/                   # CSS
│       ├── main.css
│       └── admin-dashboard.css
├── index.html
├── package.json
└── vite.config.js
```

## Database (Firestore)

### Collections

**public_users** - Public user profiles (readable by authenticated users)
- userId (doc ID)
- username, displayName, photoURL
- subscription level
- stats (detection accuracy, reviews count)

**users** - Private user data (readable by self + admins)
- userId (doc ID)
- phone, email, subscription details
- preferences

**calls** - Call records (for call tracking)
- callId (doc ID)
- caller_user_id, callee_user_id
- status (ringing, connected, ended)
- detection_scores, deepfake flags
- timestamps

**reviews** - Community reviews
- reviewId (doc ID)
- userId (reviewer)
- rating (1-5 stars)
- comment, timestamp
- statistics (helpful count, etc.)

**admin_audit** - Audit logs of admin actions
- auditId (doc ID)
- admin_uid, action, target_uid
- timestamp, metadata

### Security Rules

Defined in `firestore.rules`:
- **Public Users:** Readable by authenticated users, no writes
- **Private Users:** Each user can read/update only their own profile, admins can read all
- **Calls:** Only participants and admins can access
- **Reviews:** Authenticated users can create, delete only their own
- **Admin Actions:** Only admins can access audit logs

See [firestore.rules](firestore.rules) for complete security implementation.

## Cloud Functions API

All functions are HTTP callable or triggered by Firestore events.

### Authentication Module

- `checkUsernameAvailable(username)` - Check if username is taken
- `claimUsername(username)` - Register a new username
- `sendPhoneVerificationCode(phone, recaptchaToken)` - Send OTP
- `verifyPhoneCode(phone, code)` - Verify OTP and authenticate
- `checkPhoneVerificationStatus(phone)` - Check verification status
- `addAdminUser(email, displayName)` - Create admin account
- `generateAdminVerificationLink(email)` - Generate admin verification link
- `checkSendVerificationOnFirstLogin()` - Check if admin needs verification
- `fixAdminUsername(uid, username)` - Admin username setup

### Reviews Module

- `addReview(callId, rating, comment)` - Submit a review
- `getReviews(filters?)` - Retrieve reviews with optional filters
- `getReviewStats()` - Get aggregate review statistics
- `deleteReview(reviewId)` - Remove a review (auth required)
- `getFiveStarReviews()` - Get top-rated reviews

### Call Management Module

- `getCallHistory(userId?)` - Get user's call history
- `endCall(callId, endedReason)` - Mark call as ended
- `flagCallerOnCallEnd(callId, suspiciousFlags)` - Flag call for review

### Admin Module

- `listUsers(filters?)` - Get all users (admin only)
- `setUserDisabled(uid, disabled)` - Disable/enable account (admin)
- `deleteUser(uid)` - Remove user account (admin)
- `adminDeleteReview(reviewId)` - Remove review (admin)
- `recomputeStatsDaily` - Scheduled daily stats computation
- `recomputeStatsNow()` - Manually trigger stats computation
- Admin audit functions - Track admin actions

## Deployment

### Prerequisites

1. **Firebase Project** - Create at [Firebase Console](https://console.firebase.google.com)
2. **Google Cloud Project** - For advanced features and billing
3. **Authenticated CLI** - Run `firebase login`

### Deploy Backend (Cloud Functions)

```bash
cd functions
npm run build
cd ..
firebase deploy --only functions
```

**Pre-deployment Checks:**
- Linting: `npm run lint`
- Building: `npm run build`

Both run automatically before deployment (configured in `firebase.json`).

### Deploy Frontend (Hosting)

```bash
cd web-react
npm run build
cd ..
firebase deploy --only hosting
```

Builds React app and deploys to Firebase Hosting.

### Deploy Everything

```bash
firebase deploy
```

Deploys both functions and hosting in one command.

### Environment Variables

Set runtime environment variables in Firebase Console > Functions > Runtime Settings

Backend functions can access via:
```typescript
process.env.VARIABLE_NAME
```

Frontend API calls should use Firebase SDK configuration from `web-react/src/firebase.js`.

### Firestore Indexes

Deploy custom indexes:
```bash
firebase deploy --only firestore:indexes
```

Indexes are defined in [firestore.indexes.json](firestore.indexes.json).

### Firestore Security Rules

Deploy updated rules:
```bash
firebase deploy --only firestore:rules
```

Rules are defined in [firestore.rules](firestore.rules).

## Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Hosting** | Firebase Hosting | Serve React frontend |
| **Frontend** | React 18 + Vite | User interface |
| **Backend** | Firebase Cloud Functions | Serverless API |
| **Database** | Firestore | NoSQL data storage |
| **Auth** | Firebase Auth | User authentication |
| **Language** | TypeScript (backend), JavaScript (frontend) | Type safety & dynamic features |

### Data Flow

```
User Browser
    ↓
React App (web-react/)
    ↓
Firebase SDK (Auth)
    ↓
Cloud Functions (functions/)
    ↓
Firestore Database
    ↓
Business Logic & Security Rules
```

### Key Files

- **firebase.json** - Firebase project configuration, deploy rules
- **firestore.rules** - Database security and access control
- **firestore.indexes.json** - Firestore composite indexes
- **functions/tsconfig.json** - Backend TypeScript config
- **web-react/vite.config.js** - Frontend build config

## Configuration

### Backend TypeScript (`functions/tsconfig.json`)
- Target: ES2020
- Module: CommonJS
- Strict mode enabled
- Source maps for debugging

### Frontend Build (`web-react/vite.config.js`)
- React plugin with Fast Refresh
- ESLint integration
- HMR enabled for development

### ESLint

Both `functions/` and `web-react/` have ESLint configured:
- **Backend:** Google style guide
- **Frontend:** React/JSX rules

## Important Notes

- **Node Version:** Backend requires Node 20 (specified in `functions/package.json`)
- **Cost Control:** Cloud Functions can be limited via `maxInstances` setting
- **Firebase Plan:** Some features require Blaze (pay-as-you-go) plan
- **Security:** Never commit Firebase credentials. Use environment variables.
- **Database Limits:** Firestore has read/write quota limits. Monitor in Console.

## Useful Links

### Firebase & Google Cloud
- [Firebase Console](https://console.firebase.google.com) - Project management
- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- [Google Cloud Console](https://console.cloud.google.com) - Billing & advanced settings

### Technologies
- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Node.js API](https://nodejs.org/docs/)

### Learning Resources
- [Firebase Codelabs](https://codelabs.developers.google.com/?product=firebase)
- [Firebase YouTube Channel](https://www.youtube.com/@Firebase)

## Troubleshooting

### Backend Issues

**Dependencies not installing**
```bash
cd functions
rm -r node_modules package-lock.json
npm install
npm run build
```

**Build errors**
```bash
npm run build       # Check compiler errors
npm run lint        # Check style issues
```

**Emulator not starting**
```bash
firebase emulators:start --only functions --debug
```

**Functions not deploying**
```bash
npm run lint        # Fix linting errors
npm run build       # Check build errors
firebase deploy --only functions --debug
```

### Frontend Issues

**Port 5173 already in use**
```bash
cd web-react
npm run dev -- --port 3000    # Use different port
```

**Hot reload not working**
Delete `.vite/` folder and restart dev server.

**Firebase config errors**
Verify `web-react/src/firebase.js` has correct project credentials from Firebase Console.

### Firebase Emulator

**Emulator data persists between runs**
```bash
firebase emulators:start --import=./emulator-data --debug
```

**Reset emulator data**
Delete the emulator data directory and restart.

**Clear all caches**
```bash
firebase logout
rm -r ~/.firebase
firebase login
firebase use --add
```

### General

**Check Node version**
```bash
node --version    # Should be 20.x or higher
```

**Debug TypeScript compilation**
```bash
npm run build -- --diagnostics
```

**View detailed deployment logs**
```bash
firebase deploy --debug
```

## Contributing

To contribute to this project:

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Run linting and tests locally**
   ```bash
   # Backend
   cd functions
   npm run lint
   npm run build
   
   # Frontend
   cd web-react
   npm run lint
   ```

3. **Test with Firebase Emulator**
   ```bash
   firebase emulators:start
   ```

4. **Commit with clear messages**
   ```bash
   git commit -m "feat: add helpful commit message"
   ```

5. **Push and create a Pull Request**

### Code Style

- **Backend:** Google ESLint rules
- **Frontend:** React ESLint rules
- **Both:** 2-space indentation, semicolons required
- Run `npm run lint` before committing

## Project Status

- **Backend:** Production-ready
- **Frontend:** Production-ready  
- **Database:** Production Firestore
- **Auth:** Firebase Auth with phone verification

## Support & Contact

For issues, questions, or contributions, please:
1. Check existing GitHub issues
2. Review the troubleshooting section above
3. Check Firebase documentation
4. Contact the development team

## License

This project is proprietary. See LICENSE file for details.
