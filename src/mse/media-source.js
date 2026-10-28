export function createMediaSource(video) {
  if (!video) {
    throw new Error("Video element is required");
  }

  if (!("MediaSource" in window)) {
    throw new Error("MediaSource API is not supported");
  }

  const mediaSource = new MediaSource();

  const objectURL = URL.createObjectURL(mediaSource);

  video.src = objectURL;

  return {
    mediaSource,
    objectURL,
  };
}
