-- CreateTable
CREATE TABLE "Unknown" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "text" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Unknown_text_key" ON "Unknown"("text");
