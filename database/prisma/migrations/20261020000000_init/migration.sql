-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MEMBER', 'ADMIN');

-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('LOST', 'FOUND');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('ACTIVE', 'CLOSED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "HandoverMethod" AS ENUM ('MEET', 'GUARD');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "studentCode" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "emailVerifiedAt" TIMESTAMP(3),
    "blockedAt" TIMESTAMP(3),
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "tokenHash" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("tokenHash")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "tokenHash" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("tokenHash")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "type" "PostType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "occurredOn" DATE NOT NULL,
    "status" "PostStatus" NOT NULL DEFAULT 'ACTIVE',
    "handoverMethod" "HandoverMethod",
    "guardLocation" TEXT,
    "secretQuestion" TEXT,
    "secretAnswerHash" TEXT,
    "closedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" UUID NOT NULL,
    "postId" UUID NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chat" (
    "id" UUID NOT NULL,
    "postId" UUID NOT NULL,
    "claimantId" UUID NOT NULL,
    "claimVerifiedAt" TIMESTAMP(3),
    "claimAttempts" INTEGER NOT NULL DEFAULT 0,
    "claimLockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" UUID NOT NULL,
    "chatId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Handover" (
    "id" UUID NOT NULL,
    "postId" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "finderId" UUID NOT NULL,
    "ownerConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "finderConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Handover_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" UUID NOT NULL,
    "postId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "postId" UUID,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" UUID NOT NULL,
    "postId" UUID NOT NULL,
    "reporterId" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "targetId" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_studentCode_key" ON "User"("studentCode");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "Post_status_createdAt_id_idx" ON "Post"("status", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Post_category_location_type_idx" ON "Post"("category", "location", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Photo_storageKey_key" ON "Photo"("storageKey");

-- CreateIndex
CREATE UNIQUE INDEX "Chat_postId_claimantId_key" ON "Chat"("postId", "claimantId");

-- CreateIndex
CREATE INDEX "Message_chatId_createdAt_id_idx" ON "Message"("chatId", "createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Handover_postId_key" ON "Handover"("postId");

-- CreateIndex
CREATE INDEX "Comment_postId_createdAt_id_idx" ON "Comment"("postId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_id_idx" ON "Notification"("userId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");

-- CreateIndex
CREATE INDEX "OutboxEvent_processedAt_nextAttemptAt_idx" ON "OutboxEvent"("processedAt", "nextAttemptAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationToken" ADD CONSTRAINT "VerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_claimantId_fkey" FOREIGN KEY ("claimantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Handover" ADD CONSTRAINT "Handover_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Handover" ADD CONSTRAINT "Handover_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Handover" ADD CONSTRAINT "Handover_finderId_fkey" FOREIGN KEY ("finderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Domain invariants not expressible in Prisma's model syntax.
ALTER TABLE "Post" ADD CONSTRAINT "Post_type_handover_check" CHECK (
  ("type" = 'LOST' AND "handoverMethod" IS NULL AND "guardLocation" IS NULL)
  OR ("type" = 'FOUND' AND "handoverMethod" IS NOT NULL AND (
    ("handoverMethod" = 'MEET' AND "guardLocation" IS NULL)
    OR ("handoverMethod" = 'GUARD' AND "guardLocation" IS NOT NULL)
  ))
);
ALTER TABLE "Post" ADD CONSTRAINT "Post_category_check" CHECK ("category" IN ('ELECTRONICS','DOCUMENTS','KEYS','CLOTHING','OTHER'));
ALTER TABLE "Post" ADD CONSTRAINT "Post_location_check" CHECK ("location" IN ('MAIN','BUILDING_1','BUILDING_2','LIBRARY'));
ALTER TABLE "Post" ADD CONSTRAINT "Post_guard_location_check" CHECK ("guardLocation" IS NULL OR "guardLocation" IN ('MAIN','BUILDING_1','BUILDING_2','LIBRARY'));
ALTER TABLE "Handover" ADD CONSTRAINT "Handover_distinct_parties" CHECK ("ownerId" <> "finderId");
ALTER TABLE "Handover" ADD CONSTRAINT "Handover_completed_confirmations" CHECK ("completedAt" IS NULL OR ("ownerConfirmed" AND "finderConfirmed"));
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_valid_bytes" CHECK ("bytes" > 0 AND "bytes" < 5242880);
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_valid_mime" CHECK ("mimeType" IN ('image/jpeg','image/png'));
