/*
  Warnings:

  - You are about to drop the column `counter` on the `User` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idvk" INTEGER NOT NULL,
    "last" TEXT NOT NULL DEFAULT '',
    "lastlast" TEXT NOT NULL DEFAULT '',
    "ignore" BOOLEAN NOT NULL DEFAULT false,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastcrdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastlastcrdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endcrdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("id", "idvk", "ignore", "last", "lastlast") SELECT "id", "idvk", "ignore", "last", "lastlast" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_idvk_key" ON "User"("idvk");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
