-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Unknown" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "text" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Unknown" ("id", "text") SELECT "id", "text" FROM "Unknown";
DROP TABLE "Unknown";
ALTER TABLE "new_Unknown" RENAME TO "Unknown";
CREATE UNIQUE INDEX "Unknown_text_key" ON "Unknown"("text");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
