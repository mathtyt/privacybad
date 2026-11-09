CREATE TABLE "Participation" (
"id" UUID PRIMARY KEY, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
"expiresAt" TIMESTAMP(3) NOT NULL, "consentVersion" TEXT NOT NULL,
"consentTimestamp" TIMESTAMP(3) NOT NULL, "photoStorageKey" TEXT,
"latitude" DOUBLE PRECISION, "longitude" DOUBLE PRECISION, "accuracy" DOUBLE PRECISION,
"browser" TEXT NOT NULL, "operatingSystem" TEXT NOT NULL, "language" TEXT NOT NULL,
"screenResolution" TEXT NOT NULL, "timezone" TEXT NOT NULL, "deletionTokenHash" TEXT NOT NULL);
CREATE UNIQUE INDEX "Participation_photoStorageKey_key" ON "Participation"("photoStorageKey");
CREATE UNIQUE INDEX "Participation_deletionTokenHash_key" ON "Participation"("deletionTokenHash");
CREATE INDEX "Participation_expiresAt_idx" ON "Participation"("expiresAt");
CREATE TABLE "RateLimit" ("key" TEXT PRIMARY KEY, "count" INTEGER NOT NULL, "resetAt" TIMESTAMP(3) NOT NULL);
CREATE INDEX "RateLimit_resetAt_idx" ON "RateLimit"("resetAt");
