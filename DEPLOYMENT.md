# Deployment Guide

This guide will help you deploy the Alumni Dashboard application to production.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (or Supabase)
- Clerk account for authentication
- Resend account for email service
- Domain name (optional but recommended)

## Step 1: Environment Variables Setup

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Fill in all required environment variables:

### Required Variables

- **Clerk Authentication**: Get from [Clerk Dashboard](https://dashboard.clerk.com)
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
  - `CLERK_WEBHOOK_SECRET` (for webhooks)

- **Database**: PostgreSQL connection string
  - `DATABASE_URL=postgresql://user:password@host:5432/database`

- **Email Service**: Get from [Resend](https://resend.com)
  - `RESEND_API_KEY`
  - `RESEND_FROM_EMAIL` (must be verified domain)

- **Application URLs**:
  - `NEXT_PUBLIC_BASE_URL=https://yourdomain.com`
  - `NEXT_PUBLIC_URL=https://yourdomain.com`

## Step 2: Database Setup

1. **Run Prisma migrations**:
```bash
npx prisma migrate deploy
```

2. **Generate Prisma Client**:
```bash
npx prisma generate
```

3. **Seed database** (optional):
```bash
npx prisma db seed
```

## Step 3: Clerk Configuration

1. **Set up Clerk Webhook**:
   - Go to Clerk Dashboard → Webhooks
   - Add endpoint: `https://yourdomain.com/api/clerk-webhook`
   - Select events: `user.created`, `user.updated`, `user.deleted`
   - Copy webhook secret to `CLERK_WEBHOOK_SECRET`

2. **Configure Redirect URLs**:
   - After Sign In: `/dashboard`
   - After Sign Up: `/auth/complete-profile`
   - After Invite Accept: `/invite/accept`

## Step 4: Email Service Setup (Resend)

1. **Create Resend account** at https://resend.com
2. **Verify your domain** (recommended) or use default domain
3. **Get API key** and add to `RESEND_API_KEY`
4. **Set from email** in `RESEND_FROM_EMAIL`

## Step 5: Build and Deploy

### Option A: Vercel (Recommended)

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Deploy**:
```bash
vercel
```

3. **Set environment variables** in Vercel dashboard

4. **Configure build settings**:
   - Build Command: `npm run build`
   - Output Directory: `.next`

### Option B: Docker

1. **Build Docker image**:
```bash
docker build -t alumni-dashboard .
```

2. **Run container**:
```bash
docker run -p 3000:3000 --env-file .env.local alumni-dashboard
```

### Option C: Traditional Server

1. **Build application**:
```bash
npm run build
```

2. **Start production server**:
```bash
npm start
```

## Step 6: Post-Deployment Checklist

- [ ] Database migrations completed
- [ ] Environment variables set correctly
- [ ] Clerk webhook configured and tested
- [ ] Email service tested (send test invite)
- [ ] SSL certificate installed (HTTPS)
- [ ] Domain DNS configured
- [ ] Error monitoring set up (Sentry, etc.)
- [ ] Backup strategy in place

## Step 7: Create First Super Admin

1. **Sign up** through Clerk
2. **Update profile** in database to set `user_type` to `super_admin`:
```sql
UPDATE profiles 
SET user_type = 'super_admin' 
WHERE email = 'your-email@example.com';
```

3. **Create organization** via `/setup-organization` page

## Troubleshooting

### Email Not Sending
- Verify Resend API key is correct
- Check domain verification status
- Check spam folder
- Review Resend dashboard for errors

### Database Connection Issues
- Verify DATABASE_URL format
- Check database is accessible
- Ensure migrations are run

### Authentication Issues
- Verify Clerk keys are correct
- Check redirect URLs match Clerk settings
- Review Clerk webhook logs

### Build Errors
- Ensure all dependencies are installed
- Check Node.js version (18+)
- Review build logs for specific errors

## Monitoring

Set up monitoring for:
- Application errors (Sentry, LogRocket)
- Database performance
- Email delivery rates
- User authentication issues

## Support

For issues or questions:
1. Check application logs
2. Review Clerk dashboard logs
3. Check Resend dashboard for email issues
4. Review database logs

