# 06 — Audio Upload Spec

> Status: **Placeholder.** Upload is **UI-only** today (`CreateFlow` shows a mock
> file). No real upload, recording, or storage is implemented.

## Scope

Define how a creator provides their voice story: file upload and/or in-app
recording, validation, and storage.

## Requirements (draft)

- Accept common audio formats (mp3, m4a, wav).
- Max file size / max duration limits (target reels are 60–90s).
- In-browser recording option (MediaRecorder) for mobile.
- Client-side validation + progress UI (the mock UI already exists).
- Storage via Supabase Storage; return an asset reference for the pipeline.

## Edge cases

> TODO: silence/very short audio, unsupported codecs, network interruption,
> background noise warnings.

## TODO

- [ ] Define accepted formats + limits.
- [ ] Define storage bucket layout and naming.
- [ ] Define the upload → transcription handoff.
- [ ] Wire the existing `AudioUploadScreen` UI to real upload (later).
