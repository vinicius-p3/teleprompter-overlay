# Security — Teleprompter Overlay

Summary of the app’s security review (v1.2.0).

## General posture

* **No network.** The app does not make any network requests, has no telemetry, and does not send data anywhere. It works 100% offline.
* **Local content only.** It only loads embedded files (`loadFile`); it does not open remote pages or allow navigation outside the app.
* **Data stays on your PC.** The script and preferences are saved locally (app storage, in the user data folder on Windows). They never leave the machine.
* **No third-party runtime dependencies.** The packaged app contains only the project source files + the Electron runtime. `npm audit`: **0 vulnerabilities**.

## Applied protections (Electron best practices)

* `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` — the renderer is isolated from Node.
* `webSecurity: true` and a **restrictive Content-Security-Policy** (`default-src 'none'`, scripts/styles only from the app’s own origin) — blocks the execution of external content.
* Blocking of new windows (`setWindowOpenHandler` → deny) and navigation (`will-navigate` / `will-redirect`).
* The script text is displayed via `textContent` (never `innerHTML`) — no risk of injection from pasted content.
* **Electron 42.x** (updated Chromium). Periodic updates are recommended: `npm install electron@latest -D` and rebuild.

## Distribution points of attention

* **Executable is not digitally signed.** On first launch, Windows shows the SmartScreen warning
  ("More info" → "Run anyway"). This is expected for apps without a signing certificate
  (signing is paid). It does not indicate malware.
* **Integrity verification:** distribute the `.exe` files through a trusted channel (internal network, company Drive)
  and check the **SHA-256** below before running. To check it in PowerShell:

  ```powershell
  Get-FileHash "Teleprompter Setup 1.2.0.exe" -Algorithm SHA256
  ```

### SHA-256 of this build (v1.2.0)

```
Teleprompter Setup 1.2.0.exe   4A91345EF04CAC86F3E8473EFCDEE68F12D4B0F132A76F8573DF87CEADC7F5DD
Teleprompter-portable.exe      483F558AD8E7A2F74C6E3D2E7ACE6EAD5467351275B805BE49134B6EBF0EBA5F
```

> Hashes change with every new build. Regenerate them with the command above after rebuilding.
