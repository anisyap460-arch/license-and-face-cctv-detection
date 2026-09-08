# License and Face CCTV Detection

Dashboard Flask untuk monitoring CCTV, deteksi plat nomor, dan deteksi wajah.

## Menjalankan aplikasi

```powershell
python app.py
```

Buka `http://localhost:5000`.

## Struktur aplikasi

```text
app.py                      # Bootstrap Flask dan registrasi blueprint
routes/
  dashboard.py              # Halaman Dashboard
  monitoring.py             # Halaman Monitoring CCTV
  detections.py             # Halaman Hasil Deteksi
  history.py                # Halaman Riwayat Plat
  statistics.py             # Halaman Statistik
  settings.py               # Halaman Pengaturan
  plate.py                  # API plat, wajah, kamera, dan stream
services/
  detection_service.py      # Penyimpanan hasil deteksi sementara
  stream_service.py         # CRUD kamera dan status stream
ai/plate/                   # Detector YOLO, OCR, dan utilitas plat
tracker.py                  # Tracking dan voting OCR
templates/index.html        # Satu template untuk semua menu
static/css/style.css        # Satu stylesheet bersama
static/js/app.js            # Satu JavaScript bersama untuk semua menu
```

## Cara kerja halaman

Setiap menu memiliki route Flask sendiri, tetapi semua route merender template yang sama dengan nilai `page` berbeda:

```python
return render_template("index.html", page="monitoring")
```

Di `templates/index.html`, blok Jinja memilih isi yang sesuai:

```jinja2
{% if page == 'monitoring' %}
    <!-- tampilan Monitoring CCTV -->
{% endif %}
```

Karena itu, jangan membuat file HTML baru untuk setiap menu. Edit bagian menu terkait di `templates/index.html`.

## Cara menambah fitur

- Mengubah tampilan: edit `templates/index.html`.
- Mengubah warna, layout, atau responsif: edit `static/css/style.css`.
- Mengubah interaksi halaman: edit `static/js/app.js`.
- Menambah URL halaman: buat atau ubah file di `routes/` lalu daftarkan blueprint di `app.py`.
- Menambah API: edit `routes/plate.py`.
- Mengubah penyimpanan hasil deteksi: edit `services/detection_service.py`.
- Mengubah CRUD kamera atau status stream: edit `services/stream_service.py`.
- Mengubah AI plat/OCR: edit folder `ai/plate/` dan `tracker.py`.

## Endpoint penting

| Endpoint | Fungsi |
| --- | --- |
| `/` atau `/dashboard` | Dashboard |
| `/monitoring` | Daftar kamera CCTV |
| `/detections` | Hasil deteksi gabungan |
| `/history` | Riwayat plat |
| `/statistics` | Statistik |
| `/settings` | Pengaturan |
| `/api/cameras` | CRUD kamera |
| `/api/plate/*` | API deteksi plat |
| `/api/face/*` | API deteksi wajah |
| `/api/stream/*` | Status, mulai, dan stop stream |

## Catatan data

Data kamera dan hasil deteksi saat ini disimpan di memori Python. Data akan kembali kosong saat Flask direstart. Untuk penggunaan bersama atau production, pindahkan penyimpanan ke SQLite/PostgreSQL dan tambahkan migration.
