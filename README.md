# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/68e54058-4e8d-4ef2-86eb-7ad636513683

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/68e54058-4e8d-4ef2-86eb-7ad636513683) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

Create a `.env` file based on `.env.example` and provide your Supabase credentials:

```
VITE_SUPABASE_URL=https://ngcyfbstajfcfdhlelbz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nY3lmYnN0YWpmY2ZkaGxlbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNjI5NDcsImV4cCI6MjA2NDYzODk0N30.MkZRcC_HGNTZW3hUvFiNmHY5Px9FPvRmnzAiKTWi9e4
```

### Supabase setup

Create the required tables and functions in your Supabase project. The full
schema, including RLS policies and indexes, is documented in
`docs/supabase.sql`.
After setting up the tables you can import rubric JSON files with:

```bash
node scripts/importRubrics.ts
```

### Checking Supabase integration

Open the Admin Dashboard and navigate to the **Systeem** tab. Use the `Test Supabase` button to perform a quick query and verify that data can be fetched. The result will be shown in the UI and the retrieved row is logged in the browser console.

User feedback on messages is stored in the `seed_feedback` table.

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/68e54058-4e8d-4ef2-86eb-7ad636513683) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
