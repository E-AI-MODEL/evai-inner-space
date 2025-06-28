# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/68e54058-4e8d-4ef2-86eb-7ad636513683

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/68e54058-4e8d-4ef2-86eb-7ad636513683) and start prompting.

All synchronization happens through [lovable.dev](https://lovable.dev), and changes made via Lovable will be committed automatically to this repo.

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

Create a `.env` file based on `.env.example` and add your Supabase credentials. **All four variables below are mandatory.** They can be found in the Supabase dashboard under **Settings → API** as the *Project URL* and *anon public key*:

```
VITE_SUPABASE_URL=<YOUR_SUPABASE_URL>
VITE_SUPABASE_ANON_KEY=<YOUR_SUPABASE_ANON_KEY>
SUPABASE_URL=<YOUR_SUPABASE_URL>
SUPABASE_ANON_KEY=<YOUR_SUPABASE_ANON_KEY>
```
These variables are required for both the frontend and Node scripts to connect
to your Supabase project.

`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are used by the browser code,
while `SUPABASE_URL` and `SUPABASE_ANON_KEY` are used by Node scripts. The value
for each pair should be identical.

Example Node usage:

```ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL as string
const supabaseKey = process.env.SUPABASE_ANON_KEY as string
const supabase = createClient(supabaseUrl, supabaseKey)
```

When running inside Lovable at [lovable.dev](https://lovable.dev) set `LOVABLE_DEV_SERVER=true` in your `.env` file so the development server integrates with the online environment.

### API Keys

OpenAI and vector API keys are entered through the configuration panels in the
UI. They live only on the frontend and are stored in your browser's
`localStorage` under the names `openai-api-key`, `openai-api-key-2` and
`vector-api-key`. Environment variables such as `API_1_KEY`, `API_2_KEY` and
`API_3_KEY` are no longer used.

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

### Supabase authentication

The application uses Supabase Auth to manage user accounts. New visitors should
first create an account via the **Sign Up** form. Attempting to log in without a
registered or verified account will fail.

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
