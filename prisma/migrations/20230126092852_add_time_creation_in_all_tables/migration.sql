-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Answer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "qestion" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Answer" ("answer", "id", "qestion") SELECT "answer", "id", "qestion" FROM "Answer";
DROP TABLE "Answer";
ALTER TABLE "new_Answer" RENAME TO "Answer";
CREATE TABLE "new_Couple" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_fisrt" INTEGER NOT NULL,
    "id_second" INTEGER NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "position" INTEGER NOT NULL,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Couple_id_fisrt_fkey" FOREIGN KEY ("id_fisrt") REFERENCES "Dictionary" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Couple_id_second_fkey" FOREIGN KEY ("id_second") REFERENCES "Dictionary" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Couple" ("id", "id_fisrt", "id_second", "position", "score") SELECT "id", "id_fisrt", "id_second", "position", "score" FROM "Couple";
DROP TABLE "Couple";
ALTER TABLE "new_Couple" RENAME TO "Couple";
CREATE TABLE "new_Dictionary" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "word" TEXT NOT NULL,
    "Score" INTEGER NOT NULL DEFAULT 0,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Dictionary" ("Score", "id", "word") SELECT "Score", "id", "word" FROM "Dictionary";
DROP TABLE "Dictionary";
ALTER TABLE "new_Dictionary" RENAME TO "Dictionary";
CREATE UNIQUE INDEX "Dictionary_word_key" ON "Dictionary"("word");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
