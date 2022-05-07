import { createFixedBytesCodec } from "@ckb-lumos/codec/";

export const hashTypeCodec = createFixedBytesCodec<string>({
  byteLength: 1,
  pack: (type) => {
    const data = new DataView(new ArrayBuffer(1));
    if (type === "data") {
      data.setUint8(0, 0);
    } else if (type === "type") {
      data.setUint8(0, 1);
    } else if (type === "data1") {
      data.setUint8(0, 2);
    } else {
      throw new Error(`invalid hash type: ${type}`);
    }
    return new Uint8Array(data.buffer);
  },
  unpack: (buf) => {
    const data = new DataView(buf).getUint8(0);
    if (data === 0) {
      return "data";
    } else if (data === 1) {
      return "type";
    } else if (data === 2) {
      return "data1";
    } else {
      throw new Error("invalid data");
    }
  },
});
