/*
  Warnings:

  - You are about to drop the column `order` on the `Subject` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "unchanged" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Domain" ADD COLUMN     "unchanged" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Graph" ADD COLUMN     "unchanged" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Lecture" ADD COLUMN     "unchanged" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "unchanged" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Program" ADD COLUMN     "unchanged" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Subject" DROP COLUMN "order",
ADD COLUMN     "unchanged" BOOLEAN NOT NULL DEFAULT true;
