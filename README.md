# Personal Gemini Journal — AI Reflection & Growth Workspace

> Built for the **Google Cloud Run Build & Deploy Social Challenge** using **Google AI Studio** and **Google Cloud Run**.

**Personal Gemini Journal** is an AI-powered reflection workspace and personal growth companion. Rather than acting as a standard conversational chatbot, it transforms raw journal entries into structured reflections, identifies recurring thought patterns over time, extracts actionable SMART goals, and tracks a chronological personal growth journey — all while maintaining complete privacy and tenant isolation in Cloud Firestore.

---

## 📑 Table of Contents
1. [System Architecture & Data Flow Diagrams](#-system-architecture--flow-diagrams)
2. [Complete Repository Guide](#-complete-repository-guide)
3. [API Endpoint Specifications](#-api-endpoint-specifications)
4. [How to Run & Test Locally](#-how-to-run--test-locally)
5. [Firestore Database Schema & Security Rules](#-firestore-database-schema--security-rules)
6. [Agentic Threat Model & Countermeasures](#-agentic-threat-model--security-countermeasures)
7. [Google Cloud Run Deployment & Campaign Verification](#-google-cloud-run-deployment--verification)
8. [Comprehensive Functional Test Walkthrough](#-comprehensive-functional-test-walkthrough)

---

## 📐 System Architecture & Flow Diagrams

### 1. High-Level Full-Stack Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BROWSER CLIENT (React + Vite)                    │
│                                                                             │
│  ┌────────────────────┐  ┌─────────────────────┐  ┌──────────────────────┐ │
│  │   Write & Reflect  │  │ Multi-Turn AI Chat  │  │  SMART Goals Manager │ │
│  └─────────┬──────────┘  └──────────┬──────────┘  └──────────┬───────────┘ │
│            │                        │                        │             │
│            ▼                        ▼                        ▼             │
│  ┌────────────────────┐  ┌─────────────────────┐  ┌──────────────────────┐ │
│  │ Local Draft Buffer │  │ Auth Context / GSI  │  │ Interactive Timeline │ │
│  └────────────────────┘  └──────────┬──────────┘  └──────────────────────┘ │
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      │
                         HTTPS JSON API Calls & Tokens
                                      │
┌─────────────────────────────────────▼───────────────────────────────────────┐
│                      BACKEND SERVICE (Express on Port 3000)                 │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  Top-Level JSON Body Parser (Defensive Deserialization & Sanitization)│  │
│  └──────────────────────────────────┬────────────────────────────────────┘  │
│                                     │                                       │
│  ┌──────────────────────────────────▼────────────────────────────────────┐  │
│  │                 Google GenAI Resilient Fallback Ladder                │  │
│  │                                                                       │  │
│  │   [Primary]               [Fast Fallback]           [Deep Fallback]   │  │
│  │   gemini-3.6-flash  ───▶  gemini-3.1-flash-lite ──▶  gemini-3.7-flash  │  │
│  └──────────────────────────────────┬────────────────────────────────────┘  │
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      │
            ┌─────────────────────────┴─────────────────────────┐
            ▼                                                   ▼
┌───────────────────────────────┐               ┌───────────────────────────────┐
│       Google Gemini API       │               │     Cloud Firestore Database  │
│ (Zero-Exposure Secret Key in  │               │ (Owner-Bound Isolated Paths:  │
│   Cloud Secret Manager)       │               │  /users/{userId}/... )        │
└───────────────────────────────┘               └───────────────────────────────┘
```

---

### 2. Journal Reflection & Synthesis Flow

```
[User Types Journal] ──▶ [Auto-save to LocalStorage Draft]
          │
          ▼ Click "Save & Generate Reflection"
[Persist Entry to Firestore: /users/{userId}/journals/{journalId}]
          │
          ▼ POST /api/gemini/reflect
[Backend Calls Gemini via Fallback Ladder with Strict JSON Schema]
          │
          ▼ Returns: { coreTheme, observation, thinkAbout, possibleNextStep }
[Update Journal Document with Reflection in Firestore]
          │
          ▼
[Auto-Record Milestone on Journey Timeline: /users/{userId}/milestones]
          │
          ▼
[Render Structured Reflection Card in Interactive Journal Workspace]
```

---

### 3. SMART Goal & Action Progression Flow

```
[Journal Workspace / Reflection Card]
          │
          ▼ Click "Convert to Smart Goal"
[POST /api/gemini/convert-to-goal]
          │
          ▼ Returns structured Goal Title + Purpose + Actionable Tasks
[User Customizes or Accepts Goal in Goals View]
          │
          ▼ Persist to /users/{userId}/goals/{goalId}
[Interactive Checklist with Dynamic Progress Bar (0% to 100%)]
          │
          ▼ On 100% Task Completion
[Trigger Confetti Celebration 🎉] ──▶ [Record Journey Milestone on Timeline]
```

---

### 4. Cross-Entry Thought Pattern Recognition Flow

```
[User Clicks "Discover Thought Patterns" on Dashboard]
          │
          ▼
[Fetch User's Recent Historical Entries from Firestore]
          │
          ▼ POST /api/gemini/patterns
[Gemini Clusters Themes, Identifies Cognitive Loops & Positive Trends]
          │
          ▼ Returns: [ { theme, frequency, insight, relatedJournals } ]
[Render Interactive Pattern Alert Banner on Dashboard]
          │
          ├──▶ [Click "Explore Related Journals" -> Filtered History View]
          └──▶ [Click "Acknowledge / Dismiss" -> Stored in State]
```

---

## 🗂️ Complete Repository Guide

```
├── .env.example                # Blueprint for required environment variables
├── metadata.json               # Platform manifest & capabilities declaration
├── package.json                # Dependencies, scripts, and build configuration
├── tsconfig.json               # TypeScript compiler configuration
├── vite.config.ts              # Vite tooling & Tailwind CSS integration
├── server.ts                   # Express server entry point, Gemini API proxies & Vite middleware
├── firestore.rules             # Production security rules enforcing owner-bound isolation
├── index.html                  # HTML entry point with typography fonts & meta tags
│
└── src/
    ├── main.tsx                # Client application bootstrapping
    ├── App.tsx                 # Root layout, dynamic client router, and toast layer
    ├── index.css               # Tailwind CSS entry imports & global typography styling
    ├── types.ts                # Shared TypeScript interfaces (JournalEntry, Reflection, Goal, etc.)
    │
    ├── context/
    │   └── AuthContext.tsx     # Firebase Authentication provider, user profiles & streak management
    │
    ├── lib/
    │   ├── firebase.ts         # Firestore CRUD utilities, owner-bound queries, and Auth wrappers
    │   └── utils.ts            # Formatting helpers, mood palettes, and draft localStorage cache
    │
    ├── services/
    │   └── api.ts              # Client API helper functions interacting with /api/gemini/* endpoints
    │
    ├── components/
    │   ├── Navbar.tsx          # Main header, live streak counter, and user profile badge
    │   ├── Sidebar.tsx         # Collapsible desktop navigation bar with route indicators
    │   ├── Toast.tsx           # Accessible notification banner queue for success/error states
    │   ├── ConfirmModal.tsx    # Accessible confirmation dialog for deletion & logout actions
    │   ├── ReflectionCard.tsx  # Structured AI Reflection card with one-click goal conversion
    │   └── PatternAlert.tsx    # Recurring thought pattern notification banner
    │
    └── views/
        ├── LandingPage.tsx     # Public welcome page explaining benefits & features
        ├── LoginPage.tsx       # Dedicated sign-in page with Google Federated Authentication
        ├── DashboardView.tsx   # Hub displaying streaks, quick actions, patterns, & recent entries
        ├── NewJournalView.tsx  # Distraction-free editor with draft protection & mood tagging
        ├── JournalWorkspaceView.tsx # Dual-pane workspace: Journal + Multi-turn Grounded AI Chat
        ├── HistoryView.tsx     # Filterable journal archive with search, tags, moods, and sorting
        ├── FavoritesView.tsx   # Starred entries and milestone reflections
        ├── SearchView.tsx      # Full-text search and tag discovery across all entries
        ├── GoalsView.tsx       # SMART goal tracker with task checklists, progress meters & confetti
        ├── JourneyView.tsx     # Chronological growth timeline of reflections & breakthroughs
        ├── InsightsView.tsx    # Descriptive mood distribution charts and topic frequency analytics
        └── SettingsView.tsx    # Profile management, JSON export, draft cleanup, and security settings
```

---

## 📡 API Endpoint Specifications

All Gemini API calls are securely proxied through server-side Express routes:

| Endpoint | Method | Input Payload | Output Schema / Description |
|---|---|---|---|
| `/api/health` | `GET` | _None_ | `{ status: "ok", timestamp: string, service: string }` |
| `/api/gemini/reflect` | `POST` | `{ title, content, mood, tags }` | Returns structured `{ coreTheme, observation, thinkAbout, possibleNextStep }` |
| `/api/gemini/chat` | `POST` | `{ journalContext, history, message }` | Multi-turn reflection dialogue grounded in the selected journal |
| `/api/gemini/summarize` | `POST` | `{ title, content, tags }` | Generates a 2-3 sentence core reflection summary |
| `/api/gemini/brainstorm` | `POST` | `{ title, content, focusTopic }` | Returns `{ focusSummary, ideas: [{ title, description, pros, cons }], reflectionPrompt }` |
| `/api/gemini/actions` | `POST` | `{ title, content }` | Extracts `{ actions: string[] }` (3-5 bite-sized actionable next steps) |
| `/api/gemini/convert-to-goal` | `POST` | `{ title, content, reflection, insightText }` | Returns structured `{ goalTitle, description, category, tasks: string[] }` |
| `/api/gemini/patterns` | `POST` | `{ entries: JournalEntry[] }` | Analyzes up to 20 past journals to surface recurring themes and insights |

---

## 💻 How to Run & Test Locally

### 1. System Requirements
- **Node.js**: Version 18.0.0 or later (v20+ recommended)
- **npm**: Version 9.0.0 or later
- **Gemini API Key**: From [Google AI Studio](https://aistudio.google.com/)

### 2. Installation Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/personal-gemini-journal.git
   cd personal-gemini-journal
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   # .env
   GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"
   PORT=3000
   NODE_ENV="development"
   ```

4. **Start the Unified Development Server**:
   ```bash
   npm run dev
   ```
   *The Express backend and Vite middleware will start concurrently on `http://localhost:3000`.*

5. **Access the Application**:
   Open your browser and navigate to `http://localhost:3000`.

### 3. Local Production Build Testing

To test the bundled production build locally before deploying to Cloud Run:

```bash
# 1. Build the frontend client & bundle the server
npm run build

# 2. Start the production server
npm start
```
*Verify that static assets serve properly from `dist/` and all `/api/*` endpoints respond correctly.*

---

## 🔒 Firestore Database Schema & Security Rules

### Data Collections Layout

```
/users/{userId}
  ├── displayName: string
  ├── email: string
  ├── writingStreak: number
  ├── lastActiveDate: string
  │
  ├── /journals/{journalId}
  │     ├── title: string
  │     ├── content: string
  │     ├── mood: "reflective" | "calm" | "energized" | "anxious" | ...
  │     ├── tags: string[]
  │     ├── favorite: boolean
  │     ├── createdAt: number
  │     ├── summary?: string
  │     └── reflection?: { coreTheme, observation, thinkAbout, possibleNextStep }
  │
  ├── /goals/{goalId}
  │     ├── title: string
  │     ├── description: string
  │     ├── category: string
  │     ├── progress: number (0-100)
  │     ├── status: "active" | "completed"
  │     └── tasks: [{ id, text, completed, completedAt }]
  │
  └── /milestones/{milestoneId}
        ├── type: "journal" | "reflection" | "goal_created" | "action_completed" | ...
        ├── title: string
        ├── description: string
        ├── timestamp: number
        └── tag?: string
```

### Production Security Rules (`firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // User root profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Private journals collection
      match /journals/{journalId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        
        // Chat messages
        match /messages/{messageId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }

      // Private smart goals
      match /goals/{goalId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      // Private journey milestones
      match /milestones/{milestoneId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      // Recurring pattern logs
      match /patterns/{patternId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }

    // Default deny
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 🛡️ Agentic Threat Model & Security Countermeasures

| Threat Zone | Identified Risk | Countermeasure Implemented |
|---|---|---|
| **Input Surfaces** | Prompt injection via untrusted journal text or malicious user chat input | Server-side prompt boundary encapsulation; system directives instruct Gemini to treat user journal content strictly as plain data. |
| **Planning & Reasoning** | Unhandled API schema deviations or malformed model responses | Structured JSON schema formatting (`responseMimeType: 'application/json'`) with defensive parsing and type validation. |
| **Tool Execution** | API rate limits, model quota exhaustion (`429`, `503`) | Resilient model fallback ladder (`gemini-3.6-flash` → `gemini-3.1-flash-lite` → `gemini-flash-latest` → `gemini-3.7-flash`). |
| **Memory & State** | Cross-user data leakage and unauthorized database modifications | Cloud Firestore security rules with owner-bound access control (`request.auth.uid == userId`); zero-unauthorized public access. |
| **Inter-System / Tokens** | Accidental client-side exposure of `GEMINI_API_KEY` | Zero-hardcoded credentials; server-side Express API proxying with Google Cloud Secret Manager integration. |

---

## 🚀 Google Cloud Run Deployment & Verification

### 1. Prerequisites
- Google Cloud CLI (`gcloud`) installed and authenticated:
  ```bash
  gcloud auth login
  gcloud config set project YOUR_GCP_PROJECT_ID
  ```
- Enable required Google Cloud APIs:
  ```bash
  gcloud services enable run.googleapis.com secretmanager.googleapis.com firestore.googleapis.com
  ```

### 2. Secret Management Setup
Store your Gemini API key in Google Cloud Secret Manager and grant Cloud Run access:

```bash
# Create the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# Add your Gemini API key
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Grant default Cloud Run compute service account access
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 3. Cloud Run Deployment
Deploy the containerized full-stack application to Cloud Run with automatic Secret Manager binding:

```bash
gcloud run deploy personal-gemini-journal \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --port 3000
```

### 4. Challenge Verification Resource Labeling
Apply the mandatory social challenge campaign label to your Cloud Run service:

```bash
gcloud run services update personal-gemini-journal \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 🧪 Comprehensive Functional Test Walkthrough

| Test Case | Steps to Execute | Expected Behavior |
|---|---|---|
| **1. Authentication & Profile Setup** | 1. Navigate to `/login`<br>2. Click **"Sign In with Google"** | Authenticates user via Firebase Auth, initializes Firestore profile under `/users/{uid}`, sets streak counter to 1, and redirects to `/dashboard`. |
| **2. Draft Recovery & Real-Time Cache** | 1. Open `/journal/new`<br>2. Type title and content<br>3. Refresh the browser tab | Unsaved content is restored from browser `localStorage` draft cache with an indicator badge. |
| **3. Journal Persistence & AI Reflection** | 1. Select mood (e.g., `Reflective`) and add tag `#learning`<br>2. Click **"Save & Generate Reflection"** | Saves entry to Firestore, calls `/api/gemini/reflect`, generates structured reflection card (Themes, Observation, Inquiries, Next Step), and logs timeline milestone. |
| **4. Multi-Turn Journal Workspace Chat** | 1. Open any saved journal<br>2. Click **"Brainstorm Ideas"** or **"Extract Action Items"**<br>3. Type a follow-up question in the chat input | Gemini responds in multi-turn context grounded specifically in the journal text. |
| **5. Convert Insight to SMART Goal** | 1. On reflection card or chat output, click **"Convert to Smart Goal"**<br>2. Review generated title and tasks<br>3. Click **"Save Goal"** | Creates a new SMART Goal in `/goals` with sub-task checklist and 0% progress meter. |
| **6. Goal Progression & Confetti Trigger** | 1. Navigate to `/goals`<br>2. Check off all sub-tasks | Dynamic progress meter updates to 100%, status changes to `Completed`, confetti animation fires, and completion milestone is recorded. |
| **7. Cross-Entry Pattern Recognition** | 1. On `/dashboard`, click **"Discover Thought Patterns"** | Gemini analyzes recent journal history and displays recurring themes, frequency count, and growth insights with dismissal controls. |
| **8. Journey Timeline** | 1. Navigate to `/journey` | Displays a reverse-chronological visual stream of journals written, reflections synthesized, and goals achieved. |
| **9. Search & Filtering** | 1. Navigate to `/search`<br>2. Type keywords or select tag pills | Instant filtering across titles, content, tags, summaries, and reflection themes. |
| **10. Analytics & Data Portability** | 1. Open `/insights` to inspect mood and tag distributions<br>2. Open `/settings` and click **"Export JSON"** | Downloads complete offline JSON archive containing all user journals and goals. |

---

## 📄 License
Apache-2.0 License. Built for the Google Cloud Run Build & Deploy Social Challenge.

