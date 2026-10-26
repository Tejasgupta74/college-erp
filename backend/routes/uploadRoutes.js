import express from 'express';
import upload from '../config/storage.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();
router.use(protect);

router.post('/file', upload.single('file'), (req, res) => {
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
