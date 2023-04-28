/*
  Warnings:

  - You are about to drop the `Couple` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Dictionary` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Couple";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Dictionary";
PRAGMA foreign_keys=on;
