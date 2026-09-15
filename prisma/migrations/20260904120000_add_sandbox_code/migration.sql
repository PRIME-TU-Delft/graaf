/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Sandbox` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[uriCode]` on the table `Sandbox` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sandboxId,name]` on the table `Link` will be added. If there are existing duplicate values, this will fail.
  - Added the required columns `code` and `uriCode` to the `Sandbox` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable: add as nullable first, since Sandbox may already have rows
ALTER TABLE "Sandbox" ADD COLUMN     "code" TEXT;
ALTER TABLE "Sandbox" ADD COLUMN     "uriCode" TEXT;

-- Backfill: unlike Course, existing sandboxes have no code of their own to copy, so generate one
-- from the owner's identifying name (nickname, then first name, then their id as a last resort),
-- lowercased and made URL-safe, with an incrementing numeric suffix appended until it doesn't
-- collide with any Course code/uriCode or another Sandbox's already-backfilled code/uriCode. This
-- mirrors the generation rule the app applies to newly created sandboxes (see
-- src/lib/server/actions/codeGeneration.ts).
DO $$
DECLARE
	rec RECORD;
	base_slug TEXT;
	candidate TEXT;
	suffix INT;
BEGIN
	FOR rec IN
		SELECT s.id, COALESCE(NULLIF(u."nickname", ''), NULLIF(u."firstName", ''), u.id) AS ident
		FROM "Sandbox" s
		JOIN "User" u ON u.id = s."ownerId"
		ORDER BY s.id
	LOOP
		base_slug := lower(regexp_replace(rec.ident, '[^a-zA-Z0-9]+', '-', 'g'));
		base_slug := trim(both '-' from base_slug);
		IF base_slug = '' THEN
			base_slug := 'sandbox';
		END IF;

		candidate := base_slug;
		suffix := 1;
		WHILE EXISTS (
			SELECT 1 FROM "Course" WHERE "code" = candidate OR "uriCode" = candidate
			UNION ALL
			SELECT 1 FROM "Sandbox" WHERE id != rec.id AND ("code" = candidate OR "uriCode" = candidate)
		) LOOP
			suffix := suffix + 1;
			candidate := base_slug || '-' || suffix;
		END LOOP;

		UPDATE "Sandbox" SET "code" = candidate, "uriCode" = candidate WHERE id = rec.id;
	END LOOP;
END $$;

ALTER TABLE "Sandbox" ALTER COLUMN "code" SET NOT NULL;
ALTER TABLE "Sandbox" ALTER COLUMN "uriCode" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Sandbox_code_key" ON "Sandbox"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Sandbox_uriCode_key" ON "Sandbox"("uriCode");

-- CreateIndex
CREATE UNIQUE INDEX "Link_sandboxId_name_key" ON "Link"("sandboxId", "name");
