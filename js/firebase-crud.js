import {
  db,
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  collectionGroup,
  query,
  where,
} from "./firebase-config.js";

export const firebaseCRUD = {
  createData: async function (path, data) {
    const docRef = await addDoc(collection(db, path), data);
    return docRef;
  },

  getCollectionGroup: async function (collectionName) {
    try {
      const querySnapshot = await getDocs(collectionGroup(db, collectionName));
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        ref: doc.ref, // Include the reference for path parsing
      }));
    } catch (error) {
      console.error("Error fetching collection group:", error);
      throw error;
    }
  },

  setDataWithId: async function (collectionName, id, data) {
    try {
      await setDoc(doc(db, collectionName, id), data);
      return { id };
    } catch (error) {
      console.error("Error setting document with ID: ", error);
      throw new Error(`Failed to set document: ${error.message}`);
    }
  },

  createData: async (tableName, tableData) => {
    if (!tableName || typeof tableName !== "string") {
      throw new Error("Invalid table name");
    }
    if (!tableData || typeof tableData !== "object") {
      throw new Error("Invalid data format");
    }

    try {
      const docRef = await addDoc(collection(db, tableName), tableData);
      console.log("Data added with ID: ", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error adding Data: ", error);
      throw new Error(`Failed to create data: ${error.message}`);
    }
  },

  getAllData: async (tableName) => {
    if (!tableName || typeof tableName !== "string") {
      throw new Error("Invalid table name");
    }

    try {
      const querySnapshot = await getDocs(collection(db, tableName));
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetching data: ", error);
      throw new Error(`Failed to fetch data: ${error.message}`);
    }
  },

  getDataById: async (tableName, id) => {
    if (!tableName || typeof tableName !== "string") {
      throw new Error("Invalid table name");
    }
    if (!id || typeof id !== "string") {
      throw new Error("Invalid document ID");
    }

    try {
      const docRef = doc(db, tableName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error("Document not found");
      }
      return { id: docSnap.id, ...docSnap.data() };
    } catch (error) {
      console.error("Error fetching document: ", error);
      throw new Error(`Failed to get document: ${error.message}`);
    }
  },

  updateData: async (tableName, id, updatedData) => {
    if (!tableName || typeof tableName !== "string") {
      throw new Error("Invalid table name");
    }
    if (!id || typeof id !== "string") {
      throw new Error("Invalid document ID");
    }
    if (!updatedData || typeof updatedData !== "object") {
      throw new Error("Invalid update data");
    }

    try {
      const docRef = doc(db, tableName, id);
      await updateDoc(docRef, {
        ...updatedData,
        updatedAt: new Date().toISOString(),
      });
      console.log("Data updated successfully!");
      return id;
    } catch (error) {
      console.error("Error updating data: ", error);
      throw new Error(`Failed to update document: ${error.message}`);
    }
  },

  deleteData: async (tableName, id) => {
    if (!tableName || typeof tableName !== "string") {
      throw new Error("Invalid table name");
    }
    if (!id || typeof id !== "string") {
      throw new Error("Invalid document ID");
    }

    try {
      const docRef = doc(db, tableName, id);
      await deleteDoc(docRef);
      console.log("Data deleted successfully!");
      return id;
    } catch (error) {
      console.error("Error deleting data: ", error);
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  },

  queryData: async (tableName, field, operator, value) => {
    if (!tableName || typeof tableName !== "string") {
      throw new Error("Invalid table name");
    }
    if (!field || typeof field !== "string") {
      throw new Error("Invalid field name");
    }
    if (!operator || typeof operator !== "string") {
      throw new Error("Invalid operator");
    }

    try {
      const q = query(collection(db, tableName), where(field, operator, value));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error querying data: ", error);
      throw new Error(`Failed to query data: ${error.message}`);
    }
  },

  /**
   * Fetches all documents from a specific user's attendance subcollection for a given date.
   *
   * @async
   * @function getSubcollectionData
   * @param {string} userId - The unique ID of the user whose attendance logs are being retrieved.
   * @param {string} attendanceDate - The specific date (e.g., "2025-05-08") representing the subcollection under the user's logs.
   * @returns {Promise<{ count: number, data: Array<Object> }>} An object containing:
   *    - `count` (number): The number of documents (log entries) found.
   *    - `data` (Array<Object>): An array of log documents. Each object contains:
   *       - `id` (string): The Firestore document ID.
   *       - Other dynamic fields such as `timestamp`, `type`, `time`, `image`, etc.
   *
   * @throws {Error} Throws an error if the subcollection cannot be accessed or the fetch fails.
   *
   * @example
   * const { count, data } = await firebaseCRUD.getSubcollectionData("abc123", "2025-05-08");
   * console.log(`Total logs: ${count}`);
   * data.forEach(log => {
   *   console.log(`${log.type}: ${log.time}`);
   * });
   */
  getSubcollectionData: async (userId, attendanceDate) => {
    try {
      const path = `attendancelogs/${userId}/${attendanceDate}`;
      const subcollectionRef = collection(db, path);
      const snapshot = await getDocs(subcollectionRef);

      const documents = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return {
        count: snapshot.size,
        data: documents,
      };
    } catch (error) {
      console.error("Error fetching subcollection data:", error);
      throw error;
    }
  },

  // // Add this to your firebaseCRUD object in firebase-crud.js
  // searchData: async (tableName, field, searchTerm) => {
  //   if (!tableName || typeof tableName !== "string") {
  //     throw new Error("Invalid table name");
  //   }
  //   if (!field || typeof field !== "string") {
  //     throw new Error("Invalid field name");
  //   }
  //   if (!searchTerm || typeof searchTerm !== "string") {
  //     throw new Error("Invalid search term");
  //   }

  //   try {
  //     // First try to get matches that start with the search term
  //     const startQuery = query(
  //       collection(db, tableName),
  //       where(field, ">=", searchTerm),
  //       where(field, "<=", searchTerm + "\uf8ff")
  //     );

  //     const querySnapshot = await getDocs(startQuery);
  //     return querySnapshot.docs.map((doc) => ({
  //       id: doc.id,
  //       ...doc.data(),
  //     }));
  //   } catch (error) {
  //     console.error("Error searching data: ", error);
  //     throw new Error(`Failed to search data: ${error.message}`);
  //   }
  // }
};

export const cachedFirebaseCRUD = {
  getDataById: async (tableName, id) => {
    try {
      const cachedData = await getFromIndexedDB("studentInfoTbl", id);
      if (cachedData) {
        console.log("Returning cached data from IndexedDB");
        return cachedData;
      }
      const freshData = await firebaseCRUD.getDataById(tableName, id);

      await saveToIndexedDB("studentInfoTbl", freshData);

      return freshData;
    } catch (error) {
      console.error("Error in cached getDataById:", error);
      throw error;
    }
  },
};
