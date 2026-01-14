# API Hub

Internal API documentation management and mock service system.

## Tech Stack

- React 18 + TypeScript
- Vite
- TailwindCSS + shadcn/ui
- Supabase (Database + Edge Functions)
- React Query
- React Router v6

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Environment Setup

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Get your Supabase credentials from: https://supabase.com/dashboard/project/gujeqnmixjabgjsouceb/settings/api

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
```

## Project Structure

```
src/
├── components/        # React components
│   ├── ui/           # shadcn/ui components
│   └── Layout.tsx    # App layout with sidebar
├── pages/            # Page components
│   ├── ProjectsPage.tsx
│   ├── TasksPage.tsx
│   ├── DocsPage.tsx
│   └── ApiKeysPage.tsx
├── lib/              # Utilities
│   ├── supabase.ts   # Supabase client
│   └── utils.ts      # Helper functions
├── App.tsx           # Main app component
├── main.tsx          # Entry point
└── index.css         # Global styles
```

## Features

### Phase 1 (Completed)
- ✅ Database schema
- ✅ Mock API Edge Function
- ✅ Basic frontend structure

### Phase 2 (In Progress)
- [ ] Project list page
- [ ] Task board (kanban view)
- [ ] Create task functionality
- [ ] Mock API integration

### Phase 3 (Planned)
- [ ] Scalar API documentation
- [ ] API Key management
- [ ] Production deployment

## Mock API

The Mock API Edge Function is available at:

```
https://gujeqnmixjabgjsouceb.supabase.co/functions/v1/mock/{task_id}
```

Use `x-mock-scenario` header to switch between scenarios:
- `success` - Returns successful response
- `empty` - Returns empty data
- `error` - Returns error response

Example:

```bash
curl https://gujeqnmixjabgjsouceb.supabase.co/functions/v1/mock/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa \
  -H "x-mock-scenario: success"
```

## License

Private - JW PEI Internal Use Only
