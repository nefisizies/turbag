-- TuristKayit (program şablonuna bağlı turist listesi) kaldırıldı.
-- Turistler artık EtkinlikTurist ile tarihli takvim etkinliğine bağlanıyor.
-- Mevcut kayıtlar migration öncesi elle EtkinlikTurist'e taşındı/temizlendi.
DROP TABLE IF EXISTS "TuristKayit";
