const dbName = 'student-ojt-management-db';
const dbVersion = 1;

let db;

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion);
    
    request.onupgradeneeded = (event) => {
      db = event.target.result;
      if (!db.objectStoreNames.contains('studentInfoTbl')) {
        const store = db.createObjectStore('studentInfoTbl', { keyPath: 'id', autoIncrement: true });

        // add columns
        store.createIndex('userId', 'userId', { unique: true });
        store.createIndex('studentId', 'studentId', { unique: false });
        store.createIndex('phoneNumber', 'phoneNumber', { unique: false });
        store.createIndex('firstName', 'firstName', { unique: false });
        store.createIndex('middleName', 'middleName', { unique: false });
        store.createIndex('lastName', 'lastName', { unique: false });
        store.createIndex('suffix', 'suffix', { unique: false });
        store.createIndex('gender', 'gender', { unique: false });
        store.createIndex('address', 'address', { unique: false });
        store.createIndex('companyName', 'companyName', { unique: false });
        // store.createIndex('company-address', 'company-address', { unique: false });
        store.createIndex('morningTimeIn', 'morningTimeIn', { unique: false });
        store.createIndex('morningTimeOut', 'morningTimeOut', { unique: false });
        store.createIndex('afternoonTimeIn', 'afternoonTimeIn', { unique: false });
        store.createIndex('afternoonTimeOut', 'afternoonTimeOut', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };
    
    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };
    
    request.onerror = (event) => {
      reject('Error opening database');
    };
  });
}

const crudOperations = {
    // Create
    createUser : (item) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['studentInfoTbl'], 'readwrite');
        const store = transaction.objectStore('studentInfoTbl');
        const request = store.add(item);
        
        transaction.onerror = () => {
          console.error('Transaction error:', transaction.error);
        };
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error(`Error adding item: ${request.error}`));
      });
    },
    
    // Read (single item)
    getItem: (id) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['studentInfoTbl'], 'readonly');
        const store = transaction.objectStore('studentInfoTbl');
        const request = store.get(id);
        
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(new Error(`Error getting item ${id}: ${request.error}`));
      });
    },
    
    // Read (all items)
    getAllItems: () => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['studentInfoTbl'], 'readonly');
        const store = transaction.objectStore('studentInfoTbl');
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error(`Error getting all items: ${request.error}`));
      });
    },
    
    // Update
    updateItem: (id, updates) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['studentInfoTbl'], 'readwrite');
        const store = transaction.objectStore('studentInfoTbl');
        
        store.get(id).onsuccess = (event) => {
          const existingItem = event.target.result;
          if (!existingItem) {
            reject(new Error(`Item ${id} not found`));
            return;
          }
          
          const updatedItem = { ...existingItem, ...updates, updatedAt: new Date() };
          const putRequest = store.put(updatedItem);
          
          putRequest.onsuccess = () => resolve(putRequest.result);
          putRequest.onerror = () => reject(new Error(`Error updating item ${id}: ${putRequest.error}`));
        };
        
        store.get(id).onerror = () => {
          reject(new Error(`Error finding item ${id} for update: ${event.target.error}`));
        };
      });
    },
    
    // Delete
    deleteItem: (id) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['studentInfoTbl'], 'readwrite');
        const store = transaction.objectStore('itestudentInfoTblms');
        const request = store.delete(id);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error(`Error deleting item ${id}: ${request.error}`));
      });
    },
    
    // Additional useful operations
    getItemsByIndex: (indexName, value) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['studentInfoTbl'], 'readonly');
        const store = transaction.objectStore('studentInfoTbl');
        const index = store.index(indexName);
        const request = index.getAll(value);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error(`Error querying by ${indexName}: ${request.error}`));
      });
    },
    
    getCount: () => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['studentInfoTbl'], 'readonly');
        const store = transaction.objectStore('studentInfoTbl');
        const request = store.count();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error(`Error getting count: ${request.error}`));
      });
    }
};
