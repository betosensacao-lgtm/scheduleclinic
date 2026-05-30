# ScheduleClinic

Modern clinic scheduling platform with digital pre-anamnesis. Built with Next.js 15, Supabase, Drizzle ORM, Tailwind CSS, and shadcn/ui.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **ORM**: Drizzle ORM
- **Styling**: Tailwind CSS + custom design tokens
- **UI Components**: shadcn/ui + Radix UI
- **Forms**: React Hook Form + Zod
- **Email**: Resend
- **Fonts**: Syne + DM Sans

## Project Structure

```
src/
├── app/
│   ├── auth/
│   │   ├── login/          # Login page
│   │   └── register/       # Register page
│   ├── dashboard/          # Clinic dashboard (with sidebar layout)
│   ├── appointments/       # Appointments management
│   ├── patients/           # Patient list
│   ├── pre-anamnesis/      # Pre-screening management
│   └── booking/            # Patient booking flow
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx      # Public navbar
│   │   └── Sidebar.tsx     # Dashboard sidebar
│   ├── booking/            # Booking flow components
│   └── anamnesis/
│       └── PreAnamnesisForm.tsx  # Multi-step pre-screening form
├── db/
│   ├── schema.ts           # Drizzle schema (all tables)
│   └── index.ts            # DB connection
├── lib/
│   ├── supabase.ts         # Supabase client (server + browser)
│   ├── utils.ts            # Utility functions
│   └── validations.ts      # Zod schemas
└── types/
    └── index.ts            # TypeScript types
```

## Setup

1. **Clone and install**
```bash
git clone <repo>
cd scheduleclinic
npm install
```

2. **Configure environment**
```bash
cp .env.example .env.local
# Fill in your Supabase and Resend credentials
```

3. **Run database migrations**
```bash
npm run db:generate
npm run db:migrate
```

4. **Start development server**
```bash
npm run dev
```

## Key Features

- 📅 Real-time appointment scheduling
- 📋 Multi-step digital pre-anamnesis form
- 🏥 Multi-specialty support (dentistry, aesthetics, general practice, etc.)
- 🔔 Automated email reminders via Resend
- 👥 Patient and clinic admin roles
- 📊 Dashboard with appointment stats

## Next Steps

- [ ] Booking flow (search → select → confirm)
- [ ] Patient portal
- [ ] Email notifications with Resend
- [ ] Calendar availability management
- [ ] Stripe integration for paid consultations
