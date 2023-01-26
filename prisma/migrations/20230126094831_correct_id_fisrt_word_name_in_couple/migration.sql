/*
  Warnings:

  - You are about to drop the column `id_fisrt` on the `Couple` table. All the data in the column will be lost.
  - Added the required column `id_first` to the `Couple` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Couple" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_first" INTEGER NOT NULL,
    "id_second" INTEGER NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "position" INTEGER NOT NULL,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Couple_id_first_fkey" FOREIGN KEY ("id_first") REFERENCES "Dictionary" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Couple_id_second_fkey" FOREIGN KEY ("id_second") REFERENCES "Dictionary" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Couple" ("crdate", "id", "id_second", "position", "score") SELECT "crdate", "id", "id_second", "position", "score" FROM "Couple";
DROP TABLE "Couple";
ALTER TABLE "new_Couple" RENAME TO "Couple";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
