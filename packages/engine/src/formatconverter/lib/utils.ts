/*
 * ===========================
 * Encrypt and decrypt
 * ===========================
 */
import CryptoJS from "crypto-js";

import {
  M_ALGORITHM_NAME,
  M_CHECKSUM,
  M_CHECKSUM_TYPE,
  M_ITERATION_COUNT,
  M_KEY_DERIVATION_NAME,
  M_IV,
  M_KEY_SIZE,
  M_SALT,
} from "./constant";
/**
 *
 * @param {String} content
 * @param {*} options
 * @return {String}
 */
export function encrypt(content, options) {
  const keyConfig = {
    keySize: options.keySize,
    hasher: CryptoJS.algo.SHA512,
    iterations: options.iterationCount,
  };
  const key = CryptoJS.PBKDF2(options.password, options.salt, keyConfig);
  const res = CryptoJS.AES.encrypt(content, key, {
    iv: options.iv,
  });
  return res;
}
const uuidMap: any = {};
export function UUID(jsonUUID?, jsonToXMind?) {
  if (jsonUUID && uuidMap[jsonUUID]) {
    return uuidMap[jsonUUID];
  }
  const toReplacedString = jsonToXMind
    ? "xxxyxxxxxxxyxxxxxxxxxyxxxx"
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
  const newUUID = toReplacedString.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 3) | 8;
    return v.toString(16);
  });
  if (jsonUUID) {
    return (uuidMap[jsonUUID] = newUUID);
  } else {
    return newUUID;
  }
}
export function isXapResource(resourceStr) {
  if (typeof resourceStr !== "string") {
    return false;
  }
  return resourceStr.indexOf("xap:resources/") === 0;
}
export function isFileProtocol(resourceStr) {
  try {
    const url = new URL(resourceStr);
    return url.protocol === "file:";
  } catch {
    return false;
  }
}
/**
 *
 * @param {String} content
 * @param {String} options
 * @return {CryptoJS.DecryptedMessage}
 */
export function decrypt(content, options) {
  const keyConfig = {
    keySize: options.keySize,
    hasher: CryptoJS.algo.SHA512,
    iterations: options.iterationCount,
  };
  const key =
    options.keyDerivationName === "PKCS12"
      ? generateOldKey(
          options.password,
          options.salt,
          options.iterationCount,
          options.keySize,
        )
      : CryptoJS.PBKDF2(options.password || "", options.salt, keyConfig);
  const result = CryptoJS.AES.decrypt(content, key, {
    iv: options.iv,
  });
  return result;
}
export function generateNewOptions(password) {
  return {
    password: password,
    keySize: 4,
    iterationCount: 1024,
    salt: CryptoJS.enc.Base64.parse("").random(8),
    iv: CryptoJS.enc.Base64.parse("").random(16),
    algorithmName: "AES/CBC/PKCS5Padding",
    keyDerivationName: "PBKDF2WithHmacSHA512",
    checksumType: "MD5",
  };
}
export function generateOptions(password, ed) {
  if (ed) {
    return {
      password: password,
      checksum: ed[M_CHECKSUM],
      checksumType: ed[M_CHECKSUM_TYPE],
      iterationCount: ed[M_ITERATION_COUNT],
      algorithmName: ed[M_ALGORITHM_NAME],
      keyDerivationName: ed[M_KEY_DERIVATION_NAME],
      keySize: (ed[M_KEY_SIZE] || 128) / 32,
      salt: CryptoJS.enc.Base64.parse(ed[M_SALT]),
      iv:
        (ed[M_IV] && CryptoJS.enc.Base64.parse(ed[M_IV])) ||
        CryptoJS.lib.WordArray.create([0, 0, 0, 0]),
    };
  } else {
    return generateNewOptions(password);
  }
}
export function generateOldKey(password, salt, iterations, keySize) {
  let kb: any[] = [];
  const u = 16;
  const v = 64;
  const db: any[] = [];
  for (let i = 0; i < v; i++) {
    db.push(1);
  }
  const rawSb = wordToByteArray(salt.words);
  let sb: any[] = [];
  for (
    let i = 0;
    i < (Math.floor((v + rawSb.length - 1) / v) * v) / rawSb.length;
    i++
  ) {
    sb = sb.concat(rawSb);
  }
  const rawPb: any[] = [];
  for (let i = 0; i < password.length; i++) {
    const charCode = password.charCodeAt(i);
    rawPb.push(charCode >> 8);
    rawPb.push(charCode);
  }
  rawPb.push(0); //pad 2
  rawPb.push(0);
  let pb: any[] = [];
  while (pb.length < v) {
    pb = pb.concat(rawPb);
  }
  if (pb.length !== v) {
    pb = pb.slice(0, 64);
  }
  const ib = sb.concat(pb);
  const n = keySize * 4;
  const c = Math.floor((n + u - 1) / u);
  for (let i = 1; i <= c; i++) {
    let aw = CryptoJS.MD5(
      CryptoJS.lib.WordArray.create(byteArrayToWord(db.concat(ib))),
    );
    for (let j = 1; j < iterations; j++) {
      aw = CryptoJS.MD5(aw);
    }
    let bw: any[] = [];
    for (let j = 0; j < v / aw.sigBytes; j++) {
      bw = bw.concat(aw.words);
    }
    const bb = wordToByteArray(bw);
    for (let j = 0; j < ib.length / v; j++) {
      //adjust
      let x = (bb[bb.length - 1] & 255) + ib[j * v + bb.length - 1] + 1;
      ib[j * v + bb.length - 1] = x;
      x >>= 8;
      for (let k = bb.length - 2; k >= 0; k--) {
        x += (bb[k] & 255) + (ib[j * v + k] & 255);
        ib[j * v + k] = x;
        x >>= 8;
      }
    }
    kb = kb.concat(wordToByteArray(aw.words));
  }
  return CryptoJS.lib.WordArray.create(byteArrayToWord(kb));
}
export function generateEncryptData(appliedEncryptOptions) {
  return {
    [M_ITERATION_COUNT]: appliedEncryptOptions.iterationCount,
    [M_ALGORITHM_NAME]: appliedEncryptOptions.algorithmName,
    [M_KEY_DERIVATION_NAME]: appliedEncryptOptions.keyDerivationName,
    [M_KEY_SIZE]: appliedEncryptOptions[M_KEY_SIZE] * 32 || 128,
    [M_SALT]: CryptoJS.enc.Base64.stringify(appliedEncryptOptions[M_SALT]),
    [M_IV]: CryptoJS.enc.Base64.stringify(appliedEncryptOptions[M_IV]),
  };
}
export function wordToUint8Array(wordArray) {
  // Shortcuts
  const words = wordArray.words;
  const sigBytes = wordArray.sigBytes;
  // Convert
  const u8 = new Uint8Array(sigBytes);
  for (let i = 0; i < sigBytes; i++) {
    const byte = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 255;
    u8[i] = byte;
  }
  return u8;
}
export function wordToByteArray(wordArray) {
  const byteArray: any[] = [];
  let word;
  let i;
  let j;
  for (i = 0; i < wordArray.length; ++i) {
    word = wordArray[i];
    for (j = 3; j >= 0; --j) {
      byteArray.push((word >> (j * 8)) & 255);
    }
  }
  return byteArray;
}
export function uint8ArrayToWordArray(u8Array) {
  // Shortcut
  const len = u8Array.length;
  // Convert
  const words: any[] = [];
  for (let i = 0; i < len; i++) {
    words[i >>> 2] |= (u8Array[i] & 255) << (24 - (i % 4) * 8);
  }
  return CryptoJS.lib.WordArray.create(words, len);
}
export function base64ToUint8Array(base64) {
  return wordToUint8Array(CryptoJS.enc.Base64.parse(base64));
}
export function byteArrayToWord(byteArray) {
  if (byteArray.length % 4 !== 0) {
    throw "ByteArray invalid.";
  }
  const wordArray: any[] = [];
  for (let i = 0; i < byteArray.length / 4; i++) {
    const word =
      (byteArray[i * 4] << 24) ^
      (byteArray[i * 4 + 1] << 16) ^
      (byteArray[i * 4 + 2] << 8) ^
      byteArray[i * 4 + 3];
    wordArray.push(word);
  }
  return wordArray;
}
export function byteArrayToBase64String(byteArray) {
  const words = CryptoJS.lib.WordArray.create(byteArrayToWord(byteArray));
  return CryptoJS.enc.Base64.stringify(words);
}
export function encryptContent(content, password) {
  const encrptOptions = generateNewOptions(password);
  return {
    encryptedContent: wordToUint8Array(
      encrypt(content, encrptOptions).ciphertext,
    ),
    encryptData: generateEncryptData(encrptOptions),
  };
}
/**
 *
 * @param {String} content
 * @param {String} password
 * @param {*} encryptionData
 * @return {String}
 */
export function decryptContent(content, password, encryptionData) {
  const decryptOptions = generateOptions(password, encryptionData);
  return decrypt(content, decryptOptions).toString(CryptoJS.enc.Utf8);
}
export function deepEqual(a, b) {
  if (a === 0 && b === 0) {
    return 1 / a === 1 / b;
  }
  if (a === b) {
    return true;
  }
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  if (typeof a === "number" && isNaN(a) && typeof b === "number" && isNaN(b)) {
    return true;
  }
  if (typeof a !== "object" && typeof b !== "object") {
    return a === b;
  }
  if (a === undefined || a === null || b === undefined || b === null) {
    return false;
  }
  if (Object.prototype.toString.call(a) === "[object Argument]") {
    if (Object.prototype.toString.call(b) !== "[object Argument]") {
      return false;
    }
    return deepEqual(Array.prototype.slice(a), Array.prototype.slice(b));
  }
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) {
    return false;
  }
  aKeys.sort();
  bKeys.sort();
  for (let i = 0; i < aKeys.length; i++) {
    if (aKeys[i] !== bKeys[i]) {
      return false;
    }
  }
  for (const key of aKeys) {
    if (!deepEqual(a[key], b[key])) {
      return false;
    }
  }
}
export function isString(s) {
  return typeof s === "string";
}
