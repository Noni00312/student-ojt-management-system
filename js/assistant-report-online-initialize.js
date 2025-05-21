import { displayReports } from "./assistant-report-online.js";

if (window.location.pathname.includes("assistant-report.html")) {
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      await displayReports();
    } catch (error) {
      console.error("Failed to load assistant reports:", error);
      Swal.fire({
        icon: "error",
        title: "Something Went Wrong",
        text: "Failed to load assistant reports. Please check your connection.",
        confirmButtonColor: "#590f1c",
      });
    }
  });
}
