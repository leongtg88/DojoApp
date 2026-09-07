-- AlterTable
ALTER TABLE "User" ADD COLUMN     "roles" "Role"[] DEFAULT ARRAY[]::"Role"[];

-- Backfill: los usuarios existentes heredan su rol principal
UPDATE "User" SET "roles" = ARRAY["role"];
