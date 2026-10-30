import express from 'express';
import upload from '../config/storage.js';
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

  res.status(201).json({
    success: true,
    data: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      url: `/uploads/${req.file.filename}`,
    },
  });
});

export default router;
