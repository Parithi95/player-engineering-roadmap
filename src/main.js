import { registerMediaSourceEvents } from "./events/media-source-events.js";
import { registerSourceBufferEvents } from "./events/source-buffer-events.js";
import { H264_CODEC } from "./media/codec.js";
import { parseFragmentedMP4 } from "./media/mp4-parser.js";
import {
  inspectMediaSegment,
  parseMediaFragment,
} from "./media/segment-parser.js";
import { createMediaSource } from "./mse/media-source.js";
import { createSourceBuffer } from "./mse/source-buffer.js";
import { logger } from "./utils/logger.js";
import { AppendQueue } from "./mse/append-queue.js";

function initializePlayer() {
  const video = document.getElementById("video");

  if (!video) {
    throw new Error("Video element not found");
  }

  logger.info("Initializing player");

  const { mediaSource, objectURL } = createMediaSource(video);

  logger.info("MediaSource ready");
  logger.info("Object URL:", objectURL);

  registerMediaSourceEvents(mediaSource, {
    onSourceOpen() {
      logger.info("Creating SourceBuffer");

      try {
        const sourceBuffer = createSourceBuffer(mediaSource, H264_CODEC);

        const assetURL = "/assets/source/sample-h264-fmp4.mp4";

        logger.info("SourceBuffer created");
        logger.info("SourceBuffer mode:", sourceBuffer.mode);
        logger.info("SourceBuffer updating:", sourceBuffer.updating);
        logger.info("Buffered ranges:", sourceBuffer.buffered.length);

        registerSourceBufferEvents(sourceBuffer);

        async function loadMedia() {
          try {
            // 1. Download the fragmented MP4 file.
            const response = await fetch(assetURL);

            if (!response.ok) {
              throw new Error(`HTTP failed: ${response.status}`);
            }

            const data = await response.arrayBuffer();

            logger.info("Downloaded bytes:", data.byteLength);

            // 2. Parse the file into its initialization and media segments.
            const parsedMP4 = parseFragmentedMP4(data);

            logger.info("MP4 boxes:", parsedMP4.boxes);

            logger.info(
              "Initialization segment bytes:",
              parsedMP4.initSegment.byteLength,
            );

            logger.info(
              "Total media segments:",
              parsedMP4.mediaSegments.length,
            );

            // 3. Inspect the media fragments before appending.
            parsedMP4.mediaSegments.forEach((segment, index) => {
              logger.info(
                `Media segment ${index + 1}:`,
                inspectMediaSegment(segment),
              );

              logger.info("Fragment:", parseMediaFragment(segment));
            });

            // 4. Create one queue for this SourceBuffer.
            const appendQueue = new AppendQueue(sourceBuffer);

            // 5. Append the initialization segment first.
            await appendQueue.append(parsedMP4.initSegment);

            logger.info("Initialization segment appended");

            // 6. Append the media segments sequentially.
            for (
              let index = 0;
              index < parsedMP4.mediaSegments.length;
              index++
            ) {
              await appendQueue.append(parsedMP4.mediaSegments[index]);

              logger.info(`Media segment ${index + 1} appended successfully`);
            }

            // 7. Signal that no more media data will be supplied.
            if (mediaSource.readyState === "open") {
              mediaSource.endOfStream();
              logger.info("MediaSource ended successfully");
            }
          } catch (error) {
            logger.error("Failed to load or append media", error);
          }
        }

        loadMedia();
      } catch (error) {
        logger.error("Failed to create SourceBuffer", error);
      }
    },
  });
}

try {
  initializePlayer();
} catch (error) {
  logger.error("Player initialization failed", error);
}
