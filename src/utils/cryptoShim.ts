import CryptoJS from "crypto-js";
import { Buffer } from "buffer";

export function createHash(algorithm: string) {
  const chunks: Buffer[] = [];
  return {
    update(data: any) {
      if (typeof data === "string") {
        chunks.push(Buffer.from(data, "utf8"));
      } else if (Buffer.isBuffer(data)) {
        chunks.push(data);
      } else if (data instanceof Uint8Array || ArrayBuffer.isView(data)) {
        chunks.push(Buffer.from(data.buffer, data.byteOffset, data.byteLength));
      } else if (data instanceof ArrayBuffer) {
        chunks.push(Buffer.from(data));
      }
      return this;
    },
    digest(encoding?: string) {
      const full = Buffer.concat(chunks);
      const wordArray = CryptoJS.lib.WordArray.create(full as any);
      const alg = algorithm.toLowerCase().replace(/[^a-z0-9]/g, "");

      let hash: any;
      if (alg === "sha1") hash = CryptoJS.SHA1(wordArray);
      else if (alg === "md5") hash = CryptoJS.MD5(wordArray);
      else if (alg === "sha256") hash = CryptoJS.SHA256(wordArray);
      else if (alg === "sha512") hash = CryptoJS.SHA512(wordArray);
      else if (alg === "sha384") hash = CryptoJS.SHA384(wordArray);
      else hash = CryptoJS.SHA1(wordArray);

      const hex = hash.toString(CryptoJS.enc.Hex);
      if (encoding === "hex") return hex;
      return Buffer.from(hex, "hex");
    },
  };
}

export function randomBytes(size: number) {
  const buf = Buffer.alloc(size);
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(buf);
  } else {
    for (let i = 0; i < size; i++) {
      buf[i] = Math.floor(Math.random() * 256);
    }
  }
  return buf;
}

export class EventEmitter {
  private _events: Record<string, Function[]> = {};
  on(event: string, listener: Function) {
    (this._events[event] = this._events[event] || []).push(listener);
    return this;
  }
  addListener(event: string, listener: Function) {
    return this.on(event, listener);
  }
  once(event: string, listener: Function) {
    const g = (...args: any[]) => {
      this.removeListener(event, g);
      listener.apply(this, args);
    };
    return this.on(event, g);
  }
  emit(event: string, ...args: any[]) {
    const list = this._events[event] || [];
    list.slice().forEach((fn) => fn(...args));
    return list.length > 0;
  }
  removeListener(event: string, listener: Function) {
    const list = this._events[event] || [];
    this._events[event] = list.filter((fn) => fn !== listener);
    return this;
  }
  removeAllListeners(event?: string) {
    if (event) delete this._events[event];
    else this._events = {};
    return this;
  }
}

export class Stream extends EventEmitter {}

export const setImmediate = (fn: Function, ...args: any[]) => setTimeout(fn, 0, ...args);
export const clearImmediate = (id: any) => clearTimeout(id);

export default {
  createHash,
  randomBytes,
  EventEmitter,
  Stream,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  setImmediate,
  clearImmediate,
};
