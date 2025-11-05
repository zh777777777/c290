# Food Rescue SG - Queue Monitor & Food Rescue Platform

## Overview

Food Rescue SG is a dual-purpose platform designed for Singapore students and consumers. It combines real-time school canteen queue monitoring with a food rescue marketplace that connects vendors with surplus food to consumers at discounted prices. The platform is built with pure Node.js and EJS templates (NOT React) for server-side rendering.

**Core Features:**
- Real-time canteen queue monitoring with wait time estimates
- Food rescue marketplace for surplus food listings
- Vendor management and ratings system
- Admin dashboard with full CRUD operations
- Server-side rendered EJS templates for optimal performance

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **React** with TypeScript for type-safe component development
- **Vite** as the build tool and development server
- **Wouter** for client-side routing
- **TanStack Query** for server state management and data fetching
- **shadcn/ui** component library built on Radix UI primitives
- **Tailwind CSS** for styling with Material Design principles

**Design System:**
- Mobile-first responsive design approach
- Material Design patterns adapted for Singapore-centric use cases
- Typography: Inter (body) and DM Sans (headings) via Google Fonts
- Consistent spacing using Tailwind's scale (2, 4, 6, 8, 12, 16)
- Custom color system using CSS variables for theme support
- Component variants using class-variance-authority for consistency

**State Management:**
- TanStack Query handles all server state with automatic caching
- Query client configured with infinite stale time for stable data
- Custom query functions handle authentication (401) responses
- Toast notifications for user feedback via Radix UI Toast

### Backend Architecture

**Server Framework:**
- **Express.js** as the HTTP server
- **TypeScript** for type safety across the stack
- **EJS** templating engine for server-side rendered views
- Custom Vite middleware integration for development HMR

**Rendering Strategy:**
- Hybrid approach: Server-side rendering with EJS templates
- Client-side React app for interactive components
- Static asset serving for images and generated content
- Development mode uses Vite middleware for instant updates

**API Design:**
- RESTful API endpoints under `/api` prefix
- JSON request/response format
- Session-based state management
- Request logging middleware for debugging

### Data Storage

**Database:**
- **PostgreSQL** via Neon serverless database
- **Drizzle ORM** for type-safe database queries
- Schema-first approach with Drizzle migrations

**Data Models:**
1. **Canteens** - School canteen locations and metadata
2. **Stalls** - Individual food stalls with queue data and ratings
3. **Food Listings** - Surplus food items with pricing and availability
4. **Vendors** - Food rescue marketplace vendors with ratings
5. **Ratings** - User reviews for stalls and vendors

**Schema Features:**
- UUID-based primary keys for distributed systems
- Decimal precision for monetary values
- Timestamp tracking for food listing freshness
- Aggregate fields (rating, review count) for performance

**Fallback Storage:**
- In-memory storage implementation (MemStorage) for development/testing
- Implements same IStorage interface as database layer
- Allows running application without database provisioning

### Authentication & Authorization

**Current Implementation:**
- Session-based state management using connect-pg-simple
- PostgreSQL session store for persistence
- Express session middleware
- No explicit authentication system implemented yet (prepared for future addition)

**Design Decisions:**
- Session infrastructure ready for user authentication
- Cookie-based session tracking
- 401 handling in query client suggests future auth requirements

### External Dependencies

**Core Infrastructure:**
- **Neon Database** - Serverless PostgreSQL hosting
- **Google Fonts** - Typography (Inter, DM Sans)

**UI Component Libraries:**
- **Radix UI** - Unstyled, accessible component primitives (20+ components)
- **shadcn/ui** - Pre-styled component system built on Radix
- **Embla Carousel** - Carousel/slider functionality
- **cmdk** - Command palette component
- **Lucide React** - Icon library
- **React Day Picker** - Calendar/date selection
- **Recharts** - Data visualization (if needed)
- **Vaul** - Drawer/bottom sheet component

**Development Tools:**
- **Replit Plugins** - Development environment enhancements (cartographer, dev banner, runtime error overlay)
- **ESBuild** - Production bundling for server code
- **TSX** - TypeScript execution for development server

**Form & Validation:**
- **React Hook Form** - Form state management
- **Zod** - Runtime schema validation
- **@hookform/resolvers** - Integration between RHF and Zod
- **drizzle-zod** - Generate Zod schemas from Drizzle tables

**Utilities:**
- **clsx** & **tailwind-merge** - Conditional class name management
- **class-variance-authority** - Component variant system
- **date-fns** - Date manipulation and formatting

## Recent Changes

**November 5, 2025**
- Fixed WebSocket connectivity issue for Neon PostgreSQL database
- Successfully installed `ws` package required for Neon serverless WebSocket connections
- Configured `neonConfig.webSocketConstructor` to use ws module
- Application now fully functional with PostgreSQL database persistence
- Admin dashboard operational with all CRUD operations working