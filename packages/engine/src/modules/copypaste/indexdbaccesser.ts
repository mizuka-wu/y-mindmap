import config from "../../common/config";
import { CONFIG } from "../../common/constants/index";

const KEY_PREFIX = "sbClipBoardData:";
const KEY = "key";
let db;
function initDb() {
  if (!window.indexedDB) {
    return new Promise((res, rej) => {
      rej("browser do not support indexedDB");
    });
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("Snowbrush");
    request.onerror = () =>
      /* event */
      {
        reject("can not open indexDB");
      };
    request.onsuccess = () =>
      /* event */
      {
        db = request.result;
        resolve(db);
      };
    request.onupgradeneeded = (event) => {
      if (!event.target) return;
      (event.target as any).result.createObjectStore("clipboardData");
    };
  });
}
function getRelatedKeys() {
  const keys: any[] = [];
  let key;
  for (let i = 0; i < localStorage.length; i++) {
    key = localStorage.key(i);
    if (key.indexOf(KEY_PREFIX) === 0) {
      keys.push(key);
    }
  }
  return keys;
}
const sharedDataAccesser = {
  write(data) {
    return new Promise((resolve, reject) => {
      if (!db) {
        initDb()
          .then(() => {
            _write();
          })
          .catch(reject);
      } else {
        _write();
      }
      function _write() {
        config.get(CONFIG.LOGGER).info("db write", data);
        const transaction = db.transaction("clipboardData", "readwrite");

        transaction
          .objectStore("clipboardData")
          .put(data, KEY)
          .addEventListener("success", () => {
            resolve(null);
          });
      }
    });
  },
  read(key) {
    return new Promise((resolve, reject) => {
      if (!db) {
        initDb()
          .then(() => {
            _read();
          })
          .catch(reject);
      } else {
        _read();
      }
      function _read() {
        const transaction = db.transaction("clipboardData", "readwrite");
        transaction.objectStore("clipboardData").get(KEY).onsuccess = (e) => {
          const data = e.target.result;
          if (!data) {
            reject("clipboardData is not existing");
            return;
          }
          if (key) {
            resolve(data[key]);
          } else {
            resolve(data);
          }
        };
      }
    });
  },
  clear() {
    getRelatedKeys().forEach((key) => localStorage.removeItem(key));
    // getRelatedKeys().forEach(key => localStorage.clear(key));
  },
};
/* harmony default export */
export const indexDbAccesser = sharedDataAccesser;
export default indexDbAccesser;
