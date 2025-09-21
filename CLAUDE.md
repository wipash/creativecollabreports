# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a simple internal reporting app for children's holiday art classes. It displays attendance lists for each class day, showing child and parent details from a hi-events PostgreSQL database.

## Commands

```bash
# Development
pnpm dev          # Start dev server with Turbopack on http://localhost:3000
pnpm build        # Build for production
pnpm lint         # Run ESLint
pnpm start        # Start production server

# Setup
cp .env.local.example .env.local  # Create environment file
# Then add PostgreSQL credentials to .env.local
```

## Architecture

### Database Integration
- **Connection**: Direct PostgreSQL queries using `pg` package via `src/lib/db.ts`
- **Event ID**: Hardcoded to `event_id = 2` for Sept/Oct Holiday Classes
- **Question IDs**: Hardcoded - ID 4 for child age, ID 5 for parent phone
- **Soft Deletes**: Always filter by `deleted_at IS NULL`
- **Order Status**: Always filter by `status = 'COMPLETED'` for valid orders

### API Structure
- `/api/products`: Returns all class days for the event
- `/api/attendees/[productId]`: Returns attendees for a specific day with parent contact info
- Routes use Next.js 15 async params pattern: `params: Promise<{ productId: string }>`

### Data Flow
1. Page loads → fetches products (class days) → auto-selects first day
2. User selects day → fetches attendees for that product_id
3. Attendee data includes child info + parent contact via JOIN with question_answers

### UI Components
- **ProductSelector**: Grid of buttons for day selection
- **AttendeeList**: Manages search/filter state, displays count badges
- **AttendeeCard**: Individual attendee display with check-in status

### Key Design Decisions
- No authentication (internal use only)
- Read-only access to existing database
- Client-side state management (no Redux/Zustand needed)
- shadcn/ui for consistent component styling
- Mobile-responsive with Tailwind CSS

## Environment Variables

Required in `.env.local`:
```
DB_HOST=
DB_NAME=
DB_USER=
DB_PASSWORD=
```

## Database Schema Notes

The app queries an existing hi-events database:
- `products` = individual class days
- `attendees` = child registrations (one per child per day)
- `orders` = parent purchases
- `question_answers` = extra info (age, phone) stored as JSONB
- Answers need cleanup: `.replace(/['"]/g, '')` to remove quotes