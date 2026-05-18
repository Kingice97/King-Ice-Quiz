const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/multerUpload');
const User = require('../models/User');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload profile picture - FIXED: No file.path access needed
router.post('/profile-picture', protect, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.user || !req.user.id) return res.status(401).json({ success: false, message: 'Authentication required.' });
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });

    console.log('✅ File uploaded to Cloudinary:', req.file.path); // This is the Cloudinary URL

    // ✅ FIXED: No need to upload again - Cloudinary already did it!
    // req.file.path is already the Cloudinary URL when using CloudinaryStorage
    
    const cloudinaryUrl = req.file.path;

    // Update user profile
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 'profile.picture': cloudinaryUrl, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ 
      success: true, 
      message: 'Profile picture uploaded.', 
      profilePicture: cloudinaryUrl, 
      user 
    });
  } catch (error) {
    console.error('Upload failed:', error);
    res.status(500).json({ success: false, message: 'Upload failed: ' + error.message });
  }
});

// Delete profile picture
router.delete('/profile-picture', protect, async (req, res) => {
  try {
    if (!req.user || !req.user.id) return res.status(401).json({ success: false, message: 'Authentication required.' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (user.profile?.picture && user.profile.picture.includes('res.cloudinary.com')) {
      // Extract public_id
      const urlParts = user.profile.picture.split('/');
      const publicId = urlParts[urlParts.length - 1].split('.')[0];
      await cloudinary.uploader.destroy(`quiz-app-profiles/${publicId}`);
    }

    user.profile.picture = null;
    user.updatedAt = new Date();
    await user.save();

    res.json({ success: true, message: 'Profile picture removed.', user });
  } catch (error) {
    console.error('Delete failed:', error);
    res.status(500).json({ success: false, message: 'Delete failed: ' + error.message });
  }
});

// Get current profile picture
router.get('/profile-picture', protect, async (req, res) => {
  try {
    if (!req.user || !req.user.id) return res.status(401).json({ success: false, message: 'Authentication required.' });

    const user = await User.findById(req.user.id).select('profile.picture username');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    res.json({ success: true, profilePicture: user.profile?.picture, username: user.username, hasProfilePicture: !!user.profile?.picture });
  } catch (error) {
    console.error('Get profile picture failed:', error);
    res.status(500).json({ success: false, message: 'Failed to get profile picture: ' + error.message });
  }
});

module.exports = router;