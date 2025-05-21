class OfflineManager {
  constructor() {
    this.pendingWrites = [];
    this.isOnline = navigator.onLine;
    window.addEventListener("online", () => this.handleConnectionChange());
    window.addEventListener("offline", () => this.handleConnectionChange());
  }

  async saveReport(reportData) {
    const report = {
      ...reportData,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (this.isOnline) {
      await this._saveToFirebase(report);
    } else {
      this.pendingWrites.push(report);
      await this._saveToIndexedDB(report);
    }
  }

  async syncAllData() {
    if (!this.isOnline) {
      alert("You're offline. Connect to sync.");
      return;
    }

    const offlineData = await this._loadFromIndexedDB();
    for (const item of offlineData) {
      await this._saveToFirebase(item);
      await this._markAsSynced(item.id);
    }
    this.pendingWrites = [];
  }

  async _saveToFirebase(data) {
    try {
      const docRef = await addDoc(collection(db, "reports"), data);
      return docRef.id;
    } catch (error) {
      console.error("Firebase save error:", error);
      throw error;
    }
  }

  async _saveToIndexedDB(data) {}

  async _loadFromIndexedDB() {}

  async _markAsSynced(id) {}

  handleConnectionChange() {
    this.isOnline = navigator.onLine;
    console.log(`Connection changed: ${this.isOnline ? "Online" : "Offline"}`);
  }
}

export const offlineManager = new OfflineManager();
