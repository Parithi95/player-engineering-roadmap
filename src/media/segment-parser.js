const textDecoder = new TextDecoder();

function readBoxHeader(data, offset) {
  const view = new DataView(data);

  if (offset + 8 > data.byteLength) {
    throw new Error("Not enough data for MP4 box header");
  }

  const size = view.getUint32(offset);

  const type = textDecoder.decode(new Uint8Array(data, offset + 4, 4));

  if (size < 8) {
    throw new Error(`Invalid MP4 box size: ${size}`);
  }

  if (offset + size > data.byteLength) {
    throw new Error(`MP4 box exceeds segment boundary: ${type}`);
  }

  return {
    size,
    type,
  };
}

export function inspectMediaSegment(segment) {
  const boxes = [];

  let offset = 0;

  while (offset + 8 <= segment.byteLength) {
    const { size, type } = readBoxHeader(segment, offset);

    boxes.push({
      offset,
      size,
      type,
    });

    offset += size;
  }

  return boxes;
}

function parseChildBoxes(data, start, end) {
  const boxes = [];

  let offset = start;

  while (offset + 8 <= end) {
    const { size, type } = readBoxHeader(data, offset);

    if (offset + size > end) {
      throw new Error(`Child box ${type} exceeds parent box`);
    }

    boxes.push({
      offset,
      size,
      type,
    });

    offset += size;
  }

  return boxes;
}

function findBox(boxes, type) {
  return boxes.find((box) => box.type === type);
}

export function parseMediaFragment(segment) {
  const topLevelBoxes = inspectMediaSegment(segment);

  const moof = findBox(topLevelBoxes, "moof");

  const mdat = findBox(topLevelBoxes, "mdat");

  if (!moof) {
    throw new Error("Media segment does not contain moof");
  }

  if (!mdat) {
    throw new Error("Media segment does not contain mdat");
  }

  const moofStart = moof.offset + 8;

  const moofEnd = moof.offset + moof.size;

  const moofChildren = parseChildBoxes(segment, moofStart, moofEnd);

  const mfhd = findBox(moofChildren, "mfhd");

  const traf = findBox(moofChildren, "traf");

  let trafChildren = [];

  if (traf) {
    const trafStart = traf.offset + 8;

    const trafEnd = traf.offset + traf.size;

    trafChildren = parseChildBoxes(segment, trafStart, trafEnd);
  }

  const tfhd = findBox(trafChildren, "tfhd");

  const tfdt = findBox(trafChildren, "tfdt");

  const trun = findBox(trafChildren, "trun");

  return {
    topLevel: topLevelBoxes,
    moof: {
      box: moof,
      children: moofChildren,
    },
    traf: {
      box: traf ?? null,
      children: trafChildren,
    },
    fragment: {
      mfhd: mfhd ?? null,
      tfhd: tfhd ?? null,
      tfdt: tfdt ?? null,
      trun: trun ?? null,
    },
    mdat,
  };
}
