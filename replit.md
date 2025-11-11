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
6. **Users** - Student/consumer accounts with profile information
7. **UserPreferences** - Food preferences and recommendation parameters
8. **CampusBlocks** - Campus locations with GPS coordinates
9. **DeliveryRequests** - Food delivery orders with status tracking
10. **DeliveryPersons** - Student delivery providers with availability
11. **Earnings** - Delivery earnings and transaction history
12. **Vouchers** - Reward vouchers for platform usage

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

**November 11, 2025 - Campus Food Delivery Order System**
- **Order Food with Delivery**: Complete food ordering system with campus delivery
  - Browse all canteen stalls with queue status, ratings, and cuisine types
  - Place orders with items and food total
  - Select campus delivery location (7 campus blocks)
  - Peak hour detection (11:30-13:30, 17:30-19:30 SGT): $2.00 delivery fee vs $1.50 off-peak
  - Visual peak hour notice when applicable
- **Server-Side Security**:
  - Server-authoritative pricing: All delivery fees calculated server-side (cannot be tampered)
  - Input validation: Food total range ($0.01-$1000), stall ID, delivery block existence checks
  - XSS prevention: HTML entity encoding for all user inputs (foodItems, locations)
  - Max length enforcement: 500 character limit on text inputs
  - Peak hour determined from server time only (UTC+8 for Singapore)
- **API Endpoints**:
  - POST /api/delivery-requests - Create delivery order with server-calculated pricing
  - GET /api/delivery-requests/pending - List pending deliveries (for delivery persons)
  - GET /api/delivery-requests/customer/:customerId - Customer's order history
  - PATCH /api/delivery-requests/:id/accept - Accept delivery request
  - PATCH /api/delivery-requests/:id/status - Update delivery status
- **Navigation Integration**: Added "Order Food" link to main navigation
- **Known Limitations** (documented for future):
  - No authentication (uses demo_user account)
  - No CSRF protection
  - No rate limiting

**November 11, 2025 - Smart Stall Recommendations**
- **Smart Recommendation System**: Personalized stall suggestions based on user preferences and location
  - Weighted algorithm: 35% food preferences, 25% proximity, 20% queue time, 20% ratings
  - Hard filters for max queue time (30 min) and walking distance (500m)
  - Haversine distance calculation for GPS-based proximity
  - Jaccard similarity for cuisine preference matching
  - Visual score breakdowns with colored progress bars
  - Confidence levels based on available data
- **Campus Location System**: 7 campus blocks with GPS coordinates
  - Block selection with real-time location updates
  - Distance calculations from user location to canteens
  - Walking distance enforcement (stalls >500m filtered out)
- **User Preferences Management**: Customizable food preferences
  - Cuisine type selection (Chinese, Western, Japanese, etc.)
  - Dietary restrictions support
  - Queue and distance tolerance settings
- **API Endpoints**: Complete REST API for recommendations
  - GET /api/recommendations/:userId - Ranked stall recommendations
  - GET /api/campus-blocks - All campus locations
  - GET /api/users/:userId - User profile data
  - PATCH /api/users/:userId/location - Update user location
  - PATCH /api/users/:userId/preferences - Update preferences
- **Navigation Integration**: Added "Recommendations" link to all pages

**November 5, 2025 - Initial Features**
- **Queue Monitor Real-Time Updates**: Implemented live countdown for wait times
- **Food Rescue Reserve Functionality**: Full reservation system implemented
- Fixed WebSocket connectivity issue for Neon PostgreSQL database
- Application now fully functional with PostgreSQL database persistence