import express from 'express';
import fs from 'fs';
import upload, { detectRealMimeType, ALLOWED_MIME_TYPES } from '../config/storage.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();
router.use(protect);

const handleUpload = (req, res, next) => {
  upload.single('file')(req, res, (error) => {
    if (!error) return next();
    const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(status).json({ success: false, message: error.message || 'Invalid upload' });
  });
};

router.post('/file', handleUpload, (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  // Stricter check: inspect magic bytes rather than trusting client-supplied MIME type
  const realMimeType = detectRealMimeType(req.file.path);
  if (!realMimeType || !ALLOWED_MIME_TYPES.includes(realMimeType)) {
    try {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    } catch {
      // ignore unlink failure
    }
    return res.status(400).json({
      success: false,
      message: 'Invalid file signature: file contents do not match allowed formats (JPEG, PNG, WebP, PDF)',
    });
  }

  res.status(201).json({
    success: true,
    data: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: realMimeType,
      sizeBytes: req.file.size,
      url: `/uploads/${req.file.filename}`,
    },
  });
});

export default router;
