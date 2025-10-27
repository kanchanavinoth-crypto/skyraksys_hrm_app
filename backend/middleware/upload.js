const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directories if they don't exist
const uploadDir = path.join(__dirname, '../uploads/employee-photos');
const logoUploadDir = path.join(__dirname, '../uploads/company-logos');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(logoUploadDir)) {
  fs.mkdirSync(logoUploadDir, { recursive: true });
}

// Configure multer for employee photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename: employeeId-timestamp.extension
    const employeeId = req.body.employeeId || 'temp';
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    cb(null, `${employeeId}-${timestamp}${extension}`);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed!'), false);
  }
};

// Configure upload limits
const uploadLimits = {
  fileSize: 5 * 1024 * 1024, // 5MB limit
  files: 1 // Only one file at a time
};

// Create multer upload instances
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: uploadLimits
});

// Storage configuration for company logos
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, logoUploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    cb(null, `company-logo-${timestamp}${extension}`);
  }
});

// Create multer upload instance for logos
const logoUpload = multer({
  storage: logoStorage,
  fileFilter: fileFilter,
  limits: uploadLimits
});

// Middleware for single photo upload
const uploadEmployeePhoto = (req, res, next) => {
  // Check if this is a JSON request (no file upload)
  const contentType = req.get('Content-Type') || '';
  
  if (contentType.includes('application/json')) {
    // For JSON requests, skip multer processing
    return next();
  }
  
  // For multipart/form-data requests, use multer
  upload.single('photo')(req, res, (err) => {
    if (err) {
      return next(err);
    }
    
    // Parse JSON strings in FormData back to objects
    // This must happen BEFORE validation middleware
    if (req.body.salary && typeof req.body.salary === 'string') {
      try {
        req.body.salary = JSON.parse(req.body.salary);
        console.log('✅ Parsed salary object:', req.body.salary);
      } catch (e) {
        console.error('❌ Failed to parse salary JSON:', e);
        console.error('   Raw salary value:', req.body.salary);
      }
    }
    
    if (req.body.salaryStructure && typeof req.body.salaryStructure === 'string') {
      try {
        req.body.salaryStructure = JSON.parse(req.body.salaryStructure);
        console.log('✅ Parsed salaryStructure object:', req.body.salaryStructure);
      } catch (e) {
        console.error('❌ Failed to parse salaryStructure JSON:', e);
        console.error('   Raw salaryStructure value:', req.body.salaryStructure);
      }
    }
    
    return next();
  });
};

// Middleware for company logo upload
const uploadCompanyLogo = (req, res, next) => {
  // Check if this is a JSON request (no file upload)
  const contentType = req.get('Content-Type') || '';
  
  if (contentType.includes('application/json')) {
    // For JSON requests, skip multer processing
    return next();
  }
  
  // For multipart/form-data requests, use multer
  return logoUpload.single('companyLogo')(req, res, next);
};

// Error handling middleware
const handleUploadError = (error, req, res, next) => {
  // Skip error handling for JSON requests (no upload errors expected)
  const contentType = req.get('Content-Type') || '';
  if (contentType.includes('application/json')) {
    return next();
  }
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Only one file allowed.'
      });
    }
  }
  
  if (error.message.includes('Only JPEG, PNG, and WebP images are allowed')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.'
    });
  }
  
  return res.status(500).json({
    success: false,
    message: 'File upload error: ' + error.message
  });
};

module.exports = {
  uploadEmployeePhoto,
  uploadCompanyLogo,
  handleUploadError,
  uploadDir,
  logoUploadDir
};
