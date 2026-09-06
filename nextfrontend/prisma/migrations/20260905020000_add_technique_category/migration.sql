-- CreateEnum
CREATE TYPE "TechniqueCategory" AS ENUM ('KIHON', 'KATA', 'KUMITE', 'BUNKAI');

-- AlterTable
ALTER TABLE "Technique" ADD COLUMN "category" "TechniqueCategory" NOT NULL DEFAULT 'KIHON';