import express from "express";
import multer from "multer";
import sharp from "sharp";
import cloudinaryV2 from "../cloudinary.js";


const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  // Increase cap to 100MB to support larger media
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

async function optimizeImage(buffer) {
  // Rotate based on EXIF, cap width to 1600px, convert to WebP ~70% quality
  return sharp(buffer)
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 70 })
    .toBuffer();
}

router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    let bufferToUpload = req.file.buffer;

    try {
      bufferToUpload = await optimizeImage(req.file.buffer);
    } catch (err) {
      console.warn(
        "Image optimization failed, sending original buffer:",
        err.message
      );
    }

    // ✅ Utilise un Promise pour attendre le résultat
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinaryV2.uploader.upload_stream(
        { folder: "users" },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      uploadStream.end(bufferToUpload);
    });

    const result = await uploadPromise;

    console.log("✅ Cloudinary upload success:", result.secure_url); // Debug
    res.json({ url: result.secure_url });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
