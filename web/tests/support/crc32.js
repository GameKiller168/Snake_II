'use strict';

/* CRC-32 (the one of zlib / PNG), used to compare whole LCD pictures with a single number. */

const TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  TABLE[n] = c >>> 0;
}

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** CRC-32 of a framebuffer, bits packed row by row, leftmost pixel in the top bit (numpy.packbits order). */
function pictureHash(fb) {
  const n = fb.w * fb.h;
  const bytes = new Uint8Array(Math.ceil(n / 8));
  for (let i = 0; i < n; i++) if (fb.px[i]) bytes[i >> 3] |= 0x80 >> (i & 7);
  return crc32(bytes);
}

module.exports = { crc32, pictureHash };
