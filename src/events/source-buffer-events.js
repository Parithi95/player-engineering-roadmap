import { logger } from "../utils/logger.js";
import { SOURCE_BUFFER_EVENTS } from "../utils/mse-constants/mse-events.js";

export function registerSourceBufferEvents(sourceBuffer) {
  sourceBuffer.addEventListener(SOURCE_BUFFER_EVENTS.UPDATE_START, () => {
    logger.info("Append started", {
      updating: sourceBuffer.updating,
    });
  });
  sourceBuffer.addEventListener(SOURCE_BUFFER_EVENTS.UPDATE_END, () => {
    logger.info("Append operation ended", {
      updating: sourceBuffer.updating,
      bufferedRanges: sourceBuffer.buffered.length,
    });
  });
  sourceBuffer.addEventListener(SOURCE_BUFFER_EVENTS.UPDATE, () => {
    logger.info("Append succeeded", {
      updating: sourceBuffer.updating,
      bufferedRanges: sourceBuffer.buffered.length,
    });
  });
  sourceBuffer.addEventListener(SOURCE_BUFFER_EVENTS.ERROR, (e) => {
    logger.error("Asynchronous SourceBuffer error", e);
  });
  sourceBuffer.addEventListener(SOURCE_BUFFER_EVENTS.ABORT, () => {
    logger.info("SourceBuffer operation aborted");
  });
}
