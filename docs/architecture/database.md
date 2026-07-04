# Database Schema

PostgreSQL via Supabase, accessed through Drizzle ORM.

## Tables

### `users`

All platform users (patients, clinic admins, professionals).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Auto-generated |
| `email` | text | NOT NULL, UNIQUE | User email |
| `name` | text | NOT NULL | Display name |
| `role` | user_role enum | NOT NULL, DEFAULT 'patient' | `patient`, `clinic_admin`, `professional` |
| `avatar_url` | text | | Profile picture URL |
| `phone` | text | | Phone number |
| `supabase_id` | text | NOT NULL, UNIQUE | Supabase Auth UID |
| `created_at` | timestamp | NOT NULL, DEFAULT now() | |
| `updated_at` | timestamp | NOT NULL, DEFAULT now() | |

### `clinics`

Clinic profiles with location and billing info.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `name` | text | NOT NULL | Clinic name |
| `slug` | text | NOT NULL, UNIQUE | URL-friendly identifier |
| `specialty` | clinic_specialty enum | NOT NULL | Primary specialty |
| `description` | text | | Clinic description |
| `phone` | text | NOT NULL | Contact phone |
| `email` | text | NOT NULL | Contact email |
| `logo_url` | text | | Logo image URL |
| `cover_url` | text | | Cover image URL |
| `rating` | real | NOT NULL, DEFAULT 0 | Average rating |
| `review_count` | integer | NOT NULL, DEFAULT 0 | Number of reviews |
| `is_verified` | boolean | NOT NULL, DEFAULT false | Verification status |
| `street` | text | | Address |
| `address_number` | text | | |
| `complement` | text | | |
| `neighborhood` | text | | |
| `city` | text | | |
| `state` | text | | |
| `zip_code` | text | | |
| `country` | text | DEFAULT 'US' | |
| `owner_id` | UUID | FK → users.id | Clinic owner |
| `stripe_customer_id` | text | | Stripe customer |
| `subscription_id` | text | | Stripe subscription |
| `subscription_status` | text | | `active`, `canceled`, etc. |
| `plan` | text | NOT NULL, DEFAULT 'free' | `free`, `starter`, etc. |
| `created_at` | timestamp | NOT NULL | |
| `updated_at` | timestamp | NOT NULL | |

### `professionals`

Doctors and healthcare professionals linked to clinics.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `clinic_id` | UUID | FK → clinics.id, CASCADE | |
| `user_id` | UUID | FK → users.id, NULLABLE | Linked user account |
| `name` | text | NOT NULL | Professional name |
| `specialty` | text | NOT NULL | Medical specialty |
| `registration_number` | text | | CRM or license number |
| `bio` | text | | Short biography |
| `avatar_url` | text | | Profile picture |
| `rating` | real | DEFAULT 0 | |
| `review_count` | integer | DEFAULT 0 | |
| `available_days` | jsonb | DEFAULT [1,2,3,4,5] | Weekdays (0=Sun, 6=Sat) |
| `working_hours_start` | time | DEFAULT '08:00' | |
| `working_hours_end` | time | DEFAULT '18:00' | |
| `slot_duration` | integer | NOT NULL, DEFAULT 30 | Minutes per slot |
| `break_start` | time | | Lunch break start |
| `break_end` | time | | Lunch break end |
| `is_active` | boolean | NOT NULL, DEFAULT true | |
| `created_at` | timestamp | NOT NULL | |

### `triage_sessions`

AI triage conversation sessions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `patient_name` | text | NOT NULL | |
| `patient_email` | text | NOT NULL | |
| `main_symptom` | text | | Primary complaint |
| `evolution_time` | text | | How long symptoms have lasted |
| `pain_intensity` | integer | | 0-10 scale |
| `relevant_history` | text | | Medical history |
| `urgency_classification` | urgency_enum | | `RED`, `YELLOW`, `GREEN` |
| `suggested_specialty` | clinic_specialty enum | | AI-recommended specialty |
| `classification_justification` | text | | Why this urgency level |
| `ai_summary` | text | | AI-generated summary |
| `message_count` | integer | DEFAULT 0 | |
| `model_used` | text | | LLM model identifier |
| `status` | triage_status enum | NOT NULL, DEFAULT 'PENDING' | `PENDING`, `REVIEWED`, `ARCHIVED` |
| `source` | text | DEFAULT 'web' | `web`, `whatsapp`, `api` |
| `admin_notes` | text | | Clinician notes |
| `created_at` | timestamp | NOT NULL | |
| `updated_at` | timestamp | NOT NULL | |

### `triage_messages`

Individual messages within a triage session.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `session_id` | UUID | FK → triage_sessions.id, CASCADE | |
| `role` | text (enum) | NOT NULL | `user` or `assistant` |
| `content` | text | NOT NULL | Message text |
| `created_at` | timestamp | NOT NULL | |

### `appointments`

Scheduled appointments.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `patient_id` | UUID | FK → users.id | |
| `clinic_id` | UUID | FK → clinics.id | |
| `professional_id` | UUID | FK → professionals.id | |
| `triage_session_id` | UUID | FK → triage_sessions.id, NULLABLE | Linked triage |
| `date` | date | NOT NULL | Appointment date |
| `start_time` | time | NOT NULL | |
| `end_time` | time | NOT NULL | |
| `status` | appointment_status enum | NOT NULL, DEFAULT 'pending' | `pending`, `confirmed`, `cancelled`, `completed`, `no_show` |
| `notes` | text | | |
| `reminder_sent_at` | timestamp | | When 24h reminder was sent |
| `created_at` | timestamp | NOT NULL | |
| `updated_at` | timestamp | NOT NULL | |

### `pre_anamnesis`

Digital pre-visit health intake forms.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `appointment_id` | UUID | FK → appointments.id, CASCADE | |
| `patient_id` | UUID | FK → users.id | |
| `full_name` | text | NOT NULL | |
| `date_of_birth` | date | | |
| `gender` | gender enum | | `male`, `female`, `other`, `prefer_not_to_say` |
| `phone` | text | | |
| `emergency_contact` | text | | |
| `chief_complaint` | text | NOT NULL | Primary reason for visit |
| `symptoms_description` | text | | |
| `symptoms_duration` | text | | |
| `pain_scale` | integer | | 0-10 |
| `current_medications` | jsonb | DEFAULT [] | Array of strings |
| `allergies` | jsonb | DEFAULT [] | Array of strings |
| `chronic_conditions` | jsonb | DEFAULT [] | Array of strings |
| `previous_surgeries` | text | | |
| `family_history` | text | | |
| `blood_type` | text | | |
| `height` | real | | cm |
| `weight` | real | | kg |
| `has_insurance` | boolean | DEFAULT false | |
| `insurance_provider` | text | | |
| `insurance_plan_number` | text | | |
| `consent_given` | boolean | DEFAULT false | |
| `consent_date` | timestamp | | |
| `created_at` | timestamp | NOT NULL | |

### `whatsapp_sessions`

WhatsApp conversation state tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | |
| `clinic_id` | UUID | FK → clinics.id | |
| `phone_number` | text | NOT NULL | Sender's phone |
| `patient_name` | text | | |
| `patient_email` | text | | |
| `triage_session_id` | UUID | FK → triage_sessions.id, NULLABLE | |
| `appointment_id` | UUID | FK → appointments.id, NULLABLE | |
| `status` | whatsapp_status enum | DEFAULT 'active' | `active`, `completed`, `abandoned` |
| `current_step` | text | DEFAULT 'welcome' | Conversation step |
| `context_data` | jsonb | | Session context |
| `created_at` | timestamp | NOT NULL | |
| `updated_at` | timestamp | NOT NULL | |

## Enums

| Enum | Values |
|------|--------|
| `user_role` | `patient`, `clinic_admin`, `professional` |
| `appointment_status` | `pending`, `confirmed`, `cancelled`, `completed`, `no_show` |
| `clinic_specialty` | `general_practice`, `dentistry`, `aesthetics`, `cardiology`, `dermatology`, `neurology`, `orthopedics`, `ophthalmology`, `gynecology`, `pediatrics`, `psychiatry`, `other` |
| `gender` | `male`, `female`, `other`, `prefer_not_to_say` |
| `urgency_classification` | `RED`, `YELLOW`, `GREEN` |
| `triage_status` | `PENDING`, `REVIEWED`, `ARCHIVED` |
| `whatsapp_session_status` | `active`, `completed`, `abandoned` |

## Relations

```
users ──< clinics (owner)
users ──< professionals (user)
users ──< appointments (patient)
users ──< pre_anamnesis (patient)

clinics ──< professionals
clinics ──< appointments
clinics ──< whatsapp_sessions

professionals ──< appointments

triage_sessions ──< triage_messages
triage_sessions ──< appointments
triage_sessions ──< whatsapp_sessions

appointments ──< pre_anamnesis
appointments ──< whatsapp_sessions
```
