# PhishGuard AI

An AI-Powered Phishing Simulation & Adaptive Awareness Platform.
Built as a B.Tech capstone project.

## Features

- **Generative AI Scenarios**: Creates realistic phishing and legitimate email training scenarios using Gemini AI.
- **Adaptive Engine**: Tracks user skills and dynamically adjusts the difficulty and category of the next scenario to target weaknesses.
- **Deterministic Validation Pipeline**: Ensures all AI-generated scenarios meet strict formatting and logic requirements before being presented to users. Fallback scenarios are used if validation fails repeatedly.
- **Rich Dashboard & Analytics**: Tracks user performance across multiple skill areas (e.g., Domain Mismatch, Urgency Language) and displays progress through interactive charts.
- **Admin Suite**: Comprehensive dashboard for viewing platform-wide analytics, user progress, and managing scenarios.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Database**: MySQL 8.4 (via Kysely query builder)
- **Authentication**: Auth.js (NextAuth v5)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **AI**: Google Gemini API (`@google/generative-ai`)

## Setup Instructions

### 1. Database Configuration
Ensure you have MySQL 8.4 installed and running locally.
Create a database named `phishguard`:
```sql
CREATE DATABASE IF NOT EXISTS phishguard;
```

### 2. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill out the variables in `.env.local`:
- `DATABASE_URL`: Your MySQL connection string (e.g., `mysql://root:password@localhost:3306/phishguard`)
- `AUTH_SECRET`: Generate one using `openssl rand -base64 32` or via https://generate-secret.vercel.app/32
- `GEMINI_API_KEY`: Get your free API key from [Google AI Studio](https://aistudio.google.com)

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Migrations & Seed Data
Initialize the database schema and populate it with initial categories, fallback scenarios, and demo users:
```bash
# Important: ensure DOTENV_CONFIG_PATH is set if running manually on Windows
npm run migrate
npm run seed:all
```

The demo seed creates the following users:
- **User A** (`usera@demo.local` / `Password123!`): Strong at URL/domain detection, weak at urgency/authority.
- **User B** (`userb@demo.local` / `Password123!`): Strong at urgency/authority, weak at URL/domain/attachments.
- **Admin** (`admin@demo.local` / `Admin123!`): Full admin dashboard access.

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

The application can be built for production:
```bash
npm run build
npm start
```
Note: Make sure to set production environment variables (e.g., `DATABASE_URL`, `AUTH_SECRET`, `GEMINI_API_KEY`, etc.) and ensure the database is properly migrated in the production environment.
