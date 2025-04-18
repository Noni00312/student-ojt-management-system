function deleteDatabase(name) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve("Deleted successfully");
    request.onerror = () => reject("Delete failed");
  });
}

function initDB(dbName, dbVersion, storeDefinitions = []) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion);

    request.onupgradeneeded = (event) => {
      db = event.target.result;

      storeDefinitions.forEach((def) => {
        if (!db.objectStoreNames.contains(def.name)) {
          const store = db.createObjectStore(def.name, def.options);

          if (def.indexes) {
            def.indexes.forEach((idx) => {
              store.createIndex(idx.name, idx.keyPath, idx.options || {});
            });
          }
        }
      });
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = () => reject("Error opening database");
  });
}

const crudOperations = {
  createData: (storeName, data) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(
          new Error(`Error adding data to ${storeName}: ${request.error}`)
        );
    });
  },

  getData: (storeName, id) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () =>
        reject(
          new Error(`Error getting data from ${storeName}: ${request.error}`)
        );
    });
  },

  getAllData: (storeName) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(
          new Error(
            `Error getting all data from ${storeName}: ${request.error}`
          )
        );
    });
  },

  updateData: (storeName, id, updates) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);

      const getRequest = store.get(id);
      getRequest.onsuccess = (event) => {
        const existing = event.target.result;
        if (!existing) {
          reject(new Error(`Item ${id} not found in ${storeName}`));
          return;
        }

        const updated = { ...existing, ...updates, updatedAt: new Date() };
        const putRequest = store.put(updated);

        putRequest.onsuccess = () => resolve(putRequest.result);
        putRequest.onerror = () =>
          reject(new Error(`Error updating ${storeName}: ${putRequest.error}`));
      };

      getRequest.onerror = () =>
        reject(new Error(`Error fetching for update from ${storeName}`));
    });
  },

  deleteData: (storeName, id) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(new Error(`Error deleting from ${storeName}: ${request.error}`));
    });
  },

  getByIndex: (storeName, indexName, value) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(
          new Error(
            `Error querying ${storeName}.${indexName}: ${request.error}`
          )
        );
    });
  },
  clearTable: async (tableName) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([tableName], "readwrite");
      const objectStore = transaction.objectStore(tableName);

      const request = objectStore.clear();

      request.onsuccess = () => resolve(true);
      request.onerror = (event) => reject(event.target.error);
    });
  },

  upsert: async function (storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);

      const request = store.put(data);

      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e.target.error);
    });
  },
};
