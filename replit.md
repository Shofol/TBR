# TubeBenderReviews - Replit Configuration

## Overview

TubeBenderReviews is a comprehensive review and comparison platform for tube bending equipment. The application provides expert reviews, detailed comparisons, and cost calculations to help users choose the best tube bender for their specific needs. Built as a full-stack TypeScript application with a modern React frontend and Express backend.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js 20+ with Express.js (minimum version required for vite.config.ts compatibility)
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Database Provider**: Neon serverless PostgreSQL
- **Session Management**: PostgreSQL-based sessions with connect-pg-simple
- **Development**: Hot module replacement via Vite integration

### Data Storage Solutions
- **Primary Database**: PostgreSQL (configured for Neon serverless)
- **Schema Management**: Drizzle Kit for migrations and schema evolution
- **In-Memory Storage**: Fallback MemStorage class for development/testing
- **Session Storage**: PostgreSQL-based session management

## Key Components

### Database Schema
- **tube_benders**: Core product information including ratings, specifications, and features
- **comparisons**: User-defined product comparison sets
- **cost_calculations**: TCO calculations based on usage patterns and timelines

### API Endpoints
- `GET /api/tube-benders` - Retrieve all tube benders
- `GET /api/tube-benders/:id` - Get specific tube bender details
- `GET /api/tube-benders/recommended` - Get recommended products

### Pages
- `/` - Home page with rotary draw bender reviews and comparison
- `/product/:id` - Individual product review pages
- `/comparison` - Side-by-side product comparison
- `/mandrel-benders` - Educational content about mandrel tube benders
- `/roll-benders` - Educational content about roll tube benders
- `/ram-benders` - Educational content about ram-style tube benders

### Core Features
1. **Product Reviews**: Detailed reviews with ratings, pros/cons, and specifications
2. **Comparison Engine**: Side-by-side product comparisons with filtering
3. **Cost Calculator**: TCO analysis based on usage patterns and timeline
4. **Responsive Design**: Mobile-first approach with adaptive layouts

## Data Flow

1. **Client Requests**: React components use TanStack Query to fetch data
2. **API Layer**: Express routes handle HTTP requests and business logic
3. **Storage Layer**: IStorage interface abstracts database operations
4. **Database**: PostgreSQL with Drizzle ORM for type-safe queries
5. **Response**: JSON data returned through standardized API responses

## External Dependencies

### UI and Styling
- **Radix UI**: Headless component primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography
- **Inter Font**: Typography via Google Fonts

### Development Tools
- **Vite**: Build tool with HMR and cartographer integration for Replit
- **ESBuild**: Production bundling for server-side code
- **TypeScript**: Type safety across the entire stack

### Database and Backend
- **Drizzle ORM**: Type-safe database operations
- **Neon**: Serverless PostgreSQL provider
- **Zod**: Runtime type validation and schema validation

## Deployment Strategy

### Development Environment
- Vite dev server serves the React application with HMR
- Express server runs with tsx for TypeScript execution
- Database migrations handled via `drizzle-kit push`

### Production Build
1. Frontend built with Vite to `dist/public`
2. Backend bundled with ESBuild to `dist/index.js`
3. Single Node.js process serves both static files and API routes
4. Database provisioned via environment variable `DATABASE_URL`

### Environment Configuration
- **NODE_ENV**: Controls development vs production behavior
- **DATABASE_URL**: PostgreSQL connection string (required)
- **REPL_ID**: Enables Replit-specific development features

## Changelog

```
Changelog:
- July 01, 2025. Initial setup
- July 01, 2025. Added price range clarification (dies/hydraulics included/separate)
- July 01, 2025. Added mandrel bender column to comparison table
- July 01, 2025. Added SEO sections for mandrel, roll, and ram-style benders
- July 01, 2025. Updated RogueFab bend angle specification to 195 degrees
- July 01, 2025. Created dedicated pages for mandrel, roll, and ram-style benders
- July 01, 2025. Removed biased language and converted to neutral educational links
- July 01, 2025. Removed opinion-based editorial content and added proper sourcing for factual claims
- July 01, 2025. Implemented transparent scoring algorithm replacing star ratings (legal protection)
- July 01, 2025. Added circular progress ring visual scoring with color-coding
- July 01, 2025. Fixed 113/100 scoring bug - rebalanced algorithm for fair competition
- July 01, 2025. Added "click for breakdown" links for scoring transparency
- July 01, 2025. Moved "(complete setup)" to table header for clarity
- July 01, 2025. Converted decimal measurements to fractions (2.375" → 2-3/8")
- July 01, 2025. Expanded to comprehensive 11-category scoring system (100 points total)
- July 01, 2025. Added Max Diameter & Radius Capacity, Die Selection & Shapes, Years in Business categories
- July 01, 2025. Updated scoring methodology page to match new 11-category algorithm with detailed explanations
- July 01, 2025. Added comprehensive filtering system with price, USA manufacturing, die availability, and bender type filters
- July 01, 2025. Implemented automatic sorting by scoring algorithm - highest rated products displayed first
- July 01, 2025. Added visual ranking indicators and clear sorting explanation to comparison table
- July 01, 2025. Fixed inconsistent price coloring - removed arbitrary highlighting for neutral display
- July 01, 2025. Created category editor for customizing "Best For" descriptions with admin interface
- July 01, 2025. Built immersive hero section with animated tube bending SVG and engaging value propositions
- July 01, 2025. Enhanced filter UX with clear instructions on how to apply filters by collapsing menu
- July 02, 2025. Removed all remaining synthetic star ratings from home page "In Depth Reviews" section
- July 02, 2025. Created comprehensive spam-proof contact form with honeypot fields, math verification, time tracking, and rate limiting
- July 02, 2025. Added professional contact page with manufacturer disclaimers and direct manufacturer contact links
- July 02, 2025. Moved category editor from home page to dedicated "Categories" tab in admin panel
- July 02, 2025. Hidden admin navigation button - admin panel now accessible only via direct URL (/admin)
- July 02, 2025. Created complete Apache deployment package with production build, security configurations, and comprehensive deployment documentation
- July 02, 2025. Updated scoring algorithm: Mandrel scoring now binary (4 points if available, 0 if not), added "Modular Clamping System" category (6 points for M6xx only), updated value scoring to use base price ranges
- July 02, 2025. Removed Calculator button from header navigation menu as requested
- July 02, 2025. Added comprehensive FTC and USPTO compliant legal disclaimers throughout site with dedicated legal page
- July 02, 2025. Added priceMin/priceMax fields to schema for admin editing capabilities
- July 02, 2025. Updated RogueFab M6xx pros to include fast lead times (1-2 weeks for standard dies)
- July 02, 2025. JD2 models already include die lead times in cons (4-6 week lead time per JD2.com)
- July 03, 2025. Fixed admin panel pricing edit functionality - pencil buttons now working properly
- July 03, 2025. Added priceMin/priceMax fields to all storage objects for TypeScript compliance
- July 03, 2025. Removed "not affiliated with manufacturers" text from footer as requested
- July 03, 2025. Added comprehensive editorial content controls to admin panel for S-bend definitions, mandrel explanations, and value proposition text editing
- July 07, 2025. Implemented robust authentication system with secure admin login, JWT tokens, bcrypt password hashing, rate limiting, account lockout protection, and comprehensive security middleware
- July 07, 2025. Added unified image management system with admin upload functionality for consistent product images across home page and product pages
- July 07, 2025. Protected all admin routes with authentication middleware and added logout functionality with user session management
- July 07, 2025. Updated admin email address to tbradmin@tubebenderreviews.com with API endpoint for email management
- July 07, 2025. Prepared complete GitHub deployment package with CI/CD workflows, Docker support, comprehensive documentation, and health check endpoints
- July 07, 2025. Created secure FastComet deployment package with CloudLinux/Apache configuration, eliminated all security risks, and provided comprehensive step-by-step deployment instructions for traditional web hosting
- July 23, 2025. Fixed authentication system - database was empty, created admin user with credentials (username: admin, password: admin123), fixed API call format in login forms, standardized token storage key, and verified JWT authentication flow working correctly
- July 23, 2025. Completed comprehensive debugging system with DiagnosticPanel, ErrorBoundary components, health check endpoints, and real-time monitoring in admin panel for production troubleshooting
- July 23, 2025. Resolved /admin 404 issue and configured NEON database for secure admin storage with user credentials (username: tbradmin, password: AEYOcBtBqR.K$X), switched from MemStorage to DatabaseStorage, added database seeding for tube bender data, fixed admin route accessibility
- July 23, 2025. Enhanced diagnostic system: removed all pop-ups, added "Complete Report" tab with color-coded user-readable format, one-click copy for sharing with ChatGPT/developers, comprehensive deployment diagnostics for third-party hosting (Node.js environment checks, file structure validation, fallback file detection)
- July 23, 2025. Fixed Smart Tube Bender Finder issues: changed budget scale max from $50k to $10k, removed confusing "+15 points" pill badges from step 2, fixed ProductCard undefined errors with safety checks, updated "Buyer's Guide" navigation to point directly to finder section
- July 23, 2025. Completed navigation fix: added smooth scrolling behavior to header navigation links, "Buyer's Guide" now properly scrolls to Smart Tube Bender Finder section, confirmed working by user
- July 23, 2025. Fixed authentication system - database was empty, created admin user with credentials (username: admin, password: admin123), fixed API call format in login forms, standardized token storage key, and verified JWT authentication flow working correctly
- July 23, 2025. Resolved admin panel save functionality - fixed JWT token authentication in API requests, all admin panel save buttons now working including pricing edits, product updates, and email settings
- July 23, 2025. Fixed pricing accuracy issue - updated RogueFab pricing from incorrect "$1,895-$2,695" to accurate "$1,105-$1,755" based on component breakdown, updated scoring algorithm to properly award value points for corrected pricing
- July 23, 2025. Fixed value scoring algorithm - updated scoring conditions to recognize corrected RogueFab pricing range ($1,105-$1,755) and properly award 16 points for improved value positioning
- July 23, 2025. Updated scoring badge color system - implemented simplified scale: 100%=Green, 75%+=Yellow with remaining percentages evenly distributed (0-24%=Gray, 25-49%=Red, 50-74%=Orange)
- July 23, 2025. Reverted comparison table circles to original color system (85+=Green, 75+=Blue, 65+=Yellow, else Red) while keeping updated badge colors, fixed badge display bug with custom CSS classes
- July 23, 2025. Matched TOTAL SCORE badge colors to comparison table circle colors for consistent visual experience across home page and price breakdown pages
- July 23, 2025. Implemented comprehensive cross-platform stability improvements - enhanced responsive design with multi-breakpoint system (xs/sm/md/lg/xl/2xl), smart device detection hook, adaptive table/card layouts for optimal viewing across mobile/tablet/desktop, touch-friendly interfaces, performance optimizations, accessibility improvements, and consistent visual branding across all devices
- July 23, 2025. Removed "Calculate Total Cost" button from product review pages as it was considered a risky feature to support
- July 23, 2025. Added optional high contrast banner system - admin can control site-wide announcements with customizable messages, colors, and visibility toggle, positioned between header and hero section, includes live preview and easy hide/show functionality
- July 24, 2025. Comprehensive FastComet deployment review and fixes - resolved critical port configuration for Passenger compatibility, enhanced database connection handling with proper validation and error reporting, fixed authentication system API error parsing, added CORS configuration for production domains, created environment variable validation system, added missing TypeScript dependencies, and created complete deployment package with documentation
- July 24, 2025. Second-pass third-party hosting stability improvements - implemented dynamic port assignment with hosting environment auto-detection, created comprehensive hosting optimization system with platform-specific configurations, added memory management for shared hosting environments, enhanced static file serving with multiple fallback locations, implemented graceful shutdown handling optimized per platform, created build validation and optimization tools, added production-specific error handling and monitoring systems
- July 24, 2025. Built comprehensive diagnostic system for FastComet deployment troubleshooting - created /__debug endpoint that works independently of main application, implemented real-time debug logging throughout system with port binding, authentication, routing, and performance diagnostics, added admin panel controls for debug mode toggling, created user-friendly HTML diagnostic reports with copy-to-clipboard functionality for sharing with developers, enabled debug mode by default with comprehensive error tracking and system monitoring
- July 29, 2025. Resolved Node.js version compatibility issue - identified that project requires Node.js 20+ due to import.meta.dirname usage in vite.config.ts, fixed workflow failure caused by downgrade to Node.js 18, documented architectural constraint requiring minimum Node.js 20 for build system compatibility
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```