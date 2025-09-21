# Holiday Art Classes Attendance Report App

## Purpose
Simple internal web app to view daily attendance lists for children's holiday art classes. Used by a single staff member to check who's coming each day and access parent contact details.

## Core Features

### 1. Product/Day Selector
- Dropdown or button list to select which class day to view
- Show product title with date and class name (e.g., "Mon 22 Sep - Pizza Pillows")
- Default to today's date if it matches a class day

### 2. Attendee List Display
For the selected day, display:
- Child's full name
- Child's age
- Parent's name
- Parent's email
- Parent's phone number
- Check-in status (visual indicator if checked in)
- Total count of attendees for the day

### 3. Basic Filtering/Sorting
- Sort by child's last name (default)
- Quick search box to filter by child or parent name
- Show checked-in vs not-checked-in attendees

## Technical Implementation

### Database
- PostgreSQL connection via environment variables
- Direct queries to hi-events database schema
- No need for migrations or database setup (using existing)

### Stack
- Next.js 14+ with App Router
- TypeScript for basic type safety
- Tailwind CSS for quick styling
- pg package for PostgreSQL connection

### API Routes
- `/api/products` - Get list of all class days
- `/api/attendees/[productId]` - Get attendees for specific day

### UI Components
- `ProductSelector` - Dropdown/buttons for day selection
- `AttendeeList` - Table/cards showing attendee details
- `AttendeeCard` - Individual attendee display component

## Non-Requirements (Keep It Simple)
- NO authentication (internal use only)
- NO data editing capabilities (read-only)
- NO comprehensive error handling (basic try/catch is fine)
- NO tests
- NO complex state management
- NO offline support
- NO print functionality (browser print is fine)
- NO export features

## UI/UX Guidelines
- Clean, readable layout with good spacing
- Use color coding for check-in status (green = checked in, gray = not yet)
- Large, readable text for easy scanning
- Sticky header with selected day and attendee count
- Simple loading states (just "Loading...")
- Responsive design for mobile use

## Environment Variables Required
```
DB_HOST=
DB_NAME=
DB_USER=
DB_PASSWORD=
```

## Database Queries Needed

### Get all products (class days)
```sql
SELECT id, title, description
FROM products
WHERE event_id = 2
  AND deleted_at IS NULL
ORDER BY id;
```

### Get attendees for a specific day
```sql
SELECT
  a.id,
  a.first_name as child_first_name,
  a.last_name as child_last_name,
  age_answer.answer as child_age,
  o.first_name as parent_first_name,
  o.last_name as parent_last_name,
  o.email as parent_email,
  phone_answer.answer as parent_phone,
  a.checked_in_at,
  a.public_id as ticket_id
FROM attendees a
JOIN orders o ON a.order_id = o.id
LEFT JOIN question_answers age_answer ON (
  age_answer.attendee_id = a.id
  AND age_answer.question_id = 4
  AND age_answer.deleted_at IS NULL
)
LEFT JOIN question_answers phone_answer ON (
  phone_answer.order_id = o.id
  AND phone_answer.question_id = 5
  AND phone_answer.attendee_id IS NULL
  AND phone_answer.deleted_at IS NULL
)
WHERE a.product_id = $1
  AND a.deleted_at IS NULL
  AND o.deleted_at IS NULL
  AND o.status = 'COMPLETED'
ORDER BY a.last_name, a.first_name;
```

## File Structure
```
/
├── .env.local (database credentials)
├── app/
│   ├── layout.tsx
│   ├── page.tsx (main app)
│   └── api/
│       ├── products/route.ts
│       └── attendees/[productId]/route.ts
├── components/
│   ├── ProductSelector.tsx
│   ├── AttendeeList.tsx
│   └── AttendeeCard.tsx
└── lib/
    └── db.ts (database connection)
```
