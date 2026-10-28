const textDecoder = new TextDecoder();

export function parseMP4Boxes(data) {
  const view = new DataView(data);
  const boxes = [];

  let offset = 0;

  while (offset + 8 <= data.byteLength) {
    const size = view.getUint32(offset);

    const type = new TextDecoder().decode(new Uint8Array(data, offset + 4, 4));

    boxes.push({
      offset,
      size,
      type,
    });

    // A zero size means the box extends to the end of the containing data.
    if (size === 0) {
      boxes[boxes.length - 1].size = data.byteLength - offset;
      break;
    }

    // Prevent invalid box sizes from causing
    // an infinite loop.
    if (size < 8) {
      throw new Error(`Invalid MP4 box size: ${size} at offset ${offset}`);
    }

    if (offset + size > data.byteLength) {
      throw new Error(`MP4 box ${type} exceeds file boundary`);
    }

    offset += size;
  }

  return boxes;
}

export function extractInitializationSegment(data, boxes) {
  const ftyp = boxes.find((box) => box.type === "ftyp");
  const moov = boxes.find((box) => box.type === "moov");

  if (!ftyp || !moov) {
    throw new Error("MP4 initialization segment requires ftyp and moov boxes");
  }

  const start = ftyp.offset;
  const end = moov.offset + moov.size;

  return data.slice(start, end);
}

export function extractMediaSegments(data, boxes) {
  const mediaSegments = [];

  for (let i = 0; i < boxes.length; i++) {
    const box = boxes[i];

    if (box.type !== "moof") {
      continue;
    }

    const nextBox = boxes[i + 1];

    if (!nextBox || nextBox.type !== "mdat") {
      throw new Error(`Expected mdat after moof at offset ${box.offset}`);
    }

    const start = box.offset;
    const end = nextBox.offset + nextBox.size;

    mediaSegments.push(data.slice(start, end));
  }

  return mediaSegments;
}

export function parseFragmentedMP4(data) {
  const boxes = parseMP4Boxes(data);

  const initSegment = extractInitializationSegment(data, boxes);

  const mediaSegments = extractMediaSegments(data, boxes);

  return {
    boxes,
    initSegment,
    mediaSegments,
  };
}

export function parseMP4BoxesRecursive(
  data,
  start = 0,
  end = data.byteLength,
  depth = 0,
) {
  const view = new DataView(data);
  const boxes = [];

  let offset = start;

  while (offset + 8 <= end) {
    const size = view.getUint32(offset);

    const type = textDecoder.decode(new Uint8Array(data, offset + 4, 4));

    if (size === 0) {
      boxes.push({ offset, size: end - offset, type, depth });
      break;
    }

    if (size < 8) {
      throw new Error(`Invalid MP4 box size ${size} at offset ${offset}`);
    }

    if (offset + size > end) {
      throw new Error(`MP4 box exceeds parent boundary: ${type}`);
    }

    const box = {
      offset,
      size,
      type,
      depth,
    };

    boxes.push(box);

    offset += size;
  }

  return boxes;
}
