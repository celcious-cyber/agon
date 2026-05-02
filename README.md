# 🏆 AGON - Competition Management System

**AGON** adalah sistem manajemen perlombaan modern yang dirancang untuk menangani berbagai format kompetisi, mulai dari penilaian berbasis poin hingga sistem **Tournament Bracket** yang fleksibel.

![AGON Dashboard](https://img.shields.io/badge/AGON-Premium_UI-blueviolet?style=for-the-badge)
![Vue 3](https://img.shields.io/badge/Vue_3-42b883?style=for-the-badge&logo=vue.js&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ec98e?style=for-the-badge&logo=supabase&logoColor=white)

## 🚀 Fitur Utama

### 1. Flexible Bracket System (Multi-Regu)
*   **Dukungan 2-5 Regu/Match**: Cocok untuk format 1v1 (Dual), Cerdas Cermat (Triple/Quad), hingga pertandingan massal (Penta).
*   **Auto-BYE Handling**: Algoritma cerdas yang otomatis menangani jumlah peserta ganjil.
*   **Dynamic Visual Tree**: Bagan pertandingan yang merender cabang secara dinamis berdasarkan jumlah peserta per pertandingan.

### 2. Live Center (Real-Time Sync)
*   **Live Bracket**: Halaman publik untuk penonton yang terupdate secara instan saat juri/admin memasukkan hasil pertandingan.
*   **Supabase Realtime**: Sinkronisasi data tanpa perlu refresh halaman.

### 3. Premium Admin Control Center
*   **Dashboard Modern**: Statistik real-time mengenai jumlah peserta, institusi, dan distribusi jenjang (SD/SMP/SMA).
*   **Quick Actions**: Navigasi cepat untuk manajemen peserta, penjurian, dan pengaturan kategori.
*   **Glassmorphism UI**: Antarmuka bersih dengan estetika modern menggunakan Naive UI.

### 4. Comprehensive Judging
*   **Scoring Board**: Penilaian berbasis kriteria untuk lomba non-bracket.
*   **Bracket Manager**: Kendali penuh untuk melakukan *reset* pemenang atau mengubah struktur bagan.

## 🛠️ Tech Stack

*   **Frontend**: Vue 3 (Composition API), Vite, Naive UI
*   **State Management**: Pinia
*   **Backend & Database**: Supabase (PostgreSQL, Realtime, Auth)
*   **Icons**: Ionicons 5

## 📦 Instalasi

1. Clone repositori:
   ```bash
   git clone https://github.com/your-username/agon.git
   ```
2. Install dependensi:
   ```bash
   npm install
   ```
3. Konfigurasi `.env`:
   Buat file `.env` dan tambahkan kredensial Supabase Anda:
   ```env
   VITE_SUPABASE_URL=your_url
   VITE_SUPABASE_ANON_KEY=your_key
   ```
4. Jalankan mode pengembangan:
   ```bash
   npm run dev
   ```

---
Dibuat dengan ❤️ untuk para juara.
