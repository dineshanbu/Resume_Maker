// backend/src/services/cloudinary.service.js
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload file to Cloudinary
 * @param {Buffer|Stream|String} file - File buffer, stream, or base64 string
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadToCloudinary = async (file, options = {}) => {
  try {
    const {
      folder = 'user-profiles',
      resource_type = 'auto', // 'image', 'video', 'raw', 'auto'
      allowed_formats = ['jpg', 'jpeg', 'png', 'gif', 'pdf'],
      max_file_size = 5242880, // 5MB in bytes
      transformation = []
    } = options;

    // Validate file size if it's a buffer
    if (Buffer.isBuffer(file) && file.length > max_file_size) {
      throw new Error(`File size exceeds maximum allowed size of ${max_file_size / 1024 / 1024}MB`);
    }

    const uploadOptions = {
      folder,
      resource_type,
      allowed_formats,
      transformation,
      timeout: 60000 // 60 seconds
    };

    let uploadResult;

    if (Buffer.isBuffer(file)) {
      // Convert buffer to base64 data URI for Cloudinary
      const base64String = file.toString('base64');
      const mimeType = options.mimeType || 'image/jpeg';
      const dataUri = `data:${mimeType};base64,${base64String}`;
      
      uploadResult = await cloudinary.uploader.upload(dataUri, uploadOptions);
    } else if (typeof file === 'string') {
      // Base64 string or URL
      uploadResult = await cloudinary.uploader.upload(file, uploadOptions);
    } else {
      // Stream - use upload_stream
      uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        });
        file.pipe(stream);
      });
    }

    return {
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      format: uploadResult.format,
      width: uploadResult.width,
      height: uploadResult.height,
      bytes: uploadResult.bytes
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

/**
 * Upload image with optimization
 * @param {Buffer|Stream|String} file - Image file
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadImage = async (file, options = {}) => {
  const imageOptions = {
    ...options,
    resource_type: 'image',
    transformation: [
      { quality: 'auto', fetch_format: 'auto' },
      ...(options.transformation || [])
    ]
  };

  return uploadToCloudinary(file, imageOptions);
};

/**
 * Upload PDF document
 * @param {Buffer|Stream|String} file - PDF file
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadPDF = async (file, options = {}) => {
  const pdfOptions = {
    ...options,
    resource_type: 'raw',
    allowed_formats: ['pdf']
  };

  return uploadToCloudinary(file, pdfOptions);
};

/**
 * Delete file from Cloudinary
 * @param {String} publicId - Cloudinary public ID
 * @param {String} resourceType - Resource type ('image', 'raw', etc.)
 * @returns {Promise<Object>} Deletion result
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

/**
 * Extract public ID from Cloudinary URL
 * @param {String} url - Cloudinary URL
 * @returns {String|null} Public ID
 */
const extractPublicId = (url) => {
  if (!url) return null;
  
  try {
    const matches = url.match(/\/v\d+\/(.+)\.(jpg|jpeg|png|gif|pdf)/);
    if (matches && matches[1]) {
      return matches[1];
    }
    return null;
  } catch (error) {
    return null;
  }
};

module.exports = {
  uploadToCloudinary,
  uploadImage,
  uploadPDF,
  deleteFromCloudinary,
  extractPublicId
};
