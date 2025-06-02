const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../utils/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'mern-social-media', 
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

module.exports = storage;