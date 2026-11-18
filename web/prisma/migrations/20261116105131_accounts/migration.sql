-- CreateEnum
CREATE TYPE "Role" AS ENUM ('viewer', 'admin');

-- CreateEnum
CREATE TYPE "TokenPurpose" AS ENUM ('reset_link', 'reset_code', 'reset_grant', 'login_code', 'signup_code');

-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('email', 'sms');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('queued', 'sent', 'failed');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "password_hash" TEXT,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'viewer',
    "country" CHAR(2) NOT NULL,
    "language" VARCHAR(2) NOT NULL DEFAULT 'en',
    "marketing_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "terms_accepted_at" TIMESTAMP(3) NOT NULL,
    "email_verified_at" TIMESTAMP(3),
    "phone_verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "persistent" BOOLEAN NOT NULL DEFAULT false,
    "user_agent" TEXT,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_tokens" (
    "id" UUID NOT NULL,
    "purpose" "TokenPurpose" NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_id" UUID,
    "target" TEXT NOT NULL,
    "payload" JSONB,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_messages" (
    "id" UUID NOT NULL,
    "channel" "Channel" NOT NULL,
    "to" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "language" VARCHAR(2) NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "text" TEXT,
    "status" "MessageStatus" NOT NULL DEFAULT 'queued',
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMP(3),

    CONSTRAINT "outbox_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limits" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "window_start" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "auth_tokens_target_purpose_idx" ON "auth_tokens"("target", "purpose");

-- CreateIndex
CREATE INDEX "outbox_messages_status_created_at_idx" ON "outbox_messages"("status", "created_at");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
