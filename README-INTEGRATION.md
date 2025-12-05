# API Integration Summary

This document summarizes all the API integrations and flows implemented in the Alumni Dashboard.

## Authentication Flow

1. **User Registration/Login**: Handled by Clerk
2. **Profile Creation**: Automatically created via Clerk webhook
3. **Email Verification**: Optional verification via `/api/auth/verify-email`

## Organization Flow

### Super Admin Creates Organization
1. Super admin signs up and completes profile
2. Sets `user_type` to `super_admin` in database
3. Accesses `/setup-organization` page
4. Creates organization via `createOrganizationAction`
5. Automatically assigned `super_admin` role in organization
6. Can invite admins via `/api/invitations/create`

### Admin Adds Members
1. Admin receives invite email
2. Clicks invite link → `/invite/accept?token=XXX`
3. Signs in if not already authenticated
4. Invite is accepted via `/api/invitations/accept`
5. If profile incomplete → redirected to `/auth/complete-profile`
6. Otherwise → redirected to `/dashboard`

## API Endpoints

### Authentication & Profile
- `GET /api/profile?authUserId=XXX` - Get user profile
- `POST /api/profile` - Update/create profile
- `POST /api/auth/verify-email` - Request email verification
- `GET /api/auth/verify-email?token=XXX` - Verify email token

### Organizations
- `GET /api/organizations` - Get user's organizations
- `POST /api/organizations` - Create organization (super admin only)
- `GET /api/organizations/[orgId]/members` - Get organization members
- `GET /api/organizations/[orgId]/roles` - Get organization roles

### Invitations
- `POST /api/invitations/create` - Create invitation (admin/super admin)
- `POST /api/invitations/accept` - Accept invitation
- `GET /api/invitations/info?token=XXX` - Get invitation details

### Events
- `GET /api/events?organizationId=XXX` - List events
- `POST /api/events` - Create event (admin)
- `GET /api/events/[eventId]` - Get event details
- `PUT /api/events/[eventId]` - Update event (admin)
- `DELETE /api/events/[eventId]` - Delete event (admin)

### Jobs
- `GET /api/jobs?organizationId=XXX` - List jobs
- `POST /api/jobs` - Create job (admin)
- `GET /api/jobs/[jobId]` - Get job details
- `PUT /api/jobs/[jobId]` - Update job (admin)
- `DELETE /api/jobs/[jobId]` - Delete job (admin)

### Donations
- `GET /api/donations?organizationId=XXX` - List donations
- `POST /api/donations` - Create donation

### Users
- `GET /api/users?organizationId=XXX` - List users in organization
- `POST /api/users` - Add user to organization (admin)

### Admin
- `GET /api/admin/stats?organizationId=XXX` - Get admin dashboard stats

## Role Hierarchy

1. **super_admin** (hierarchy_level: 100)
   - Can create organizations
   - Can invite admins
   - Full permissions

2. **admin** (hierarchy_level: 70)
   - Can invite students and alumni
   - Can manage members, events, jobs
   - Cannot create organizations

3. **alumni** (hierarchy_level: 20)
   - Regular member
   - Can view and participate

4. **student** (hierarchy_level: 10)
   - Regular member
   - Can view and participate

## Email Integration

### Invitation Emails
- Sent via Resend when invitation is created
- Contains invite link: `/invite/accept?token=XXX`
- Expires in 7 days

### Verification Emails
- Sent when user requests email verification
- Contains verification link: `/auth/verify-email?token=XXX`
- Expires in 24 hours

## Frontend Integration

### Admin Pages
- `/admin` - Dashboard with real-time stats
- `/admin/users` - User management (connected to `/api/users`)
- `/admin/events` - Event management (connected to `/api/events`)
- `/admin/jobs` - Job management (connected to `/api/jobs`)
- `/admin/donations` - Donation management (connected to `/api/donations`)

### User Pages
- `/dashboard` - Main dashboard
- `/auth/complete-profile` - Profile completion form
- `/invite/accept` - Invitation acceptance page

## Environment Variables Required

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# Database
DATABASE_URL=

# Email (Resend)
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# URLs
NEXT_PUBLIC_BASE_URL=
NEXT_PUBLIC_URL=
```

## Testing the Flow

1. **Create Super Admin**:
   ```sql
   UPDATE profiles SET user_type = 'super_admin' WHERE email = 'your@email.com';
   ```

2. **Create Organization**: Sign in → `/setup-organization`

3. **Invite Admin**: Use admin panel → Invite user with admin role

4. **Accept Invite**: Click email link → Sign in → Complete profile

5. **Admin Invites Members**: Admin panel → Invite students/alumni

## Error Handling

All API routes include:
- Authentication checks
- Authorization checks (role-based)
- Input validation
- Error responses with appropriate status codes
- Logging for debugging

## Security Features

- Server-side authentication verification
- Role-based access control
- Token-based invitations with expiration
- Email verification
- SQL injection prevention (Prisma)
- XSS protection (Next.js built-in)

