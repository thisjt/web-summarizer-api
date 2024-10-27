-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Jobs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "summary" TEXT,
    "summary_logs" TEXT,
    "summary_error_message" TEXT,
    "timestamp" INTEGER NOT NULL,
    "started" INTEGER,
    "finished" INTEGER
);
INSERT INTO "new_Jobs" ("finished", "id", "started", "status", "summary", "summary_error_message", "summary_logs", "timestamp", "url") SELECT "finished", "id", "started", "status", "summary", "summary_error_message", "summary_logs", "timestamp", "url" FROM "Jobs";
DROP TABLE "Jobs";
ALTER TABLE "new_Jobs" RENAME TO "Jobs";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
