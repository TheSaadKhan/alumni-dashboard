-- AlterTable
ALTER TABLE "email_verification_tokens" ALTER COLUMN "expires_at" SET DEFAULT NOW() + INTERVAL '24 hours';

-- AlterTable
ALTER TABLE "mentorship_requests" ALTER COLUMN "expires_at" SET DEFAULT NOW() + INTERVAL '14 days';

-- AlterTable
ALTER TABLE "org_invitations" ALTER COLUMN "expires_at" SET DEFAULT NOW() + INTERVAL '7 days';

-- AlterTable
ALTER TABLE "password_reset_tokens" ALTER COLUMN "expires_at" SET DEFAULT NOW() + INTERVAL '1 hour';
