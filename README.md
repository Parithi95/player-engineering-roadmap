# Player Engineering Learning Project

This repository is a browser player learning project. The current implementation is a small Media Source Extensions (MSE) player that fetches one fragmented MP4 file, splits it into its initialization and media segments, and appends those segments to a `<video>` element.

## Run the current player

Serve the repository root over HTTP (ES modules and `fetch()` do not work reliably from `file://`). For example, with Python installed:

```sh
python -m http.server 8000
```

Open `http://localhost:8000` in a browser that supports MSE and H.264 in MP4. The video controls are in the page. The sample URL is selected in `src/main.js`.

## Current folder map

```text
assets/
  source/       MP4 learning and playback samples
  videos/       additional video samples
handbook/       concepts and notes, currently Module-1
labs/mse/       space for staged MSE exercises
src/
  main.js       player entry point and current orchestration
  errors/       player error types (planned; currently empty)
  events/       MediaSource and SourceBuffer event registration
  media/        codec string and MP4/fragment inspection helpers
  mse/          MediaSource and SourceBuffer construction
  network/      HTTP loader (planned; currently empty)
  playback/     playback controls/events (planned; currently empty)
  utils/        logging and MSE event-name constants
index.html      video element and JavaScript module entry
```

## Playback flow

1. `index.html` creates the `<video id="video">` element and loads `src/main.js` as an ES module.
2. `main.js` finds the video element and calls `createMediaSource()`.
3. `src/mse/media-source.js` creates a `MediaSource`, makes a blob URL, and assigns it to `video.src`.
4. The browser dispatches `sourceopen` once the MediaSource is attached and ready. `src/events/media-source-events.js` forwards this event to `main.js`.
5. `src/mse/source-buffer.js` creates an H.264 MP4 `SourceBuffer` after checking that the browser supports that MIME/codec string.
6. `main.js` fetches the sample and `src/media/mp4-parser.js` identifies the top-level MP4 boxes. It extracts `ftyp` + `moov` as the initialization segment and pairs each `moof` + following `mdat` as a media segment.
7. The player appends the initialization segment, then appends each media segment only after the previous append's `updateend` event. A SourceBuffer can process only one append at a time.
8. When all appends complete, the player calls `mediaSource.endOfStream()`. The browser can then play the buffered media through the video element's native controls.

`src/media/segment-parser.js` is a learning aid for inspecting fragment boxes (`moof`, `traf`, `tfhd`, `tfdt`, `trun`, and `mdat`). It does not decode or rewrite the media; the browser's MSE implementation does that.

## Current scope

This is a single-file, whole-download demo, not an adaptive streaming player. It does not yet implement incremental network loading, HLS/DASH manifests, bitrate selection, seeking-aware segment requests, DRM, or a custom playback controller. The `network/`, `playback/`, and `errors/` folders are placeholders for those learning steps.

## Learning roadmap

Use the working MSE demo as the starting point, then grow it in stages:

1. HTTP, networking, and browser fundamentals.
2. Audio/video fundamentals: frames, resolution, bitrate, frame rate, codecs, and containers.
3. MP4, ISO BMFF, fragmented MP4, and CMAF.
4. HTML video APIs, fullscreen, Picture-in-Picture, and Media Session.
5. MSE lifecycle, buffering, and safe append/remove operations.
6. HLS and DASH parsing, then adaptive bitrate selection.
7. Encrypted Media Extensions and DRM systems.
8. Player architecture, buffering strategy, and error recovery.
9. Turn the player into a reusable SDK; later explore TV platforms such as Tizen, webOS, and Android TV.
