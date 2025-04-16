import {
  db,
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "./firebase-config.js";

export const firebaseCRUD = {
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
