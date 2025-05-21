import { displayReports } from "./report-online.js";

if (window.location.pathname.includes("report.html")) {
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      await displayReports();
    } catch (error) {
      console.error("Failed to load reports:", error);
      Swal.fire({
        icon: "error",
        title: "Something Went Wrong",
        text: "Failed to load reports. Please check your connection.",
        confirmButtonColor: "#590f1c",
      });
    }
  });
}
