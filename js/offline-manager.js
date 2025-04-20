class OfflineManager {
  constructor() {
    this.pendingWrites = [];
    this.isOnline = navigator.onLine;
    window.addEventListener("online", () => this.handleConnectionChange());
    window.addEventListener("offline", () => this.handleConnectionChange());
  }

  // Save data locally (works offline)
  async saveReport(reportData) {
    const report = {
      ...reportData,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (this.isOnline) {
      // If online, save directly but still keep local copy
      await this._saveToFirebase(report);
    } else {
      // If offline, queue for later sync
      this.pendingWrites.push(report);
      await this._saveToIndexedDB(report);
    }
  }

  // Manual sync button handler
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

  // Private methods
  async _saveToFirebase(data) {
    try {
      const docRef = await addDoc(collection(db, "reports"), data);
      return docRef.id;
    } catch (error) {
      console.error("Firebase save error:", error);
      throw error;
    }
  }

  async _saveToIndexedDB(data) {
    // Implement your IndexedDB storage here
    // Similar to your existing IndexedDB CRUD
  }

  async _loadFromIndexedDB() {
    // Retrieve all unsynced items
  }

  async _markAsSynced(id) {
    // Update local record status to 'synced'
  }

  handleConnectionChange() {
    this.isOnline = navigator.onLine;
    console.log(`Connection changed: ${this.isOnline ? "Online" : "Offline"}`);
  }
}

export const offlineManager = new OfflineManager();
