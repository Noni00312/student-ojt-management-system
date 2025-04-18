// Import the online reports module
import { displayReports } from "./report-online.js";

// Initialize online reports when the page loads
if (window.location.pathname.includes("report.html")) {
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      await displayReports();
    } catch (error) {
      console.error("Failed to load reports:", error);
      alert("Failed to load reports. Please check your connection.");
    }
  });
}
