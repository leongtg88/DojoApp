-- CreateEnum
CREATE TYPE "KihonCategory" AS ENUM ('DACHI', 'TSUKI_WAZA', 'UCHI_WAZA', 'GERI_WAZA', 'UKE_WAZA', 'RENZOKU_WAZA');

-- AlterTable
ALTER TABLE "Technique" ADD COLUMN "kihonCategory" "KihonCategory";
