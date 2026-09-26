Mezon-NS assets are based on `mezonai/mezon-ns` main at commit
`3f4b6993676497c58466a8d7e4b9484cde70bddc`:

-   `checkpoints/mezon_ns.onnx` -> `mezon_ns.onnx`, model updated at `c6a774f`.
    SHA-256: `839dbf3f48a77204267a4809e1d98ed28bb0a1007d32fb012fa54bb39f88ae41`.
-   `web/public/mezon-ns-processor.js` -> `mezon-ns-processor.js`, adapted locally
    for acknowledged mode changes, output gating, per-sample fade, startup/jitter
    buffering, and silence rather than raw fallback while denoising is ON.

The ONNX Runtime Web 1.20.1 WASM/MJS files come from the npm package's `dist/`
directory. Keep them aligned with `onnxruntime-web` in `package.json`.

Engine and integration details, including the focused regression command, are in
`libs/components/src/lib/components/MezonSfuVoiceChannel/MyVideoConference/Media/mezonNs/README.md`.
