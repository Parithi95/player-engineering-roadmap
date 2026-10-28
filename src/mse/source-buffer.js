export function createSourceBuffer(mediaSource, mimeCodec) {
  if (!mediaSource) {
    throw new Error("Media Source Required");
  }

  if (!mimeCodec) {
    throw new Error("MIME codec is required");
  }

  if (mediaSource.readyState !== "open") {
    throw new Error(
      `Cannot create SourceBuffer. MediaSource state: ${mediaSource.readyState}`,
    );
  }

  const isSupported = MediaSource.isTypeSupported(mimeCodec);

  if (!isSupported) {
    throw new Error(`Unsupported MIME type: ${mimeCodec}`);
  }

  const sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);

  return sourceBuffer;
}
