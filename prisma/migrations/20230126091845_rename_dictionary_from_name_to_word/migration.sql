-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Couple" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_fisrt" INTEGER NOT NULL,
    "id_second" INTEGER NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Couple_id_fisrt_fkey" FOREIGN KEY ("id_fisrt") REFERENCES "Dictionary" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Couple_id_second_fkey" FOREIGN KEY ("id_second") REFERENCES "Dictionary" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Couple" ("id", "id_fisrt", "id_second", "score") SELECT "id", "id_fisrt", "id_second", "score" FROM "Couple";
DROP TABLE "Couple";
ALTER TABLE "new_Couple" RENAME TO "Couple";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
