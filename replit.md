> ⚠️ **STALE BUILD — this folder is the deprecated secondary build. The canonical build is `../Ora-Suites Website/`. Do not edit this folder.** The "MemStorage (development)" framing below understates a production gap: contact submissions are not persisted in the canonical build either (verify in its `server/storage.ts`). *(Banner added 2026-07-06.)*

# ORÁ Suites Website

## Overview

ORÁ Suites is a premium website for Manchester's women-only beauty and wellness sanctuary. The platform serves a dual-revenue business model combining direct beauty services (aesthetics, nails, hair, laser treatments) with professional treatment room rentals for practitioners. The design philosophy emphasizes refined luxury, warmth, and emotional connection rather than clinical or transactional aesthetics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with custom design tokens for brand colors (ora-milk, ora-sand, ora-bone, ora-smoke, ora-fog, ora-taupe, ora-greige)
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Animations**: Framer Motion for smooth transitions and scroll-triggered animations
- **Typography**: Playfair Display (serif headings) + Inter (sans-serif body)

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful endpoints under `/api` prefix
- **Build Tool**: esbuild for server bundling, Vite for client

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Validation**: Zod schemas generated from Drizzle schemas via drizzle-zod
- **Current Storage**: In-memory storage (MemStorage class) with interface ready for database migration

### Project Structure
```
├── client/           # React frontend
│   ├── src/
│   │   ├── components/  # UI components (layout, home sections, shadcn/ui)
│   │   ├── pages/       # Route pages
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utilities and query client
├── server/           # Express backend
│   ├── index.ts      # Server entry point
│   ├── routes.ts     # API route definitions
│   ├── storage.ts    # Data storage abstraction
│   └── vite.ts       # Vite dev server integration
├── shared/           # Shared code between client/server
│   └── schema.ts     # Drizzle schema definitions
└── attached_assets/  # Brand assets and images
```

### Key Design Decisions

1. **Monorepo Structure**: Single repository with shared TypeScript code between frontend and backend, enabling type-safe API contracts.

2. **Storage Abstraction**: IStorage interface allows swapping between MemStorage (development) and database-backed storage without code changes.

3. **Component Architecture**: Section-based homepage composition (HeroSection, ServicesOverviewSection, etc.) for maintainability and clear content boundaries.

4. **SEO Optimization**: Custom useSEO hook for dynamic meta tag management per page.

5. **Brand-First Design System**: Extended Tailwind config with brand-specific colors and typography rather than generic defaults.

## External Dependencies

### Database
- **PostgreSQL**: Primary database (configured via DATABASE_URL environment variable)
- **Drizzle Kit**: Database migrations and schema push (`npm run db:push`)
- **connect-pg-simple**: Session storage for PostgreSQL

### UI Libraries
- **Radix UI**: Accessible component primitives (dialog, dropdown, tabs, etc.)
- **Framer Motion**: Animation library for page transitions and scroll effects
- **Lucide React**: Icon library
- **Embla Carousel**: Carousel/slider functionality

### Form Handling
- **React Hook Form**: Form state management
- **@hookform/resolvers**: Zod integration for form validation

### Development Tools
- **Vite**: Frontend build tool with HMR
- **tsx**: TypeScript execution for development server
- **Replit plugins**: Runtime error overlay, cartographer, dev banner