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

// const studentsCollection = collection(db, "students");

export const firebaseCRUD = {
  createData: async (tableName, tableData) => {
    try {
      const tableDataName = collection(db, tableName);
      const docRef = await addDoc(tableDataName, tableData);
      console.log("Student added with ID: ", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error adding student: ", error);
      throw error;
    }
  },

  getAllData: async (tableName) => {
    try {
      const tableDataName = collection(db, tableName);
      const querySnapshot = await getDocs(tableDataName);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetching students: ", error);
      throw error;
    }
  },

  getDataById: async (id, tableName) => {
    try {
      const docRef = doc(db, "students", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        throw new Error("Student not found!");
      }
    } catch (error) {
      console.error("Error fetching student: ", error);
      throw error;
    }
  },

  updateStudent: async (id, updatedData) => {
    try {
      const docRef = doc(db, "students", id);
      await updateDoc(docRef, {
        ...updatedData,
        updatedAt: new Date().toISOString(),
      });
      console.log("Student updated successfully!");
    } catch (error) {
      console.error("Error updating student: ", error);
      throw error;
    }
  },

  deleteStudent: async (id) => {
    try {
      const docRef = doc(db, "students", id);
      await deleteDoc(docRef);
      console.log("Student deleted successfully!");
    } catch (error) {
      console.error("Error deleting student: ", error);
      throw error;
    }
  },

  // SEARCH - Find students by a field (e.g., studentId, email)
  findStudentsByField: async (field, value) => {
    try {
      const q = query(studentsCollection, where(field, "==", value));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error searching students: ", error);
      throw error;
    }
  },
};
