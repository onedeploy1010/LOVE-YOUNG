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

Database tables include:
- **Core**: users, products, testimonials, contact_messages, orders
- **Member System**: members, member_addresses, member_points_ledger
- **Partner System (联合经营人)**: partners, ly_points_ledger, cash_wallet_ledger, bonus_pool_cycles, monthly_cashback_tracking, rwa_token_ledger, withdrawal_requests
- **ERP System**: inventory, inventory_ledger, purchase_orders, production_batches, hygiene_inspections, cold_chain_shipments, cost_records, bills, suppliers

### Partner System Architecture
The partner (联合经营人) system supports:
- **3-Tier Packages**: Phase 1 (RM 1000/2000 LY), Phase 2 (RM 1300/2600 LY), Phase 3 (RM 1500/3000 LY)
- **Referral System**: 8-character unique referral codes, 10-level deep network (planned)
- **LY Points**: Tracked via auditable ledger entries, not direct balance updates
- **Cash Wallet**: For cashback and withdrawal functionality
- **RWA Tokens**: 10-day bonus pool cycles with 30% of sales allocated

Key API Endpoints:
- `GET /api/partner/profile` - Get current user's partner profile
- `POST /api/partner/join` - Join partner program (requires auth)
- `GET /api/partner/ly-ledger` - LY points transaction history
- `GET /api/partner/cash-ledger` - Cash wallet transaction history
- `GET /api/partner/referral-stats` - Referral network statistics
- `GET /api/partner/current-cycle` - Current bonus pool cycle info
- `GET /api/admin/partners` - Admin: list all partners
- `POST /api/admin/partners/:id/activate` - Admin: activate partner
- `GET /api/admin/dashboard-stats` - Admin: dashboard statistics

### Site Pages
- `/` - Landing page with hero, brand teaser, products showcase, RWA preview
- `/brand` - Brand story page with founder story, brand values, milestones, community
- `/products` - Products catalog with filtering tabs (燕窝/花胶/礼盒), pricing, order buttons
- `/partner` - RWA partner program page with 3 tiers, revenue calculator, FAQ
- `/member` - Member center with role-based navigation (用户/会员/经营人/管理员)
- `/partner/dashboard` - Partner dashboard for active partners
- `/admin` - Admin dashboard

### Design System
The project follows specific design guidelines documented in `design_guidelines.md`:
- Typography: Noto Sans SC (Chinese) + Playfair Display (English headings)
- Color scheme: Emerald green (primary) + Gold (secondary) - "逆风启航" theme
- Layout: Mobile-first with max-w-7xl container
- Components: Clean, luxury aesthetic with generous spacing

### Image Assets
Product and brand images are stored in `client/public/pics/`:
- Brand identity and storyboard images
- Event and community photos
- Wellness and lifestyle imagery

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