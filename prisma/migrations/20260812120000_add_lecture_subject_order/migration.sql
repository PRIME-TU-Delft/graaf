-- AlterTable
ALTER TABLE "Lecture" ADD COLUMN "subjectOrder" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[];

-- Backfill existing lectures. Before this column there was no per-lecture ordering, so the
-- subjects were shown in the graph-wide subject order; keep that as the starting order rather
-- than leaving lectures with an empty array.
UPDATE "Lecture" AS l
SET "subjectOrder" = ordered.ids
FROM (
    SELECT ls."A" AS "lectureId", array_agg(s."id" ORDER BY s."order", s."id") AS ids
    FROM "_LectureSubject" AS ls
    JOIN "Subject" AS s ON s."id" = ls."B"
    GROUP BY ls."A"
) AS ordered
WHERE l."id" = ordered."lectureId";
