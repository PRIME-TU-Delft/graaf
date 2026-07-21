/*
  Warnings:

  - A unique constraint covering the columns `[uriCode]` on the table `Course` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `uriCode` to the `Course` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable: add as nullable first, since Course may already have rows
ALTER TABLE "Course" ADD COLUMN     "uriCode" TEXT;

-- Backfill: every existing course was created through this app's own form,
-- which only allows alphanumeric codes, so code is already URL-safe and can
-- be copied as-is. Legacy courses with non-URL-safe codes are inserted later
-- by the graaf-migration importer, which sets uriCode itself via
-- encodeURIComponent() at insert time.
UPDATE "Course" SET "uriCode" = "code";

ALTER TABLE "Course" ALTER COLUMN "uriCode" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Course_uriCode_key" ON "Course"("uriCode");
