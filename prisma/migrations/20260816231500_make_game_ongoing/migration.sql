-- The former season record is retained as the internal week-numbering anchor,
-- but it no longer has an end boundary or season-facing name.
UPDATE "Season"
SET "name" = 'Ongoing game', "endDate" = NULL;
