# Wellness Evidence

A production-ready MVP for evidence-based wellness research. Search through thousands of peer-reviewed studies to get AI-powered answers with proper citations and evidence strength grading.

## Features

- **AI-Powered Search**: Advanced RAG (Retrieval-Augmented Generation) using OpenAI embeddings
- **Evidence Grading**: Automatic strength assessment (Strong/Moderate/Weak/Insufficient)
- **Proper Citations**: Inline numeric citations with reference lists
- **Vector Search**: pgvector-powered similarity search
- **Modern UI**: Built with Next.js, Tailwind CSS, and shadcn/ui
- **Production Ready**: Error boundaries, structured logging, and comprehensive error handling

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui, Lucide React icons
- **Database**: Supabase (PostgreSQL + pgvector)
- **AI**: OpenAI GPT-4o-mini, text-embedding-3-small
- **Deployment**: Vercel-ready with zero-config deployment

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd wellness-evidence
npm install
```

### 2. Environment Setup

Copy the example environment file and fill in your API keys:

```bash
cp .env.example .env.local
```

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `OPENAI_API_KEY`: Your OpenAI API key

### 3. Database Setup

Set up your Supabase database with the provided schema:

```bash
# Run the database setup script
npm run db:setup

# Seed with sample data
npm run seed
```

### 4. Development

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (marketing)/        # Marketing landing page
│   ├── app/                # Main search application
│   ├── api/                # API routes
│   │   ├── health/         # Health check endpoint
│   │   ├── ingest/         # Document ingestion endpoint
│   │   └── search/         # Search endpoint
│   └── layout.tsx          # Root layout with error boundary
├── components/             # React components
│   ├── ui/                 # shadcn/ui components
│   ├── ErrorBoundary.tsx   # Error boundary wrapper
│   ├── SearchBar.tsx       # Search input component
│   ├── ResultCard.tsx      # Document result display
│   ├── EvidenceBadge.tsx   # Evidence strength indicator
│   └── LoadingState.tsx    # Loading and error states
├── lib/                    # Core business logic
│   ├── db.ts              # Database connection and types
│   ├── rag.ts             # RAG service implementation
│   ├── openai.ts          # OpenAI service wrapper
│   ├── chunking.ts        # Text chunking utilities
│   ├── grading.ts         # Evidence grading logic
│   ├── logging.ts         # Structured logging
│   └── prompts.ts         # AI prompt templates
├── scripts/                # CLI utilities
│   ├── seed-database.ts    # Seed database with sample data
│   ├── ingest-pubmed.ts   # Ingest documents from PubMed
│   ├── reembed.ts         # Regenerate embeddings
│   ├── reset-database.ts  # Reset database
│   └── setup-database.ts  # Initialize database schema
└── types/                  # TypeScript type definitions
    └── index.ts           # Shared types
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript compiler
- `npm run seed` - Seed database with sample data
- `npm run ingest` - Ingest documents from PubMed
- `npm run reembed` - Regenerate embeddings
- `npm run db:reset` - Reset database
- `npm run db:setup` - Setup database schema

## API Endpoints

### Search
`POST /api/search`
```json
{
  "query": "Does meditation reduce anxiety?",
  "limit": 10,
  "filters": {
    "studyTypes": ["Meta-Analysis", "Randomized Controlled Trial"],
    "excludeConflicts": true
  }
}
```

### Health Check
`GET /api/health`
Returns system health status and configuration.

### Ingestion
`POST /api/ingest`
```json
{
  "source": "pubmed",
  "query": "meditation anxiety",
  "limit": 10
}
```

## Database Schema

The application uses three main tables:

- **documents**: Research papers with metadata
- **chunks**: Text chunks with vector embeddings
- **citations**: Citation tracking for answers

See `supabase-schema.sql` for the complete schema.

## Evidence Grading

Evidence strength is automatically graded based on:

- **Study Types**: Meta-analyses > RCTs > Observational studies
- **Sample Sizes**: Larger studies receive higher scores
- **Recency**: Newer studies are weighted more heavily
- **Conflicts of Interest**: Studies with conflicts receive lower scores
- **Consistency**: Consistent findings across studies increase strength

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

```bash
npm run build
npm run start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For questions or issues, please open a GitHub issue or contact the development team.