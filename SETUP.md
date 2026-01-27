# Psychophant Setup Guide

This guide will help you get Psychophant running locally with OpenRouter for AI responses.

## Prerequisites

- Node.js 20+
- Docker (for PostgreSQL and Redis)
- An OpenRouter account with API key

## Quick Start

### 1. Start Database Services

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Verify they're running
docker-compose ps
```

### 2. Get Your OpenRouter API Key

1. Go to [OpenRouter](https://openrouter.ai/)
2. Sign up or log in
3. Navigate to [API Keys](https://openrouter.ai/keys)
4. Click "Create Key"
5. Copy the key (starts with `sk-or-...`)

### 3. Configure Environment Variables

**packages/api/.env:**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/psychophant"
REDIS_URL="redis://localhost:6379"
OPENROUTER_API_KEY="sk-or-your-key-here"
JWT_SECRET="psychophant-dev-secret-key-change-in-production-123456"
JWT_EXPIRES_IN="7d"
APP_URL="http://localhost:3000"
API_URL="http://localhost:3001"
NODE_ENV="development"
```

**packages/orchestration/.env:**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/psychophant"
REDIS_URL="redis://localhost:6379"
OPENROUTER_API_KEY="sk-or-your-key-here"
APP_URL="http://localhost:3000"
API_URL="http://localhost:3001"
NODE_ENV="development"
```

**packages/web/.env.local:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 4. Initialize Database

```bash
# Generate Prisma client and push schema
cd packages/api
npx prisma generate
npx prisma db push
```

### 5. Start All Services

You need to run three services in separate terminals:

**Terminal 1 - API Server:**
```bash
npm run dev -w @psychophant/api
```

**Terminal 2 - Orchestration Worker:**
```bash
npm run dev -w @psychophant/orchestration
```

**Terminal 3 - Web Frontend:**
```bash
npm run dev -w @psychophant/web
```

### 6. Access the App

Open http://localhost:3000 in your browser.

1. Register a new account
2. Create some agents (pick models from OpenRouter)
3. Start a conversation!

---

## OpenRouter Model Selection

When creating agents, you can choose from hundreds of models. Some popular choices:

### Fast & Cheap
- `openai/gpt-4o-mini` - Great balance of speed and quality
- `google/gemini-flash-1.5` - Very fast, good for quick responses
- `meta-llama/llama-3.1-70b-instruct` - Fast open-source option

### High Quality
- `anthropic/claude-sonnet-4` - Excellent for nuanced conversations
- `openai/gpt-4o` - Strong reasoning capabilities
- `anthropic/claude-3.5-sonnet` - Great for detailed analysis

### Budget-Friendly
- `meta-llama/llama-3.1-8b-instruct` - Very cheap, decent quality
- `google/gemini-flash-1.5-8b` - Extremely affordable

The model list in the agent creation form is fetched directly from OpenRouter's API, so you'll always see the latest available models with their pricing.

---

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Web (Next.js) │────▶│   API (Fastify) │────▶│   PostgreSQL    │
│   localhost:3000│     │   localhost:3001│     │   localhost:5432│
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 │ BullMQ Jobs
                                 ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │  Orchestration  │────▶│     Redis       │
                        │     Worker      │     │   localhost:6379│
                        └────────┬────────┘     └─────────────────┘
                                 │
                                 │ SSE Events (via Redis Pub/Sub)
                                 ▼
                        ┌─────────────────┐
                        │   OpenRouter    │
                        │      API        │
                        └─────────────────┘
```

### How It Works

1. **User creates a conversation** → API stores it in PostgreSQL
2. **User starts conversation** → API adds a job to BullMQ (via Redis)
3. **Orchestration worker picks up job** → Calls OpenRouter API
4. **OpenRouter streams response** → Worker publishes SSE events to Redis
5. **API SSE endpoint** → Subscribes to Redis and forwards to browser
6. **Browser updates UI** → Real-time streaming display

---

## Troubleshooting

### "Internal Server Error" on API calls

1. Check if PostgreSQL is running: `docker-compose ps`
2. Check if database exists: `docker exec -it psychophant-postgres psql -U postgres -c '\l'`
3. Run migrations: `cd packages/api && npx prisma db push`

### "Redis is required for conversation orchestration"

Redis must be running for conversations to work:
```bash
docker-compose up -d redis
```

### OpenRouter "401 Unauthorized"

Your API key is invalid or not set:
1. Check `packages/orchestration/.env` has `OPENROUTER_API_KEY`
2. Verify the key at https://openrouter.ai/keys
3. Make sure the key starts with `sk-or-`

### Conversations not progressing

Make sure the orchestration worker is running:
```bash
npm run dev -w @psychophant/orchestration
```
You should see "Orchestration worker started" in the console.

### SSE events not reaching browser

1. Check Redis is running
2. Check API logs for subscription errors
3. Verify CORS allows your frontend URL

---

## Development Commands

```bash
# Build all packages
npm run build

# Type check
npm run typecheck

# Lint
npm run lint

# Reset database
cd packages/api
npx prisma db push --force-reset

# View database (Prisma Studio)
cd packages/api
npx prisma studio
```

---

## Adding Credits (Development)

In development, users get free daily credits. To add more:

```sql
-- Connect to PostgreSQL
docker exec -it psychophant-postgres psql -U postgres -d psychophant

-- Add 1000 cents ($10) to a user
UPDATE "CreditBalance"
SET "purchased_credits_cents" = "purchased_credits_cents" + 1000
WHERE "user_id" = 'your-user-id';
```

---

## Production Deployment

For production:

1. Use managed PostgreSQL (e.g., Supabase, Railway, Neon)
2. Use managed Redis (e.g., Upstash, Railway)
3. Set secure `JWT_SECRET`
4. Configure proper CORS origins
5. Set up Stripe for credit purchases (optional)

See the individual package READMEs for more deployment details.
