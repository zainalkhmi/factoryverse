# FactoryVerse Expert XR — Panduan Pengembangan Lengkap (End-to-End Master Guide)
### Panduan Langkah-demi-Langkah Membangun Platform Instruksi Kerja Industri WebXR dari Nol
**Meta VR Start Developer Competition 2026 · Track: Productivity**
*Teknologi: Meta Immersive Web SDK (IWSDK v1.1.0-rc.2), Three.js (`@iwsdk/core`), TypeScript, Vite, WebXR, UIKitML*

---

## 📑 Daftar Isi
1. [Pendahuluan & Konsep Arsitektur](#1-pendahuluan--konsep-arsitektur)
2. [Prasyarat & Setup Lingkungan Kerja](#2-prasyarat--setup-lingkungan-kerja)
3. [Inisialisasi Proyek Meta IWSDK](#3-inisialisasi-proyek-meta-iwsdk)
4. [Konfigurasi Otoritas IWSDK (`iwsdk.config.json`)](#4-konfigurasi-otoritas-iwsdk-iwsdkconfigjson)
5. [Pemodelan Data Domain (TypeScript)](#5-pemodelan-data-domain-typescript)
6. [Mesin Toleransi & State Machine Pelatihan](#6-mesin-toleransi--state-machine-pelatihan)
7. [Pemodelan 3D Prosedural Industri (Three.js)](#7-pemodelan-3d-prosedural-industri-threejs)
8. [Manifest Aset & Komponen ECS IWSDK](#8-manifest-aset--komponen-ecs-iwsdk)
9. [Sistem ECS WebXR (`AssemblySystem` & `XRTrainingSystem`)](#9-sistem-ecs-webxr-assemblysystem--xrtrainingsystem)
10. [Spatial UI dengan UIKitML](#10-spatial-ui-dengan-uikitml)
11. [Perintah Suara Hands-Free (Web Speech API)](#11-perintah-suara-hands-free-web-speech-api)
12. [Pemindai Barcode / QR / VuMark Mesin](#12-pemindai-barcode--qr--vumark-mesin)
13. [Aplikasi Desktop: FactoryVerse Studio](#13-aplikasi-desktop-factoryverse-studio)
14. [Testing Otomatis dengan Vitest Terisolasi](#14-testing-otomatis-dengan-vitest-terisolasi)
15. [Pengujian WebXR: Desktop Emulator & Meta Quest 3 Fisik](#15-pengujian-webxr-desktop-emulator--meta-quest-3-fisik)
16. [Build Produksi & Deployment Hosting Publik](#16-build-produksi--deployment-hosting-publik)

---

## 1. Pendahuluan & Konsep Arsitektur

**FactoryVerse Expert XR** adalah platform instruksi kerja dan simulasi pelatihan spasial industri yang menyamai kapabilitas **PTC Vuforia (Expert Capture, Studio, Vantage, dan Engine)**, namun dibangun 100% di atas teknologi WebXR terbuka tanpa lisensi proprietary atau vendor lock-in.

### Arsitektur Dual-Layer
Proyek ini mengadopsi pola arsitektur **Dual-Layer** yang berjalan dalam satu origin web:
```
┌────────────────────────────────────────────────────────────────────────┐
│                   LAYER 1: FactoryVerse Studio (Web)                   │
│  - Dashboard Eksekutif & KPI Kelulusan Operator                        │
│  - Visual Procedure Editor (Drag-and-Drop SOP + Gating + K3 Checklist) │
│  - Expert Capture (Perekam Video/Mic Demo Kerja + Konversi Otomatis)   │
│  - 3D CAD Library (Pemeriksa Komponen, Exploded View, Drag-Drop GLTF)  │
│  - Quality Lab (Kalkulator Toleransi 24.00 ± 0.10 mm)                  │
│  - Session Reports & E-Signature Supervisor (Segel SHA-256 CFR 21)     │
│  - Industrial Barcode / QR / VuMark Equipment Scanner                  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Komunikasi Data Bersama
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│               LAYER 2: FactoryVerse XR Player (Meta IWSDK)             │
│  - Seated 90° FOV Industrial Workbench (Meja Kerja Industri 2.4 x 1.2m)│
│  - Hands-First Proximity Snapping (Pinch & Snap Mating Batang Torak)   │
│  - 3D Animated Spatial Wayfinding Beacon (Pin Laser Panduan Langkah)   │
│  - CAD Model Target Guide View (Siluet Kawat Holografis Penyelarasan)  │
│  - Spatial UIKitML Panels (Panel Instruksi Horizon Dark Mengambang)   │
│  - Hands-Free Voice Commands ("Next", "Back", "Reset", "Pass", "Fail") │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Prasyarat & Setup Lingkungan Kerja

### Alat yang Diperlukan:
1. **Node.js**: Versi `20.19.0` atau yang lebih baru (disarankan Node.js LTS 22.x).
2. **NPM**: Versi 10.x+.
3. **Browser Kompatibel WebXR**: Google Chrome atau Microsoft Edge terbaru.
4. **Ekstensi Browser**: **Meta Immersive Web Emulator (IWER)** dari Chrome Web Store (untuk simulasi hand-tracking di PC).
5. **Headset Fisik (Opsional tapi Direkomendasikan)**: Meta Quest 3, Quest 2, atau Quest Pro dengan Meta Quest Browser.

---

## 3. Inisialisasi Proyek Meta IWSDK

Proyek Meta IWSDK menggunakan plugin Vite khusus dari Meta (`@iwsdk/vite-plugin`). Jangan membuat proyek dengan template Vite standar karena struktur virtual module dan scene-nya berbeda.

### Jalankan Scaffold Resmi:
```bash
# Di folder root kerja:
npx @iwsdk/create@latest factoryverse
cd factoryverse
npm install
```

### Konfigurasi `package.json`:
Pastikan script pengujian dan build terkonfigurasi dengan rapi:
```json
{
  "name": "factoryverse-expert-xr",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run --config vitest.config.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@iwsdk/core": "1.1.0-rc.2"
  },
  "devDependencies": {
    "@iwsdk/vite-plugin": "1.1.0-rc.2",
    "typescript": "^5.7.0",
    "vite": "^7.3.0",
    "vitest": "^3.2.0"
  }
}
```

---

## 4. Konfigurasi Otoritas IWSDK (`iwsdk.config.json`)

> ⚠️ **Aturan Kritis IWSDK:** Konfigurasi utama aplikasi dikendalikan oleh `iwsdk.config.json`, bukan `vite.config.ts`!

Buat atau sesuaikan file `iwsdk.config.json` pada root direktori:
```json
{
  "$schema": "./node_modules/@iwsdk/core/dist/schemas/iwsdk-project.v1.schema.json",
  "version": "iwsdk.project.v1",
  "scene": "./public/scenes/main.iwsdk.scene.json",
  "assets": {
    "module": "./src/assets"
  },
  "components": {
    "module": "./src/components"
  },
  "world": {
    "xr": {
      "mode": "vr",
      "offer": "always",
      "features": {
        "handTracking": true
      }
    },
    "input": {
      "canvasPointerEvents": true
    },
    "render": {
      "fov": 70,
      "near": 0.001,
      "far": 200,
      "camera": {
        "position": [0, 1.35, 0.3],
        "lookAt": [0, 1.05, -1.1]
      }
    },
    "features": {
      "locomotion": false,
      "grabbing": true,
      "physics": false,
      "spatialUI": {
        "kit": "horizon",
        "preferredColorScheme": "dark"
      }
    }
  },
  "dev": {
    "emulator": {
      "device": "metaQuest3"
    }
  }
}
```

---

## 5. Pemodelan Data Domain (TypeScript)

Buat tipe data terstruktur di `src/types/index.ts` untuk merepresentasikan seluruh entitas industri:
- `Procedure`: Berisi kode SOP, judul, kategori, estimasi waktu, daftar APD/K3, dan revisi.
- `ProcedureStep`: Langkah instruksi spesifik dengan tipe interaksi (`grab_and_seat`, `measure`), aturan inspeksi, dan toleransi.
- `EquipmentAsset`: Register mesin fisik dengan barcode/VuMark dan serial number.
- `TrainingSession`: Log pelaksanaan sesi pelatihan oleh operator, nilai akhir, dan segel audit.
- `SupervisorApproval`: Tanda tangan elektronik supervisor berstandar 21 CFR Part 11 dengan hash SHA-256.

---

## 6. Mesin Toleransi & State Machine Pelatihan

### A. Mesin Toleransi Kuantitatif (`src/inspection/inspection-engine.ts`)
Validasi matematis dimensi perakitan presisi (standar nominal: `24.00 mm`, toleransi: `±0.10 mm`, rentang lulus: `23.90 mm – 24.10 mm`):
```typescript
export function evaluateInspection(
  measuredValue: number | string,
  rule: InspectionRule = DEFAULT_CYLINDER_INSPECTION_RULE
): InspectionResult {
  const numVal = typeof measuredValue === 'string' ? parseFloat(measuredValue) : measuredValue;
  if (isNaN(numVal)) {
    return { passed: false, measuredValue: 0, deviation: 0, status: 'FAIL', message: 'Nilai numerik tidak valid.' };
  }
  const min = rule.nominalValue - rule.tolerance;
  const max = rule.nominalValue + rule.tolerance;
  const passed = numVal >= min && numVal <= max;
  const deviation = Number((numVal - rule.nominalValue).toFixed(4));
  return {
    passed,
    measuredValue: numVal,
    deviation,
    status: passed ? 'PASS' : 'FAIL',
    message: passed
      ? `PASS: Dimensi ${numVal.toFixed(2)} mm memenuhi toleransi nominal.`
      : `FAIL: Dimensi ${numVal.toFixed(2)} mm di luar batas yang diizinkan.`
  };
}
```

### B. State Machine Pelatihan (`src/training/training-engine.ts`)
Mengelola 5 langkah alur perakitan SOP:
1. `step-01`: Identifikasi Komponen & Pengecekan APD
2. `step-02`: Pemasangan Batang Torak (*Piston Rod Insertion*)
3. `step-03`: Pemasangan Tutup Ujung Kuningan (*Gland End Cap Seating*)
4. `step-04`: Pengukuran Celah Datum (*Tolerance Verification*)
5. `step-05`: Verifikasi & Tanda Tangan Supervisor

---

## 7. Pemodelan 3D Prosedural Industri (Three.js)

> ⚠️ **Aturan Kritis IWSDK:** Selalu impor Three.js dari `@iwsdk/core`, **JANGAN** dari paket `three` terpisah untuk mencegah duplikasi instance GPU context!

Di `src/scene-assets/cylinder-workstation.scene-asset.ts`, buat fungsi murni (deterministik dan tanpa side-effect) yang mengembalikan `Object3D`:
- `createWorkstationBench()`: Meja industri berat (2.4m x 1.2m x 0.08m) dengan 4 kaki baja kokoh dan baki part terbagi.
- `createCylinderBarrel()`: Tabung silinder hidrolik baja dengan flens pemasangan dan lubang bore berdiameter dalam 0.088m.
- `createPistonRod()`: Batang torak baja lapis krom keras (*hard chrome*) dengan kepala piston dan alur cincin seal.
- `createEndCap()`: Tutup ulir kelenjar kuningan dengan flens heksagonal 6 sisi.
- `createSpatialBeacon()`: Pin panduan optis melayang (*wayfinding beacon*) dengan kerucut laser cyan terbalik dan cincin target halo amber.
- `createModelTargetGuideView()`: Siluet kawat 3D CAD (*holographic wireframe contour*) dengan 4 braket retikel penyelarasan optis.

---

## 8. Manifest Aset & Komponen ECS IWSDK

### A. Manifest Aset (`src/assets.ts`)
Daftarkan seluruh geometri prosedural dan berkas layout UIKitML:
```typescript
import { AssetType, defineAssets } from '@iwsdk/core';
import {
  createCylinderBarrel,
  createEndCap,
  createInspectionFeature,
  createModelTargetGuideView,
  createPistonRod,
  createSealRing,
  createSpatialBeacon,
  createWorkstationBench,
} from './scene-assets/cylinder-workstation.scene-asset.js';

export default defineAssets({
  'workstation-bench': createWorkstationBench(),
  'cylinder-barrel': createCylinderBarrel(),
  'piston-rod': createPistonRod(),
  'end-cap': createEndCap(),
  'seal-ring': createSealRing(),
  'inspection-feature': createInspectionFeature(),
  'spatial-beacon': createSpatialBeacon(),
  'cad-guide-view': createModelTargetGuideView(),
  'training-panel': { url: './ui/training-panel.uikitml', type: AssetType.UIKitML, name: 'Training Panel' },
  'inspection-panel': { url: './ui/inspection-panel.uikitml', type: AssetType.UIKitML, name: 'Inspection Panel' },
  'score-panel': { url: './ui/score-panel.uikitml', type: AssetType.UIKitML, name: 'Score Panel' },
});
```

### B. Komponen ECS (`src/components.ts`)
Definisikan schema komponen bebas dari dependensi sistem:
```typescript
import { defineComponents, Types } from '@iwsdk/core';

export const AssemblyPart = 'AssemblyPart';
export const TrainingStation = 'TrainingStation';

export default defineComponents({
  AssemblyPart: {
    partId: { type: Types.String, default: '' },
    isAssembled: { type: Types.Boolean, default: false },
    stepOrder: { type: Types.Int, default: 0 },
  },
  TrainingStation: {
    stationId: { type: Types.String, default: 'station-01' },
    isOccupied: { type: Types.Boolean, default: false },
  },
});
```

---

## 9. Sistem ECS WebXR (`AssemblySystem` & `XRTrainingSystem`)

### A. `AssemblySystem` (`src/xr/assembly-system.ts`)
Bertanggung jawab atas:
1. **Pendeteksian Jarak & Proximity Snapping**: Jika operator melepas genggaman komponen pada radius < 0.35m dari fixture target, komponen otomatis terkunci (*snap*) pada posisi nominal.
2. **Animasi Spatial Waypoint Beacon**: Menggerakkan pin penunjuk 3D tepat di atas komponen aktif sesuai langkah SOP.
3. **Penyelarasan CAD Guide View**: Menghidupkan/mematikan siluet kawat CAD dan mengubah warnanya menjadi hijau saat komponen terpasang.

### B. `XRTrainingSystem` (`src/xr/xr-training-system.ts`)
Menghubungkan tombol fisik/ray pada panel UIKitML mengambang ke `TrainingEngine`.

---

## 10. Spatial UI dengan UIKitML

Buat dokumen antarmuka spasial di folder `public/ui/`:
- `public/ui/training-panel.uikitml`: Kartu instruksi langkah utama, badge APD/K3, dan indikator checkpoint.
- `public/ui/inspection-panel.uikitml`: Keypad digital untuk menginput nilai pengukuran datum (24.00 mm) dan tombol verifikasi.
- `public/ui/score-panel.uikitml`: Rekap skor kelulusan akhir, waktu penyelesaian, dan sertifikat kelulusan operator.

> 💡 *Tips:* Gunakan font MSDF standar dan hindari karakter non-ASCII seperti simbol panah `→` atau plus-minus `±` (gunakan `+/-` dan `->`) agar atlas MSDF IWSDK tidak menghasilkan warning rendering.

---

## 11. Perintah Suara Hands-Free (Web Speech API)

Di `src/xr/voice-command-service.ts`, bangun layanan pengenalan ucapan kontinu:
```typescript
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
// Kata kunci yang dikenali: "next", "previous", "reset", "pass", "fail", "guide", "wireframe"
```
Dengan fitur ini, operator dapat merakit komponen menggunakan kedua tangan dan menavigasi instruksi hanya dengan berbicara.

---

## 12. Pemindai Barcode / QR / VuMark Mesin

Di `src/studio/services/barcode-scanner-service.ts`:
- Membuka dialog pemindai AR optik dengan akses kamera video laptop/perangkat.
- Mengidentifikasi kode barcode mesin (`EQUIP-CYL-8821`, `PART-ROD-01`, `CALIB-GAUGE-24`).
- Secara otomatis membuka SOP yang bersangkutan dan langsung meluncurkan workstation WebXR.

---

## 13. Aplikasi Desktop: FactoryVerse Studio

Di `src/studio/`:
- `DashboardView.ts`: Menampilkan ringkasan metrik (88.5% first-time pass rate, jumlah sesi, dan tombol cepat masuk XR).
- `VisualProcedureEditorView.ts`: Editor prosedur 3 kolom (daftar langkah, editor detail + anotasi spasial, gerbang toleransi & checklist K3).
- `CaptureWorkspaceView.ts`: Merekam demonstrasi kerja ahli menggunakan webcam/mikrofon dan mengonversinya menjadi draft SOP.
- `ModelLibraryView.ts`: Penampil hierarki CAD 3D, toggle exploded view, dan uploader file GLTF/GLB kustom.
- `QualityInspectionView.ts`: Laboratorium toleransi dengan visualisasi batas atas/bawah.
- `SessionReportsView.ts`: Riwayat audit pelatihan dan tanda tangan digital supervisor berstandar 21 CFR Part 11 dengan segel SHA-256.

---

## 14. Testing Otomatis dengan Vitest Terisolasi

> ⚠️ **Catatan Penting Vitest:** `vite.config.ts` memuat plugin `iwsdkDev()` yang mengunci session runtime. Untuk pengujian unit independen yang cepat, gunakan file konfigurasi khusus `vitest.config.ts`.

Isi `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

Jalankan pengujian unit (20/20 tes harus lolos):
```bash
npm test
```

---

## 15. Pengujian WebXR: Desktop Emulator & Meta Quest 3 Fisik

### A. Pengujian Desktop (Meta Immersive Web Emulator - IWER)
1. Pasang ekstensi **Meta Immersive Web Emulator** di Google Chrome.
2. Buka DevTools (F12) > tab **Meta Quest Emulator**.
3. Pilih profil **Meta Quest 3** dan pilih mode input **Simulated Hands**.
4. Buka `https://localhost:8081` dan klik **"Launch XR Workstation"**.
5. Gunakan helper bar di bagian bawah untuk menguji pergantian langkah, toleransi PASS/FAIL, dan perintah suara.

### B. Pengujian Nirkabel di Meta Quest Fisik
1. Pastikan headset Meta Quest dan komputer dev berada di satu jaringan Wi-Fi yang sama.
2. Jalankan server dev yang mengikat semua antarmuka:
   ```bash
   npx vite --port 8081 --host 0.0.0.0
   ```
3. Di dalam Meta Quest, buka **Meta Quest Browser**.
4. Masukkan URL IP lokal: `https://<IP_KOMPUTER>:8081` (misal: `https://192.168.1.100:8081`).
5. Terima sertifikat self-signed lokal.
6. Klik **"Launch XR Workstation"** lalu klik **"Enter VR"**.
7. Letakkan controller dan gunakan tangan telanjang (*hand tracking*) untuk mencubit batang torak dan memasangkannya pada tabung silinder!

---

## 16. Build Produksi & Deployment Hosting Publik

### A. Kompilasi & Build Bundle Produksi
```bash
# 1. Pastikan tidak ada kesalahan tipe data:
npx tsc --noEmit

# 2. Bangun bundle teroptimasi:
npm run build
```
Hasil build akan tersimpan di direktori `dist/` dengan ukuran bundle terkompresi ~680 kB gzip.

### B. Deploy ke Vercel (Rekomendasi untuk Kontes)
WebXR mewajibkan koneksi aman **HTTPS**:
```bash
npm install -g vercel
vercel
```
Tentukan root `./` dan direktori output `dist`. URL HTTPS publik yang dihasilkan langsung siap dinilai oleh juri Devpost dan dapat diakses dari browser Meta Quest di seluruh dunia tanpa instalasi apa pun!

---
*FactoryVerse Expert XR — Mengubah Instruksi Kerja Pabrik Menjadi Pengalaman Spasial Imersif.*
