import express from "express";
import multer from "multer";
import sharp from "sharp";
import { v2 as cloudinaryV2 } from "cloudinary";

cloudinaryV2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  // Slightly higher cap so mobile photos survive the upload, we still compress before Cloudinary
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
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
    } catch (e) {
      console.warn("Image optimization failed, sending original buffer:", e.message);
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
