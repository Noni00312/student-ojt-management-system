/**
 * Class representing a PDF Report Generator using jsPDF.
 */
class PDFReportGenerator {
  /**
   * Initializes the PDF document with default settings.
   */
  constructor() {
    this.doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "letter",
    });

    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 15;
    this.y = 60;
    this.pageNum = 1;
    this.figureCount = 1;

    this.currentStudentName = "";
    this.currentDate = "";
    this.currentLogo = null;
    this.currentTitle = "";
  }

  /**
   * Draws the report header, including logo, school info, student info, and title.
   *
   * @param {Object} params - The header parameters.
   * @param {string} params.logoBase64 - Base64 string of the logo image.
   * @param {string} params.studentName - Name of the student.
   * @param {string} params.date - Date of the report.
   * @param {Object} params.report - Report details.
   * @param {string} params.report.title - Title of the report.
   */
  async drawHeader({ logoBase64, studentName, date, report }) {
    if (logoBase64) {
      this.doc.addImage(logoBase64, "JPEG", this.margin, 10, 20, 20);
    }

    this.doc.setFontSize(12);
    this.doc.setFont("times", "bold");
    this.doc.text("OSMEÑA COLLEGES", this.margin + 25, 15);
    this.doc.setFont("times", "normal");
    this.doc.text("College of Computer Science", this.margin + 25, 20);
    this.doc.text("City of Masbate: 5400, Philippines", this.margin + 25, 24);
    this.doc.text(
      "Email Address: occollegeofcomputerscience@gmail.com",
      this.margin + 25,
      28
    );

    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, 32, this.pageWidth - this.margin, 32);

    this.doc.setFontSize(11);
    this.doc.setTextColor(0);
    this.doc.text(`Student Name: ${studentName}`, this.margin, 40);
    this.doc.text(`Date: ${date}`, this.pageWidth - this.margin, 40, {
      align: "right",
    });

    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(report.title || "Report", this.pageWidth / 2, 50, {
      align: "center",
    });

    this.doc.setFont("helvetica", "normal");
  }

  /**
   * Draws the footer with the current page number.
   */
  drawFooter() {
    this.doc.setFontSize(10);
    this.doc.setTextColor(150);
    this.doc.text(
      `Page ${this.pageNum}`,
      this.pageWidth / 2,
      this.pageHeight - this.margin,
      {
        align: "center",
      }
    );
    this.doc.setTextColor(0);
  }

  /**
   * Adds a new page to the PDF and redraws the header and footer.
   *
   * @param {Object} params - The same parameters passed to drawHeader.
   */
  addNewPage(params) {
    this.doc.addPage();
    this.pageNum++;
    this.y = 60;
    this.drawHeader(params);
    this.drawFooter();
  }

  /**
   * Adds an image to the document, scaling and positioning it optimally within margins.
   * If it doesn’t fit, it adds a new page.
   *
   * @param {string} base64Image - Base64 string of the image.
   */
  async addImageOptimally(base64Image) {
    const maxWidth = this.pageWidth - this.margin * 2;
    const footerY = this.pageHeight - this.margin - 10;
    const availableHeight = footerY - this.y - 8;

    const img = await this.getImageDimensions(base64Image);

    if (img.width <= maxWidth && img.height <= availableHeight) {
      const xPos = (this.pageWidth - img.width) / 2;
      this.doc.addImage(
        base64Image,
        "JPEG",
        xPos,
        this.y,
        img.width,
        img.height
      );
      this.addFigureCaption(this.y + img.height, img.width);
      this.y += img.height + 10;
      return;
    }

    const widthScale = maxWidth / img.width;
    const heightScale = availableHeight / img.height;
    const scale = Math.min(widthScale, heightScale);

    if (scale < 0.5 && availableHeight < this.pageHeight - 100) {
      this.addNewPage({
        studentName: this.currentStudentName,
        date: this.currentDate,
        logoBase64: this.currentLogo,
        report: { title: this.currentTitle },
      });
      await this.addImageOptimally(base64Image);
      return;
    }

    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;
    const xPos = (this.pageWidth - scaledWidth) / 2;

    this.doc.addImage(
      base64Image,
      "JPEG",
      xPos,
      this.y,
      scaledWidth,
      scaledHeight
    );
    this.addFigureCaption(this.y + scaledHeight, scaledWidth);
    this.y += scaledHeight + 10;
  }

  /**
   * Adds a caption below an image indicating its figure number.
   *
   * @param {number} yPos - The Y position below the image.
   * @param {number} imageWidth - The width of the image (not used directly).
   */
  addFigureCaption(yPos, imageWidth) {
    this.doc.setFontSize(12);
    this.doc.setFont("times", "italic");
    const captionText = `Figure - ${this.figureCount++}`;
    const textWidth = this.doc.getTextWidth(captionText);
    const xPos = (this.pageWidth - textWidth) / 2;
    this.doc.text(captionText, xPos, yPos + 5);
    this.doc.setFont("times", "normal");
  }

  /**
   * Generates the PDF report and triggers the file download.
   *
   * @param {Object} params - Report generation options.
   * @param {string} params.title - Title of the report.
   * @param {string} params.date - Date string.
   * @param {string} params.content - Text content of the report.
   * @param {Array<string>} params.images - Array of base64-encoded image strings.
   * @param {string} params.studentName - Student's name.
   * @param {string|null} params.logoBase64 - Base64 logo image.
   */
  async generate({
    title = "Untitled Report",
    date = "",
    content = "No content provided",
    images = [],
    studentName = "Student",
    logoBase64 = null,
  }) {
    this.currentStudentName = studentName;
    this.currentDate = date;
    this.currentLogo = logoBase64;
    this.currentTitle = title;

    await this.drawHeader({ studentName, date, logoBase64, report: { title } });
    this.drawFooter();

    this.doc.setFontSize(12);
    const wrappedContent = this.doc.splitTextToSize(
      content,
      this.pageWidth - this.margin * 2
    );
    const contentHeight = wrappedContent.length * 6;

    if (this.y + contentHeight > this.pageHeight - this.margin * 2) {
      this.addNewPage({ studentName, date, logoBase64, report: { title } });
    }

    this.doc.text(wrappedContent, this.margin, this.y);
    this.y += contentHeight + 5;

    for (const base64Image of images) {
      await this.addImageOptimally(base64Image);
    }

    const filename = `${studentName.replace(/\s+/g, "_")}_${title.replace(
      /\s+/g,
      "_"
    )}_${date}.pdf`;
    this.doc.save(filename);
  }

  /**
   * Calculates the dimensions of a base64 image in millimeters.
   *
   * @param {string} base64 - Base64 image string.
   * @returns {Promise<Object>} - An object containing width and height in mm.
   */
  async getImageDimensions(base64) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const width = (img.width * 25.4) / 96;
        const height = (img.height * 25.4) / 96;
        resolve({ width, height });
      };
      img.src = base64;
    });
  }
}

window.PDFReportGenerator = PDFReportGenerator;
