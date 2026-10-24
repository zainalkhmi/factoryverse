# FactoryVerse Expert XR — Deployment & Hosting Guide
**Meta VR Start Developer Competition 2026 · Productivity Track**

---

## 1. Hosting Requirements for WebXR

WebXR applications mandate strict security requirements:
- **Mandatory HTTPS:** The WebXR Device API is exclusively available in secure contexts (`https://` or `localhost`). Unencrypted HTTP will disable VR entry buttons.
- **Microphone Permissions:** Hands-free voice commands require `microphone` permissions over HTTPS.
- **Cross-Origin Isolation (Optional):** Required only if WebAssembly multi-threading is enabled.

---

## 2. Production Build

To create an optimized production bundle:
```bash
npm run build
```
The output is written to the `dist/` directory, containing:
- Bundled and minified Three.js / IWSDK JavaScript
- Compiled CSS design system
- Asset manifests and spatial `.uikitml` templates
- Static scene configurations

---

## 3. Deploying to Vercel (Recommended)

Vercel provides automated SSL/TLS certificates and global CDN distribution.

### Option A: Via Vercel CLI
```bash
npm install -g vercel
vercel
```
Follow the interactive prompts:
- Root directory: `./`
- Build command: `npm run build`
- Output directory: `dist`

### Option B: `vercel.json` Configuration
Create `vercel.json` in the project root:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Feature-Policy", "value": "xr-spatial-tracking 'self'" }
      ]
    }
  ]
}
```

---

## 4. Deploying to GitHub Pages

1. In `vite.config.ts`, verify the `base` configuration matches your repository name:
   ```ts
   base: '/factoryverse/'
   ```
2. Build and push to the `gh-pages` branch using the `gh-pages` utility:
   ```bash
   npx gh-pages -d dist
   ```
3. Enable GitHub Pages in your repository settings under **Settings > Pages > Source > gh-pages branch**.
4. In GitHub Pages settings, enforce **"Enforce HTTPS"**.

---

## 5. Meta Horizon Store & PWA Packaging

FactoryVerse is packaged as a Progressive Web App (PWA) compatible with the **Meta Horizon Store**:
- **Web App Manifest:** `public/manifest.json` defines standalone display mode, orientation, and 512x512 app icons.
- **Trusted Web Activity (TWA):** Can be packaged into an APK using Google Bubblewrap or the Meta Quest Browser PWA tool.
- **Auto-Enter XR:** Supports the `immersive-vr` WebXR session request upon app launch for zero-friction VR immersion.
