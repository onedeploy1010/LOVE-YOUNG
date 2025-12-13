# LOVEYOUNG E-commerce Website

## Overview

LOVEYOUNG is a premium e-commerce website for Bird's Nest (燕窝) and Fish Maw (花胶) products, targeting Chinese-speaking customers. The platform emphasizes luxury wellness branding with a mobile-first design approach, featuring product showcases, customer testimonials, and WhatsApp-based ordering integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with CSS variables for theming
- **UI Components**: shadcn/ui component library (Radix UI primitives)
- **Build Tool**: Vite with React plugin

The frontend follows a component-based architecture with:
- Reusable UI components in `client/src/components/ui/`
- Page components in `client/src/pages/`
- Custom hooks in `client/src/hooks/`
- Shared utilities in `client/src/lib/`

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Style**: RESTful JSON endpoints under `/api/`
- **Development**: Vite dev server with HMR proxied through Express

The server implements:
- Product catalog endpoints
- Testimonial retrieval
- Contact form submission
- Static file serving in production

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` (shared between client/server)
- **Validation**: Zod schemas generated via drizzle-zod
- **Development Fallback**: In-memory storage implementation in `server/storage.ts`

Database tables include: users, products, testimonials, contact_messages.

### Design System
The project follows specific design guidelines documented in `design_guidelines.md`:
- Typography: Noto Sans SC (Chinese) + Playfair Display (English headings)
- Color scheme: Premium neutral tones with primary accent (HSL 345)
- Layout: Mobile-first with max-w-7xl container
- Components: Clean, luxury aesthetic with generous spacing

## External Dependencies

### Third-Party Services
- **WhatsApp Business**: Primary customer communication channel (deep linking)
- **Meta Shop**: Facebook/Instagram shop integration for orders

### Key NPM Packages
- **UI**: Radix UI primitives, Lucide icons, react-icons, embla-carousel
- **Forms**: react-hook-form with @hookform/resolvers
- **Database**: drizzle-orm, pg (PostgreSQL client)
- **Session**: connect-pg-simple, express-session

### Fonts (External)
- Google Fonts: Noto Sans SC, Playfair Display

### Build & Development
- Vite for frontend bundling
- esbuild for server bundling
- Replit-specific plugins for development experience