const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Storage configuration for avatars
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../public/uploads/avatars');
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Storage configuration for medical records
const medicalRecordStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../public/uploads/medical-records');
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'medical-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Storage configuration for chat files
const chatStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../public/uploads/chat');
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'chat-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Storage configuration for specialty images
const specialtyStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../public/uploads/specialties');
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'specialty-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for images only
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// File filter for documents
const documentFileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx|txt|jpeg|jpg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = /application\/pdf|application\/msword|application\/vnd.openxmlformats|text\/plain|image\//;
  const mimetypeMatch = mimetype.test(file.mimetype);

  if (mimetypeMatch && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only document files are allowed (pdf, doc, docx, txt, images)'));
  }
};

// File filter for all types (chat)
const allFileFilter = (req, file, cb) => {
  // Allow most common file types
  const deniedTypes = /exe|bat|sh|dll|sys/;
  const extname = deniedTypes.test(path.extname(file.originalname).toLowerCase());

  if (!extname) {
    return cb(null, true);
  } else {
    cb(new Error('This file type is not allowed'));
  }
};

// Max file size
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB default

// Upload middlewares
const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: maxFileSize }
}).single('avatar');

const uploadMedicalRecord = multer({
  storage: medicalRecordStorage,
  fileFilter: documentFileFilter,
  limits: { fileSize: maxFileSize * 2 } // 10MB for medical records
}).array('attachments', 5); // Max 5 files

const uploadChatFile = multer({
  storage: chatStorage,
  fileFilter: allFileFilter,
  limits: { fileSize: maxFileSize }
}).single('file');

const uploadSpecialtyImage = multer({
  storage: specialtyStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: maxFileSize }
}).single('image');

// Error handler wrapper
const handleUploadError = (uploadMiddleware) => {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File too large'
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      next();
    });
  };
};

module.exports = {
  uploadAvatar: handleUploadError(uploadAvatar),
  uploadMedicalRecord: handleUploadError(uploadMedicalRecord),
  uploadChatFile: handleUploadError(uploadChatFile),
  uploadSpecialtyImage: handleUploadError(uploadSpecialtyImage)
};
