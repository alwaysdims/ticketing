# Ticketing Backend Apps Script

Source modular untuk project Google Apps Script `Ticketing_Backend`.

Status: preparation dan review only. Belum diunggah ke project Apps Script remote.

## File

- `Code.gs`: entry point `doPost` dan dispatcher.
- `Config.gs`: Script Properties, spreadsheet, dan worksheet headers.
- `Security.gs`: envelope HMAC, timestamp, nonce replay store, error mapping.
- `Registration.gs`: validasi, idempotency, duplicate check, quota, ticket persistence.
- `Checkin.gs`: atomic check-in, log, statistik, participant query.
- `Participants.gs`: statistik dan query peserta. Dipertahankan sebagai file tanggung jawab baca.
- `Tests.gs`: test manual non-produksi untuk contract, WhatsApp, formula guard, dan collision guard.
- `appsscript.json`: V8 runtime dan Web App manifest.

## Script Properties TEST

Set pada project Apps Script TEST. Jangan masukkan nilai ke repository:

- `SPREADSHEET_ID`: ID `Ticketing_Database_TEST`.
- `BACKEND_SECRET`: secret baru yang sama dengan Vercel `BACKEND_SECRET_KEY` TEST.
- `MAX_PARTICIPANTS`: `200`.
- `APP_TIMEZONE`: `Asia/Jakarta`.

Secret lama yang pernah masuk log, chat, screenshot, atau repository harus dirotasi dan tidak boleh dipakai kembali.

## Worksheet yang dibuat/dipakai

- `Participants`
- `Checkin_Log`
- `Replay_Nonces`
- `Registration_Requests`

`Replay_Nonces` menyimpan nonce selama retensi 24 jam. `CacheService` tidak dipakai sebagai sumber kebenaran replay.

## HMAC envelope

Vercel dan Apps Script harus memakai JSON berikut:

```json
{
  "timestamp": 1793900000,
  "nonce": "uuid-v4",
  "payloadText": "{\"action\":\"stats\",\"data\":{}}",
  "signature": "hmac-sha256-hex"
}
```

Signature:

```text
HMAC_SHA256(BACKEND_SECRET, timestamp + "." + nonce + "." + payloadText)
```

- Timestamp Unix seconds.
- Nonce UUID v4 baru setiap request.
- `payloadText` harus byte-for-byte sama dengan body yang ditandatangani.
- Encoding UTF-8.
- Output signature lowercase hexadecimal.
- Tidak ada fallback unsigned request.

## Instalasi manual ke Apps Script TEST

1. Buat atau buka project Apps Script TEST terpisah dari `Ticketing_Backend` produksi.
2. Buat worksheet kosong atau gunakan spreadsheet `Ticketing_Database_TEST`.
3. Salin setiap file `.gs` ke file dengan nama sama di editor Apps Script.
4. Salin isi `appsscript.json` melalui Project Settings, aktifkan tampilan manifest bila perlu.
5. Isi Script Properties TEST dengan nilai TEST.
6. Jalankan fungsi `runLocalContractTests_`, `testWhatsAppText_`, dan `testFormulaGuard_` secara manual.
7. Berikan izin Google Workspace yang diminta hanya untuk project TEST.
8. Deploy sebagai Web App TEST:
   - Execute as: Me / deploying user.
   - Who has access: Anyone.
   - Salin URL deployment TEST ke `APPS_SCRIPT_URL` Vercel Preview.
9. Jangan deploy ke project produksi dan jangan memakai `Ticketing_Database_2026`.
10. Jalankan HTTP integration tests dari Vercel Preview atau harness lokal yang memakai secret TEST.
11. Baca kembali worksheet TEST setelah register dan check-in.

## Rekonsiliasi Check-in

Google Sheets bukan transaksi ACID lintas worksheet. Jika update `Participants` berhasil tetapi append `Checkin_Log` gagal, status peserta tetap `CHECKED_IN` dan function mengembalikan `INTERNAL_ERROR`. Marker `LOG_WRITE_FAILED` dicoba melalui jalur best-effort. Operator harus memperbaiki log berdasarkan `ticket_code`, `checked_in_at`, dan audit runtime sebelum acara dibuka.

Jangan melakukan rollback status peserta otomatis tanpa rekonsiliasi manual. Rollback dapat membuka tiket yang sudah dipakai.

## Batasan

- `LockService` hanya menjamin serialisasi pada critical section Apps Script, bukan ACID database.
- Replay sheet dapat tumbuh; pembersihan dilakukan saat request berikutnya di bawah lock.
- Apps Script Web App dapat mengembalikan redirect ContentService. Vercel harus mengikuti redirect yang diharapkan dan memvalidasi respons JSON.
- Rate limit `Map` di Vercel bukan global. Gunakan provider shared rate limiter sebelum produksi.
- Source ini belum membuktikan HTTP live atau concurrency live sampai deployment TEST diuji.
