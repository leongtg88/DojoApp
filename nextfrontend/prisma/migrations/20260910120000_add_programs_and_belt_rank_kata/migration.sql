-- CreateEnum
CREATE TYPE "Program" AS ENUM ('ADULT', 'YOUTH');

-- AlterTable
ALTER TABLE "BeltRank" ADD COLUMN     "maxMonths" INTEGER,
ADD COLUMN     "program" "Program" NOT NULL DEFAULT 'ADULT';

-- CreateTable
CREATE TABLE "BeltRankKata" (
    "beltRankId" TEXT NOT NULL,
    "kataId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BeltRankKata_pkey" PRIMARY KEY ("beltRankId","kataId")
);

-- CreateIndex
CREATE INDEX "BeltRankKata_kataId_idx" ON "BeltRankKata"("kataId");

-- CreateIndex
CREATE UNIQUE INDEX "BeltRank_program_order_key" ON "BeltRank"("program", "order");

-- AddForeignKey
ALTER TABLE "BeltRankKata" ADD CONSTRAINT "BeltRankKata_beltRankId_fkey" FOREIGN KEY ("beltRankId") REFERENCES "BeltRank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeltRankKata" ADD CONSTRAINT "BeltRankKata_kataId_fkey" FOREIGN KEY ("kataId") REFERENCES "Technique"("id") ON DELETE CASCADE ON UPDATE CASCADE;