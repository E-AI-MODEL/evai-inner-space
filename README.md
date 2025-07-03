
# EvAI Neurosymbolic Chatbot

Een geavanceerde, hybride AI-chatbot die neurosymbolische verwerking, zelflerend gedrag en een innovatief toegangsmechanisme combineert.

## 🎯 Kernfuncties

- **Neurosymbolische AI**: Combineert symbolische patronen met neurale netwerken
- **Hybride Besluitvorming**: Gebruikt meerdere AI-engines voor optimale responses
- **Zelflerend**: Leert van gebruikersinteracties en genereert nieuwe kennisstructuren
- **Easter Egg Toegang**: Innovatieve toegangsbeveiliging zonder traditionele login

## 🔑 Toegang tot de Applicatie

De applicatie gebruikt een uniek "easter egg" toegangsmechanisme:

1. Open de applicatie - je ziet de intro-animatie met het 💙 hart-icoon
2. Klik **3 keer snel** op het hart-icoon (binnen 2 seconden)
3. De toegang wordt geactiveerd en je krijgt toegang tot de chat
 
Dit mechanisme dient als een interactieve startknop voor de demo.

## 🛠️ Setup Instructies

### 1. Environment Variabelen

Maak een `.env` bestand aan met:

```env
VITE_SUPABASE_URL=https://ngcyfbstajfcfdhlelbz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nY3lmYnN0YWpmY2ZkaGxlbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNjI5NDcsImV4cCI6MjA2NDYzODk0N30.MkZRcC_HGNTZW3hUvFiNmHY5Px9FPvRmnzAiKTWi9e4
SUPABASE_URL=https://ngcyfbstajfcfdhlelbz.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nY3lmYnN0YWpmY2ZkaGxlbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNjI5NDcsImV4cCI6MjA2NDYzODk0N30.MkZRcC_HGNTZW3hUvFiNmHY5Px9FPvRmnzAiKTWi9e4
```

### 2. API Keys Configuratie

Na toegang tot de applicatie, configureer je API keys via de instellingen:

- **OpenAI API Key 1**: Primaire AI-engine voor tekstgeneratie
- **OpenAI API Key 2**: Secundaire analyse voor neurosymbolische verwerking  
- **Vector API Key**: Voor embedding-gebaseerde zoekopdrachten

### 3. Installatie

```bash
# Kloon de repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Installeer dependencies
npm install

# Start development server
npm run dev
```

## 🧠 Neurosymbolische Architectuur

### Hybrid Decision Engine

De applicatie gebruikt een drielaagse besluitvormingsarchitectuur:

1. **Symbolische Engine**: Pattern matching op basis van vooraf gedefinieerde regels
2. **Advanced Seed Matcher**: Database-gebaseerde emotie-matching met embeddings
3. **Neural Engine**: OpenAI GPT-modellen voor complexe tekstverwerking

### Regisseur-Stem Pipeline

1. **API 2 - Regisseur** analyseert het bericht op basis van rubrieken en seeds
   en genereert een gestructureerde `StrategicBriefing` in JSON.
2. **API 1 - Stem** krijgt deze briefing als verborgen instructie en formuleert
   het uiteindelijke antwoord voor de gebruiker.
3. De briefing wordt opgeslagen in de metadata zodat het Admin Dashboard en de
   AI Transparency tooltip de ruwe analyse kunnen tonen.

### Zelflerend Mechaniek

- **Feedback Loop**: Duimpje omhoog/omlaag wordt opgeslagen en gebruikt voor optimalisatie
- **Automatic Seed Generation**: Nieuwe conversatiepatronen worden automatisch omgezet in herbruikbare "seeds"
- **Pattern Recognition**: Het systeem leert nieuwe emotionele patronen uit gesprekken

### Data Architectuur

```
unified_knowledge (Gecombineerde kennisbank)
├── emotion_seeds (Emotionele response-patronen)
├── vector_embeddings (Semantische zoekindex)
├── decision_logs (Besluitvormingsgeschiedenis)
└── seed_feedback (Gebruikersfeedback voor leren)
```

## 🎛️ Admin Dashboard

Toegankelijk via `/admin` - bevat:

- **Systeemstatus**: Real-time monitoring van alle AI-engines
- **Seed Management**: Beheer emotionele response-patronen
- **Analytics**: Prestatiemetrics en usage patterns
- **Configuration**: API key management en systeem-instellingen

## 🔧 Development

### Belangrijke Componenten

- `useUnifiedDecisionEngine`: Kern hybride AI-logic
- `NeurosymbolicVisualizer`: Real-time analyse-visualisatie
- `useAuth`: Easter egg toegangsmechanisme
- `RubricsToggleControl`: Analytics aan/uit schakelaar

### Testing

```bash
# Run tests
npm test

# Test Supabase connection
# Via Admin Dashboard -> Systeem tab -> "Test Supabase"
```

### Linting

Run the linter after installing dependencies to avoid errors like `Cannot find package '@eslint/js'`:

```bash
# Install dependencies (only needed once after cloning)
npm install

# Run lint checks
npm run lint
```

## 📋 Technische Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Shadcn/UI
- **Backend**: Supabase (PostgreSQL, Auth, Functions)
- **AI**: OpenAI GPT-4, Vector Embeddings
- **State Management**: React Query, Context API
- **Build Tool**: Vite

## 🚀 Deployment

```bash
# Build voor productie
npm run build

# Preview build
npm run preview
```

De applicatie is geoptimaliseerd voor deployment op Vercel, Netlify, of andere static hosting platforms.

## 🔒 Beveiliging

- **Anonymous User Model**: Alle database-operaties gebruiken een vast, anoniem user ID
- **API Key Encryption**: Keys worden veilig opgeslagen in localStorage
- **Rate Limiting**: Ingebouwde bescherming tegen misbruik
- **Easter Egg Access**: Verhindert ongeautoriseerde toegang tot de demo

## 📈 Prestatie

- **Lazy Loading**: Componenten worden dynamisch geladen
- **Code Splitting**: Optimale bundle-grootte
- **Caching**: React Query voor efficiente data-fetching
- **Hybrid Processing**: Intelligente fallback-strategieën

## 🐛 Troubleshooting

### Veelvoorkomende Problemen

1. **Toegang werkt niet**: Zorg ervoor dat je precies 3x klikt binnen 2 seconden
2. **API Errors**: Controleer API keys in instellingen
3. **Database Errors**: Verificeer Supabase verbinding in Admin Dashboard

### Debug Mode

Voeg `?debug=true` toe aan de URL voor uitgebreide console logging.

## 📞 Ondersteuning

Voor technische ondersteuning of vragen over de neurosymbolische architectuur, raadpleeg de documentatie in `/admin/guide`.

---

**EvAI - Waar symbolische intelligentie en neurale netwerken samenkomen** 🧠💙
