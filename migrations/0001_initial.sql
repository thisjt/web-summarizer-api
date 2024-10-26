-- CreateTable
CREATE TABLE "Jobs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "summary" TEXT,
    "summary_logs" TEXT,
    "summary_error_message" TEXT,
    "timestamp" BIGINT NOT NULL,
    "started" BIGINT,
    "finished" BIGINT
);
