# Creative Collab Attendance Report

A simple internal web app for viewing daily attendance lists for Creative Collab art classes.

## Setup

1. Copy `.env.local.example` to `.env.local` and fill in your PostgreSQL database credentials:
```bash
cp .env.local.example .env.local
```

2. Edit `.env.local` with your database connection details:
```
DB_HOST=your_db_host
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
```

3. Install dependencies:
```bash
pnpm install
```

4. Run the development server:
```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Features

- View all class days for the holiday period
- Select any day to see the attendee list
- See child and parent details for each attendee
- Visual indicator for check-in status (green = checked in)
- Quick search to filter attendees by name
- Responsive design for mobile and desktop use
- Clean, easy-to-read interface with shadcn/ui components

## Tech Stack

- Next.js 15 with App Router
- TypeScript
- Tailwind CSS
- shadcn/ui components
- PostgreSQL (via pg package)

## Database

The app connects to an existing hi-events PostgreSQL database. No database setup or migrations are needed - it uses the existing schema.
