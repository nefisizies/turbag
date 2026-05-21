-- İlan ve Başvuru Sistemi Migration
-- Railway'de manuel çalıştır: railway run psql $DATABASE_URL -f bu_dosya.sql
-- Ya da Prisma Studio / psql ile doğrudan execute et.

CREATE TYPE "BasvuruDurum" AS ENUM ('BEKLIYOR', 'INCELENIYOR', 'KABUL', 'RED');

CREATE TABLE "Ilan" (
  "id"        TEXT NOT NULL,
  "acenteId"  TEXT NOT NULL,
  "baslik"    TEXT NOT NULL,
  "aciklama"  TEXT,
  "sehir"     TEXT,
  "tarih"     TIMESTAMP(3),
  "sure"      TEXT,
  "ucret"     TEXT,
  "diller"    TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "aktif"     BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Ilan_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Ilan"
  ADD CONSTRAINT "Ilan_acenteId_fkey"
  FOREIGN KEY ("acenteId") REFERENCES "AcenteProfile"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "IlanBasvuru" (
  "id"        TEXT NOT NULL,
  "ilanId"    TEXT NOT NULL,
  "rehberId"  TEXT NOT NULL,
  "mesaj"     TEXT,
  "durum"     "BasvuruDurum" NOT NULL DEFAULT 'BEKLIYOR',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IlanBasvuru_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "IlanBasvuru"
  ADD CONSTRAINT "IlanBasvuru_ilanId_fkey"
  FOREIGN KEY ("ilanId") REFERENCES "Ilan"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "IlanBasvuru"
  ADD CONSTRAINT "IlanBasvuru_rehberId_fkey"
  FOREIGN KEY ("rehberId") REFERENCES "RehberProfile"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "IlanBasvuru_ilanId_rehberId_key"
  ON "IlanBasvuru"("ilanId", "rehberId");
