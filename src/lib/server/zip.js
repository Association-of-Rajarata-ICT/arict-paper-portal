// Streams a ZIP archive without holding the files in memory. Entries are stored, not compressed:
// past papers are PDFs, which barely shrink, and storing keeps this small and fast. Sizes and
// CRCs follow each file in a data descriptor, so a file can be sent while it is still downloading.

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(crc, bytes) {
  let c = crc ^ 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function dosDateTime(date) {
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    date: ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

// Bit 3: sizes and CRC come after the data. Bit 11: file names are UTF-8.
const FLAGS = 0x0808;

function localHeader(name, stamp) {
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(FLAGS, 6);
  header.writeUInt16LE(0, 8);
  header.writeUInt16LE(stamp.time, 10);
  header.writeUInt16LE(stamp.date, 12);
  header.writeUInt16LE(name.length, 26);
  return Buffer.concat([header, name]);
}

function dataDescriptor(crc, size) {
  const descriptor = Buffer.alloc(16);
  descriptor.writeUInt32LE(0x08074b50, 0);
  descriptor.writeUInt32LE(crc, 4);
  descriptor.writeUInt32LE(size, 8);
  descriptor.writeUInt32LE(size, 12);
  return descriptor;
}

function centralRecord({ name, stamp, crc, size, offset }) {
  const record = Buffer.alloc(46);
  record.writeUInt32LE(0x02014b50, 0);
  record.writeUInt16LE(20, 4);
  record.writeUInt16LE(20, 6);
  record.writeUInt16LE(FLAGS, 8);
  record.writeUInt16LE(0, 10);
  record.writeUInt16LE(stamp.time, 12);
  record.writeUInt16LE(stamp.date, 14);
  record.writeUInt32LE(crc, 16);
  record.writeUInt32LE(size, 20);
  record.writeUInt32LE(size, 24);
  record.writeUInt16LE(name.length, 28);
  record.writeUInt32LE(offset, 42);
  return Buffer.concat([record, name]);
}

function endRecord(count, size, offset) {
  const record = Buffer.alloc(22);
  record.writeUInt32LE(0x06054b50, 0);
  record.writeUInt16LE(count, 8);
  record.writeUInt16LE(count, 10);
  record.writeUInt32LE(size, 12);
  record.writeUInt32LE(offset, 16);
  return record;
}

// entries: [{ name, open }] where open() resolves to an async-iterable of byte chunks (a web or
// Node stream). Files that fail to open are left out and listed in a note at the end.
async function* zipChunks(entries) {
  const stamp = dosDateTime(new Date());
  const written = [];
  const failed = [];
  let offset = 0;

  async function* writeEntry(name, source) {
    const nameBytes = Buffer.from(name, "utf8");
    const header = localHeader(nameBytes, stamp);
    yield header;
    let crc = 0;
    let size = 0;
    for await (const chunk of source) {
      const bytes = Buffer.from(chunk);
      crc = crc32(crc, bytes);
      size += bytes.length;
      yield bytes;
    }
    yield dataDescriptor(crc, size);
    written.push({ name: nameBytes, stamp, crc, size, offset });
    offset += header.length + size + 16;
  }

  for (const entry of entries) {
    let source;
    try {
      source = await entry.open();
    } catch {
      failed.push(entry.name);
      continue;
    }
    yield* writeEntry(entry.name, source);
  }

  if (failed.length) {
    const note = `These papers could not be downloaded. Please download them one by one from the portal:\r\n\r\n${failed.join("\r\n")}\r\n`;
    yield* writeEntry("Papers not included.txt", [Buffer.from(note, "utf8")]);
  }

  const central = Buffer.concat(written.map(centralRecord));
  yield central;
  yield endRecord(written.length, central.length, offset);
}

export function createZipStream(entries) {
  const chunks = zipChunks(entries);
  return new ReadableStream({
    async pull(controller) {
      try {
        const { value, done } = await chunks.next();
        if (done) controller.close();
        else controller.enqueue(new Uint8Array(value));
      } catch (error) {
        controller.error(error);
      }
    },
    async cancel() {
      await chunks.return();
    },
  });
}
