-- AlterTable
ALTER TABLE "PayEvent" ADD COLUMN "drawnBasicPay" REAL;
ALTER TABLE "PayEvent" ADD COLUMN "drawnGradePay" REAL;
ALTER TABLE "PayEvent" ADD COLUMN "drawnIR" REAL;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DARate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "effectiveDate" DATETIME NOT NULL,
    "percentage" REAL NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'REVISED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_DARate" ("createdAt", "effectiveDate", "id", "percentage", "updatedAt") SELECT "createdAt", "effectiveDate", "id", "percentage", "updatedAt" FROM "DARate";
DROP TABLE "DARate";
ALTER TABLE "new_DARate" RENAME TO "DARate";
CREATE UNIQUE INDEX "DARate_effectiveDate_type_key" ON "DARate"("effectiveDate", "type");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
