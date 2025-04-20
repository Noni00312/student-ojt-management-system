class ImageConverter {
  static async imageToBase64(imageFile) {
    if (!imageFile || !(imageFile instanceof Blob)) {
      throw new Error("Invalid image file");
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(imageFile);
    });
  }

  static validateBase64(base64String) {
    if (!base64String || !base64String.startsWith("data:image/")) {
      throw new Error("Invalid Base64 image string");
    }
    return base64String;
  }
}
