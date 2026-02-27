# Luma CSV Seed Kit

Seed approved Luma guests into the hackathon database so they can verify their email and create profiles.

## Setup

1. Install dependencies:
   ```
   pnpm install
   ```

2. Copy `.env.local.example` to `.env.local` and fill in your `POSTGRES_URL`:
   ```
   cp .env.local.example .env.local
   ```

3. Drop your Luma CSV export into this folder.

## Usage

```
npx tsx seed-from-csv.ts "Build - UCL AI Festival - Guests - approved - 2026-02-27-18-46-33.csv"
```

The script will:
- Parse the CSV and map columns to the `hackathon_participants` table
- Skip emails that already exist in the database
- Insert new participants with name, email, LinkedIn, website/GitHub, Luma ID, profile summary, and team status
- Print a summary of inserted/skipped rows

## What gets mapped

| CSV Column | DB Column |
|---|---|
| `api_id` | `luma_id` |
| `name` | `name` |
| `email` | `email` |
| `What is your LinkedIn profile?` | `linkedin` |
| `Link to personal website/github/portfolio` | `website_or_github` |
| `Are you applying as a team?` | `has_team` |
| Title + Org + Description + Skillset | `profile_summary` (auto-generated) |
