# Personal Gemini Journal — AI Reflection & Growth Workspace

> Built for the **Google Cloud Run Build & Deploy Social Challenge** using **Google AI Studio** and **Google Cloud Run**.

**Personal Gemini Journal** is an AI-powered reflection workspace and personal growth companion. Rather than acting as a standard conversational chatbot, it transforms raw journal entries into structured reflections, identifies recurring thought patterns over time, extracts actionable SMART goals, and tracks a chronological personal growth journey — all while maintaining complete privacy and tenant isolation in Cloud Firestore.

---

## 🌟 Core Product Experience

```
Write Journal ──▶ Structured Reflection ──▶ Recurring Patterns ──▶ SMART Goals ──▶ Journey Milestones
 (Mood + Tags)       (Themes + Inquiries)       (Cross-Entry AI)      (Action Tasks)     (Growth Timeline)
```

1. **Write & Reflect**: Draft thoughts with rich formatting, mood tagging, and automatic local-storage draft recovery. One-click synthesis generates core themes, reframing perspectives, follow-up inquiries, and actionable next steps.
2. **Multi-Turn Journal Chat Workspace**: Context-aware dialogue grounded exclusively in the selected journal entry, complete with Quick Prompts (Brainstorm Ideas, Extract Action Items, Summarize Key Points).
3. **Cross-Entry Recurring Thought Patterns**: Analyze past journals to surface repeating themes, potential cognitive loops, and suggested growth actions with pattern dismissal tracking.
4. **SMART Goals & Actionable Progress**: Convert insights directly into trackable goals with checklists, dynamic progress meters, and celebratory confetti on completion.
5. **My Journey Narrative Timeline**: Chronological stream of journals, reflections, goals established, and milestones achieved.
6. **Descriptive Analytics & Safety**: Visual mood distributions, tag frequencies, and streak metrics paired with non-diagnostic privacy disclaimers.

---

## 🛡️ Agentic Threat Model & Security Countermeasures

| Threat Zone | Identified Risk | Countermeasure Implemented |
|---|---|---|
| **Input Surfaces** | Prompt injection via untrusted journal text or malicious user chat input | Server-side prompt boundary isolation; system instructions instruct Gemini to treat user journal content strictly as plain data. |
| **Planning & Reasoning** | Unhandled API schema deviations or malformed model responses | Structured JSON schema formatting (`responseMimeType: 'application/json'`) with defensive parsing and type validation. |
| **Tool Execution** | API rate limits, model quota exhaustion (`429`, `503`) | Resilient model fallback ladder (`gemini-3.6-flash` → `gemini-3.1-flash-lite` → `gemini-flash-latest` → `gemini-3.7-flash`). |
| **Memory & State** | Cross-user data leakage and unauthorized database modifications | Cloud Firestore security rules with owner-bound access control (`request.auth.uid == userId`); zero-unauthorized public access. |
| **Inter-System / Tokens** | Accidental client-side exposure of `GEMINI_API_KEY` | Zero-hardcoded credentials; server-side Express API proxying for all Gemini API interactions. |

---

## 🔒 Firestore Security Rules

Deploy these rules to your Firebase project to enforce strict user data isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // User root document and profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Journals subcollection
      match /journals/{journalId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        
        // Chat messages within a journal
        match /messages/{messageId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }

      // Smart Goals subcollection
      match /goals/{goalId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      // Journey Milestones subcollection
      match /milestones/{milestoneId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      // Recurring Patterns subcollection
      match /patterns/{patternId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }

    // Deny all other access by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 🚀 Google Cloud Deployment & Verification

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

## 🧪 Functional Walkthrough & Test Guide

1. **Authentication Flow**:
   - Navigate to `/login` and sign in using Google Federated Identity.
   - Confirm user profile creation and initial streak counter initialized in Firestore.
2. **Journaling & Real-Time Draft Protection**:
   - Navigate to `/journal/new`.
   - Enter a title, mood (`Motivated`), and tags (`#career`, `#learning`).
   - Type journal content. Refresh the browser page to verify automatic draft restoration from local storage.
   - Click **Save & Generate Reflection**. Verify journal persistence in Firestore and structured reflection generation.
3. **Interactive Journal Workspace & Multi-Turn Chat**:
   - Open any journal from the dashboard or history.
   - Click quick-action buttons: **"Brainstorm Ideas"**, **"Extract Action Items"**, and **"Summarize Key Points"**.
   - Send custom follow-up questions in the chat panel. Verify streaming context is maintained.
4. **Smart Goals Conversion**:
   - On the reflection card or after extracting action items, click **"Convert to Smart Goal"**.
   - Navigate to `/goals` and check off individual action items.
   - Complete 100% of tasks to verify dynamic progress bar animation and celebratory confetti trigger.
5. **Pattern Detection Engine**:
   - On the Dashboard, click **"Discover Thought Patterns"**.
   - Verify Gemini analyzes your multi-entry history and provides synthesized recurring themes, triggers, and growth ideas.
6. **Data Portability**:
   - Navigate to `/settings`.
   - Click **"Export JSON"** to download an offline backup of all private entries and goals.

---

## 📄 License
Apache-2.0 License. Built for the Google Cloud Run Build & Deploy Social Challenge.
