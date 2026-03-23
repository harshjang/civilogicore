import { openDB } from "idb";

export const dbPromise = openDB("civil-db", 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains("points")) {
      db.createObjectStore("points", { keyPath: "id" });
    }
  },
});