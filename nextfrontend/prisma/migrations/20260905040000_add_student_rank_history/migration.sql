-- CreateTable
CREATE TABLE "StudentRankHistory" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "beltRankId" TEXT NOT NULL,
    "promotedBy" TEXT,
    "promotedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentRankHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentRankHistory_studentId_promotedAt_idx" ON "StudentRankHistory"("studentId", "promotedAt");

-- CreateIndex
CREATE INDEX "StudentRankHistory_beltRankId_idx" ON "StudentRankHistory"("beltRankId");

-- AddForeignKey
ALTER TABLE "StudentRankHistory" ADD CONSTRAINT "StudentRankHistory_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentRankHistory" ADD CONSTRAINT "StudentRankHistory_beltRankId_fkey" FOREIGN KEY ("beltRankId") REFERENCES "BeltRank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentRankHistory" ADD CONSTRAINT "StudentRankHistory_promotedBy_fkey" FOREIGN KEY ("promotedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;