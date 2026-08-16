# PhishGuard AI - Architecture

## High-Level Overview

PhishGuard AI is an adaptive, AI-driven cybersecurity training platform. It uses a modern tech stack (Next.js App Router, React 19, Auth.js) to deliver personalized phishing scenarios to users, validating their security awareness dynamically.

### Core Modules

1. **Adaptive Learning Engine (`lib/adaptive-engine.ts`)**
   The heart of the personalization. It analyzes a user's past performance (stored in `user_performance`) to select the next scenario category and difficulty. If a user struggles with "Urgency Language", the engine increases the likelihood of serving scenarios featuring that indicator.

2. **Generative AI Pipeline (`lib/ai/`)**
   Uses Google's Gemini (via `@google/generative-ai`) to craft realistic emails on the fly. We use `responseSchema` (structured outputs) to enforce a rigid JSON schema, ensuring we always get the expected fields (`subject`, `body`, `indicators`, `is_phishing`, etc.).

3. **Deterministic Validation Layer (`lib/services/validation.service.ts`)**
   AI models can hallucinate or generate illogical combinations. This module ensures the generated scenario is sane before it reaches the user. It checks that indicators align with the `is_phishing` flag and validates lengths and formatting. If validation fails repeatedly, a pre-validated fallback scenario is served from the database.

4. **Data Access Layer (`lib/db/`)**
   Built on `kysely` for type-safe SQL query generation. We bypass heavy ORMs for performance and precise SQL control. We interact directly with a MySQL 8.4 database.

5. **Authentication (`lib/auth/`)**
   Handled by NextAuth.js (v5 Beta). We use a custom credentials provider using bcrypt for password hashing and a lightweight Kysely adapter for session management.

## Schema Design

The schema avoids unstructured JSON blobs in favor of normalized relational data:
- `users`: Core identity and roles (admin vs user).
- `categories`: Thematic areas like "Invoice", "Password Reset".
- `difficulty_levels`: "Beginner", "Intermediate", "Advanced".
- `scenarios`: Stores generated or fallback emails.
- `scenario_indicators`: Many-to-many relationship linking a scenario to specific indicators (e.g., `domain_mismatch`).
- `training_sessions` & `user_attempts`: Tracks when and how a user responds to a scenario.
- `user_performance` & `user_skills`: Rolled-up metrics used by the Adaptive Engine.
- `validation_results`: Audit trail for AI generation pipeline health.

## Security Considerations

1. **Anti-Cheat in API**: The `/api/scenarios/[id]` route strips the ground-truth `is_phishing` and `explanation` flags from the payload sent to the client, preventing users from inspecting network traffic to cheat.
2. **Server Components**: We use React Server Components heavily, keeping sensitive database logic (and API keys) strictly on the server.
3. **Password Security**: Standard `bcryptjs` hashing with a high cost factor (12 rounds) is used for all stored credentials.
