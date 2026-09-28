-- CreateEnum
CREATE TYPE "KumiteCategory" AS ENUM ('GOHON_KUMITE', 'SANBON_KUMITE', 'IPPON_KUMITE', 'JIYU_IPPON_KUMITE', 'JIYU_KUMITE', 'SHIAI_KUMITE');

-- AlterTable
ALTER TABLE "Technique" ADD COLUMN "kumiteCategory" "KumiteCategory";
