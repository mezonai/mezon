# Mezon-NS integration

The web engine is based on `mezonai/mezon-ns` main at commit
`3f4b6993676497c58466a8d7e4b9484cde70bddc` (`add vad gate`). The bundled model
comes from `checkpoints/mezon_ns.onnx`, updated in commit `c6a774f`.
Its SHA-256 is `839dbf3f48a77204267a4809e1d98ed28bb0a1007d32fb012fa54bb39f88ae41`.

VAD retains the upstream adaptive RMS noise floor, SNR threshold of 2.5,
smoothed attack/release, and `0.01 + 0.99 * vadState ** 1.5` gain on the
spectral mask. It defaults to enabled; an explicit `enableNoiseGate: false`
is still honored. Suppression gamma remains 1.6. This is an energy-based
gate, not a separate speech classifier.

## Noise toggle behavior

-   Prepare the pipeline when microphone capture starts, even with noise OFF.
    Cache downloaded model bytes and preload imports. Each live microphone has
    its own ONNX session and recurrent state; a toggle reuses that session.
-   Keep echo cancellation enabled. In normal operation, native NS, AGC, and
    voice isolation are disabled. OFF uses the same microphone/output track
    in raw bypass mode; inference continues so ON does not relearn the background.
-   An OFF → ON request preserves the user's microphone intent and immediately
    blocks the processed output track or detaches a raw sender. No raw track is
    published while noise is requested but not ready. Mic capture remains active
    when the user was speaking, so ONNX/VAD can process live input.
-   A private analysis clone also allows preparation when the user was already
    muted. It is never attached to a sender or recorder. It stops receiving input
    after preparation if the user is still muted. The browser/macOS microphone-use
    indicator can remain on during preparation.
-   The worklet flushes queued output and ignores replies from earlier mode
    requests. ON is acknowledged only after two fresh processed frames have
    arrived. Initial startup also discards six inference frames (60 ms) to let
    the analysis window/model see live input before readiness.
-   After the acknowledged mode is attached, automatically restore outgoing audio
    only if the latest mic/PTT intent is enabled. A mic muted before or during
    preparation stays muted; a released PTT press is never restarted. A new unmute
    attempt during preparation is not queued. Fade restored output in over 20 ms;
    ON never blends in raw audio, including underruns.
-   The footer profile displays preparation and success after the acknowledged
    mode is applied. Mic/PTT buttons keep their appearance and user intent stable
    while blocking early activation. Speaking detection and recording use the
    same readiness/output path.
-   Outside mode preparation, ordinary user mute disables both
    capture tracks and output. After warmup, skip inference on muted input to
    save CPU and preserve learned state. Stop the private clone on disposal.
-   A model/processor error or readiness timeout turns the button OFF and restores
    native microphone processing. If ON failed, mute the mic and show a warning;
    never silently resume an unfiltered mic after failed application.
    A later ON retries initialization. Pending requests cannot restore old modes.

Readiness means audio has actually passed through ONNX and the VAD/mask path;
it does not guarantee that every noise type is removed or that the adaptive
noise floor is fully calibrated. The original VAD coefficients are unchanged.

## Local adaptations and checks

Model gains are clamped to `[0, 1]` before gamma shaping: WASM rounding can
produce tiny negative sigmoid values during silence, which otherwise turn
into `NaN` with fractional gamma. Non-finite masks/audio fail explicitly.
Inference is serial with a bounded queue. Missing filtered samples produce
silence and refill a two-frame jitter buffer instead of leaking raw audio.

Model/worklet URLs carry an asset version. Update `ASSET_VERSION` in
`MezonNsAudioPipeline.ts` whenever replacing these assets. Session disposal
waits for inference to finish; pending mode requests settle on cancellation.

Run the focused checks from the repository root:

```sh
node --test libs/components/src/lib/components/MezonSfuVoiceChannel/MyVideoConference/Media/mezonNs/*.test.cjs
```

Checks cover the real bundled ONNX model, gate attack/release/reset, rounding,
worklet buffering/readiness/fade, and pipeline/room publishing callbacks.
They exercise rapid toggles, mute during preparation, explicit release,
failed downloads, failure/timeout, initialization in bypass mode, atomic visible
mic-intent preservation, rejected early unmute, automatic resume, user mute during
preparation, and live private analysis of a previously muted mic.

A browser call check is still required for acoustic feedback and device behavior:
use two participants to verify background noise, soft speech, rapid toggles,
mute/PTT during preparation, microphone changes, and reconnect/leave.

## Visible status

Status appears only in the footer profile, in the fixed-height line below the
user's name. A compact spinner changes to a green success check after actual
readiness, stays visible for 1.2 seconds, and fades over 300 ms back to the user's
custom status. The profile, voice panel, and call controls do not resize. Presentation
timers never delay audio readiness or automatic resume. Cancellation, a new mode
request, and unmount clear old timers. No success is shown merely because the
component mounts with an already configured call. English and Vietnamese are included.

Temporary debug logs, audio meters, and diagnostic counters have been removed.
Warnings remain for processing failures, sender updates, and inference backlog.
