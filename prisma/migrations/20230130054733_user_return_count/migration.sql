/*
  Warnings:

  - You are about to drop the column `endcrdate` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastcrdate` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastlastcrdate` on the `User` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idvk" INTEGER NOT NULL,
    "last" TEXT NOT NULL DEFAULT '',
    "lastlast" TEXT NOT NULL DEFAULT '',
    "ignore" BOOLEAN NOT NULL DEFAULT false,
    "count" INTEGER NOT NULL DEFAULT 0,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("crdate", "id", "idvk", "ignore", "last", "lastlast") SELECT "crdate", "id", "idvk", "ignore", "last", "lastlast" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_idvk_key" ON "User"("idvk");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
