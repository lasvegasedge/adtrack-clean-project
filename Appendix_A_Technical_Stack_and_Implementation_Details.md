# Appendix A: Technical Stack and Implementation Details

## Technology Stack Overview

### Frontend Technologies
- **Framework**: React.js with TypeScript
- **State Management**: TanStack React Query for server state, React Context for local state
- **Routing**: wouter for lightweight client-side routing
- **UI Components**: Radix UI for accessible design primitives
- **Styling**: Tailwind CSS with custom theme configuration
- **Forms**: react-hook-form with zod validation
- **Data Visualization**: recharts for ROI and performance charts
- **Animations**: framer-motion for UI animations, lottie-react for complex animations
- **Drag & Drop**: @dnd-kit/core and @dnd-kit/sortable for the campaign visualizer

### Backend Technologies
- **Runtime**: Node.js with Express
- **API**: RESTful endpoints with JSON response format
- **Authentication**: Passport.js with session-based authentication
- **Database**: PostgreSQL for data persistence
- **ORM**: Drizzle ORM for type-safe database operations
- **File Storage**: Local file system with multer for uploads
- **Email**: SendGrid API for transactional emails and notifications

### AI and Machine Learning
- **NLP**: OpenAI GPT-4o for the Marketing Advisor chatbot
- **Text Generation**: Anthropic Claude 3.7 Sonnet for marketing insights storytelling
- **Recommendation System**: Custom ML model for ad performance prediction
- **Data Processing**: Server-side analysis of campaign metrics and ROI calculations

### Payment Processing
- **Provider**: Stripe for secure payment processing
- **Integration**: Server-side Stripe API with client-side Stripe Elements
- **Subscription Management**: Stripe Billing for recurring subscription management

### Development and Deployment
- **Build Tool**: Vite for modern, fast frontend builds
- **TypeScript**: Shared types between frontend and backend
- **Version Control**: Git for source code management
- **Linting**: ESLint for code quality
- **Hosting**: Replit for development and deployment

## Core Components and Implementation Details

### Authentication System
The authentication system uses Passport.js with local strategy (username/password) and implements:

- Session-based authentication with PostgreSQL session store
- Password hashing using scrypt with salt for security
- Email verification for new accounts (except demo accounts)
- Role-based access control with five user levels
- Persistent sessions with secure cookie storage

### Database Schema
The PostgreSQL database includes the following core entities:

- **Users**: Account details, credentials, and role information
- **Businesses**: Business profiles with geographic data
- **Campaigns**: Marketing campaign data with performance metrics
- **Ad Methods**: Configurable advertising methods/channels
- **Business Types**: Categories for business classification
- **Recommendations**: AI-generated marketing recommendations
- **Achievements**: Gamification system for user engagement
- **Feature Usage**: Analytics tracking for platform usage

### AI Integration Architecture

#### Marketing Advisor Chatbot
- Implemented using OpenAI's GPT-4o model
- Contextual awareness through business, campaign, and performance data
- Fallback responses when API is unavailable or rate limited
- Frontend interface with animated bot character
- Real-time response processing

#### Marketing Insights Generator
- Powered by Anthropic's Claude 3.7 Sonnet model
- Transforms campaign data into narrative insights
- Three modes: summary, detailed, and recommendation
- Processing business context data for personalized analysis
- PDF and print export capabilities

#### Campaign Recommendation Engine
- Analyzes historical campaign performance data
- Compares with similar businesses in geographic area
- Generates recommendations with confidence scores
- Multiple budget scenarios: conservative, moderate, and aggressive
- Implementations tracking system

### Geographic Comparison System
- Calculates distances using latitude/longitude coordinates
- Filters businesses by type and geographic proximity
- Normalizes ROI/ROAS calculations for fair comparison
- Privacy anonymization of competitor data
- Customizable radius settings

### File Storage and Management
- Support for JPG, PNG, and PDF file formats
- Unique filename generation to prevent collisions
- Server-side validation for file type and size
- Secure file access controls
- Association with campaign data in the database

### Analytics and Reporting
- Real-time ROI calculation based on campaign data
- Time-series visualization of marketing performance
- Comparative analysis between campaigns and methods
- Export functionality for data and reports
- Admin-level platform usage analytics

## API Documentation

### Authentication Endpoints
- `POST /api/register` - Create new user account
- `POST /api/login` - Authenticate user
- `POST /api/logout` - End user session
- `GET /api/user` - Get current user data

### Business Endpoints
- `GET /api/business/:id` - Get business details
- `PUT /api/business/:id` - Update business profile
- `GET /api/user/:userId/business` - Get business for user

### Campaign Endpoints
- `GET /api/business/:businessId/campaigns` - List campaigns
- `GET /api/business/:businessId/campaigns/roi` - Get campaigns with ROI data
- `GET /api/campaigns/:id` - Get campaign details
- `POST /api/campaigns` - Create new campaign
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign

### Analytics Endpoints
- `GET /api/business/:businessId/stats` - Get business statistics
- `GET /api/top-performers` - Get top-performing campaigns in area

### AI Endpoints
- `POST /api/marketing-advice` - Get chatbot marketing advice
- `POST /api/marketing-insights` - Generate marketing insights story
- `POST /api/ad-recommendations` - Generate ad recommendations
- `GET /api/ad-recommendations/:businessId` - Get existing recommendations
- `POST /api/ad-recommendations/:recommendationId/interaction` - Record user interaction

### Admin Endpoints
- `GET /api/admin/users` - List all users (admin only)
- `GET /api/admin/campaigns` - List all campaigns (admin only)
- `GET /api/admin/stats` - Get system-wide statistics (admin only)
- `PUT /api/admin/users/:id` - Update user (admin only)
- `GET /api/feature-usage/analytics` - Get feature usage data (admin only)

## Security Measures

### Authentication Security
- Password hashing with individual salts
- Rate limiting on login attempts
- CSRF protection for form submissions
- Secure session management

### Data Access Controls
- Role-based permission system
- Business data isolation between users
- Validation of ownership for all data operations
- Parameterized queries to prevent SQL injection

### API Security
- Input validation using zod schemas
- Request sanitization to prevent XSS
- Authorization checks on all protected endpoints
- Error responses that don't leak sensitive information

### External Service Integration
- Secure API key storage for OpenAI, Anthropic, SendGrid, and Stripe
- Server-side API requests to prevent credential exposure
- Response data sanitization before client delivery
- Error handling for external service failures

## Performance Optimizations

### Frontend Optimizations
- Code splitting for reduced initial load times
- React Query for efficient data fetching and caching
- Memoization of expensive calculations
- Lazy loading of non-critical components
- Image optimization for uploaded content

### Backend Optimizations
- Database indexing on frequently queried fields
- Query optimization for complex data retrieval
- Caching of expensive operations
- Pagination for large data sets
- Efficient geographic queries

### Scalability Considerations
- Horizontal scaling capability for backend services
- Database connection pooling
- Asynchronous processing for computationally intensive tasks
- Rate limiting to prevent API abuse
- Resource monitoring and automatic scaling configurations