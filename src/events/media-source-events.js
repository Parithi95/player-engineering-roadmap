import { logger } from "../utils/logger.js";
import { MSE_EVENTS } from "../utils/mse-constants/mse-events.js";

export function registerMediaSourceEvents(mediaSource, callbacks = {}) {
  mediaSource.addEventListener(MSE_EVENTS.SOURCE_OPEN, () => {
    logger.info("MediaSource opened:", mediaSource.readyState);

    if (callbacks.onSourceOpen) {
      callbacks.onSourceOpen();
    }
  });

  mediaSource.addEventListener(MSE_EVENTS.SOURCE_ENDED, () => {
    logger.info("MediaSource ended:", mediaSource.readyState);

    if (callbacks.onSourceEnded) {
      callbacks.onSourceEnded();
    }
  });

  mediaSource.addEventListener(MSE_EVENTS.SOURCE_CLOSE, () => {
    logger.info("MediaSource closed:", mediaSource.readyState);

    if (callbacks.onSourceClose) {
      callbacks.onSourceClose();
    }
  });
}
