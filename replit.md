# Elisia Land Program

## Overview

A comprehensive web application for managing the League of Kingdoms Land Development Programme, allowing users to track kingdom contributions, manage wallets, and process payment requests. The system features role-based access control with separate dashboards for regular users and administrators, built on a modern full-stack architecture with React frontend and Express backend.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Radix UI with shadcn/ui design system
- **Styling**: Tailwind CSS with custom design tokens and dark theme
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: OpenID Connect (OIDC) with Replit Auth integration
- **Session Management**: Express sessions with PostgreSQL storage
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful endpoints with role-based middleware
- **Error Handling**: Centralized error handling with proper HTTP status codes

### Database Design
**IMPORTANT: This project exclusively uses Supabase PostgreSQL database - NEVER use Replit database**

- **Users Table**: Stores user profiles with approval status and admin flags
- **Kingdoms Table**: User-owned kingdoms with levels, status, and contribution tracking
- **Contributions Table**: Periodic contributions linked to kingdoms
- **Wallets Table**: User cryptocurrency wallet information
- **Payment Requests Table**: User payment requests with admin approval workflow
- **Sessions Table**: Express session storage for authentication

### Authentication & Authorization
- **Identity Provider**: Replit OIDC for user authentication
- **Session Storage**: PostgreSQL-backed sessions with configurable TTL
- **Access Control**: Role-based permissions (user/admin) with middleware protection
- **User Approval**: New users require admin approval before accessing the system

### API Architecture
- **User Routes**: Profile management and dashboard data
- **Kingdom Routes**: CRUD operations for user kingdoms
- **Contribution Routes**: Track and manage kingdom contributions
- **Wallet Routes**: Manage user cryptocurrency wallets
- **Payment Routes**: Submit and process payment requests
- **Admin Routes**: User approval and payment request management

## External Dependencies

### Database
- **Supabase**: Primary PostgreSQL database - ALL data stored here exclusively
- **Connection Pooling**: @neondatabase/serverless for optimized connections
- **Configuration**: Always use SUPABASE_DATABASE_URL environment variable

### Authentication
- **Replit Auth**: OpenID Connect integration for user authentication
- **Passport.js**: Authentication middleware for Express

### UI Framework
- **Radix UI**: Accessible, unstyled UI components
- **Lucide React**: Icon library for consistent iconography
- **Tailwind CSS**: Utility-first CSS framework

### Development Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety across frontend and backend
- **ESBuild**: Fast JavaScript bundler for production builds
- **Drizzle Kit**: Database migration and schema management tools