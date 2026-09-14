-- AlterTable
ALTER TABLE "Technique" ADD COLUMN     "applicationType" TEXT,
ADD COLUMN     "distance" TEXT,
ADD COLUMN     "kumiteType" TEXT,
ADD COLUMN     "level" TEXT,
ADD COLUMN     "originKataId" TEXT,
ADD COLUMN     "repetitionsCount" INTEGER,
ADD COLUMN     "role" TEXT,
ADD COLUMN     "stance" TEXT;

-- CreateIndex
CREATE INDEX "Technique_originKataId_idx" ON "Technique"("originKataId");

-- AddForeignKey
ALTER TABLE "Technique" ADD CONSTRAINT "Technique_originKataId_fkey" FOREIGN KEY ("originKataId") REFERENCES "Technique"("id") ON DELETE SET NULL ON UPDATE CASCADE;
