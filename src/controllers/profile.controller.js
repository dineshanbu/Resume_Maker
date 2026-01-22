// backend/src/controllers/profile.controller.js
const User = require('../models/User.model');
const asyncHandler = require('../utils/asyncHandler');
const { 
  successResponse, 
  badRequestResponse,
  notFoundResponse
} = require('../utils/apiResponse');
const { uploadImage, uploadPDF, deleteFromCloudinary, extractPublicId } = require('../services/cloudinary.service');
const multer = require('multer');
const { Readable } = require('stream');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed'), false);
    }
  }
});

/**
 * @desc    Get user profile
 * @route   GET /api/v1/profile
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return notFoundResponse(res, 'User not found');
  }

  const userData = user.getPublicProfile();
  
  return successResponse(res, {
    profile: userData,
    profileCompletionPercentage: user.profileCompletionPercentage || 0
  }, 'Profile retrieved successfully');
});

/**
 * @desc    Create or update user profile
 * @route   POST /api/v1/profile
 * @route   PUT /api/v1/profile
 * @access  Private
 */
const saveProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return notFoundResponse(res, 'User not found');
  }

  const {
    // Basic Info
    fullName,
    phone,
    dateOfBirth,
    gender,
    maritalStatus,
    
    // Location
    country,
    state,
    city,
    
    // Professional Summary
    headline,
    aboutMe,
    
    // Employment Preferences
    currentRole,
    experienceYears,
    experienceMonths,
    employmentType,
    jobType,
    noticePeriod,
    preferredLocations,
    
    // Skills
    primarySkills,
    secondarySkills,
    
    // Education
    education,
    
    // Online Profiles
    linkedInUrl,
    githubUrl,
    portfolioUrl,
    
    // Language
    language
  } = req.body;

  // Update Basic Info
  if (fullName !== undefined) user.fullName = fullName;
  if (phone !== undefined) user.phone = phone;
  if (dateOfBirth !== undefined) {
    // Convert date string to Date object
    user.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
  }
  if (gender !== undefined) user.gender = gender;
  if (maritalStatus !== undefined) user.maritalStatus = maritalStatus;

  // Update Location
  if (country !== undefined || state !== undefined || city !== undefined) {
    user.location = {
      ...user.location,
      country: country !== undefined ? country : user.location?.country,
      state: state !== undefined ? state : user.location?.state,
      city: city !== undefined ? city : user.location?.city
    };
  }

  // Update Professional Summary
  if (headline !== undefined) user.headline = headline;
  if (aboutMe !== undefined) user.aboutMe = aboutMe;

  // Update Employment Preferences
  if (currentRole !== undefined) user.currentRole = currentRole;
  if (experienceYears !== undefined) user.experienceYears = experienceYears;
  if (experienceMonths !== undefined) user.experienceMonths = experienceMonths;
  if (employmentType !== undefined) user.employmentType = employmentType;
  if (jobType !== undefined) user.jobType = jobType;
  if (noticePeriod !== undefined) user.noticePeriod = noticePeriod;

  // Update Skills
  if (primarySkills !== undefined) user.primarySkills = primarySkills;
  if (secondarySkills !== undefined) user.secondarySkills = secondarySkills;

  // Update Education
  if (education !== undefined) user.education = education;

  // Update Online Profiles
  if (linkedInUrl !== undefined) user.linkedInUrl = linkedInUrl;
  if (githubUrl !== undefined) user.githubUrl = githubUrl;
  if (portfolioUrl !== undefined) user.portfolioUrl = portfolioUrl;

  // Update Language
  if (language !== undefined) user.language = language;

  // Calculate and update profile completion
  user.calculateProfileCompletion();

  await user.save();

  const userData = user.getPublicProfile();

  return successResponse(res, {
    profile: userData,
    profileCompletionPercentage: user.profileCompletionPercentage
  }, 'Profile saved successfully');
});

/**
 * @desc    Save or update profile section (Naukri-style section-wise save)
 * @route   POST /api/v1/profile/section/:sectionName
 * @route   PUT /api/v1/profile/section/:sectionName
 * @access  Private
 */
const saveProfileSection = asyncHandler(async (req, res) => {
  const { sectionName } = req.params;
  const user = await User.findById(req.user._id);

  if (!user) {
    return notFoundResponse(res, 'User not found');
  }

  const validSections = [
    'personal-details',
    'professional-summary',
    'employment-preferences',
    'skills',
    'education',
    'online-profiles',
    'language'
  ];

  if (!validSections.includes(sectionName)) {
    return badRequestResponse(res, `Invalid section name. Valid sections: ${validSections.join(', ')}`);
  }

  try {
    switch (sectionName) {
      case 'personal-details': {
        const { fullName, phone, dateOfBirth, gender, maritalStatus, country, state, city } = req.body;
        
        if (fullName !== undefined) {
          if (!fullName || fullName.trim().length < 3 || fullName.trim().length > 50) {
            return badRequestResponse(res, 'Name must be 3-50 characters');
          }
          user.fullName = fullName.trim();
        }
        
        if (phone !== undefined) {
          if (!phone || !/^[0-9]{10}$/.test(phone)) {
            return badRequestResponse(res, 'Phone must be 10 digits');
          }
          user.phone = phone.trim();
        }
        
        if (dateOfBirth !== undefined) {
          if (dateOfBirth) {
            const birthDate = new Date(dateOfBirth);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            if (age < 13 || age > 100) {
              return badRequestResponse(res, 'Date of birth must be valid (age between 13-100)');
            }
            user.dateOfBirth = birthDate;
          } else {
            user.dateOfBirth = null;
          }
        }
        
        if (gender !== undefined) {
          if (gender && !['Male', 'Female', 'Other'].includes(gender)) {
            return badRequestResponse(res, 'Gender must be Male, Female, or Other');
          }
          user.gender = gender;
        }
        
        if (maritalStatus !== undefined) {
          if (maritalStatus && !['Single', 'Married'].includes(maritalStatus)) {
            return badRequestResponse(res, 'Invalid marital status');
          }
          user.maritalStatus = maritalStatus;
        }
        
        if (country !== undefined || state !== undefined || city !== undefined) {
          user.location = {
            ...user.location,
            country: country !== undefined ? country : user.location?.country,
            state: state !== undefined ? state : user.location?.state,
            city: city !== undefined ? city : user.location?.city
          };
        }
        break;
      }

      case 'professional-summary': {
        const { headline, aboutMe } = req.body;
        
        if (headline !== undefined) {
          if (headline && headline.length > 100) {
            return badRequestResponse(res, 'Headline cannot exceed 100 characters');
          }
          user.headline = headline ? headline.trim() : null;
        }
        
        if (aboutMe !== undefined) {
          if (aboutMe && aboutMe.length > 500) {
            return badRequestResponse(res, 'About me cannot exceed 500 characters');
          }
          user.aboutMe = aboutMe ? aboutMe.trim() : null;
        }
        break;
      }

      case 'employment-preferences': {
        const {
          currentRole,
          experienceYears,
          experienceMonths,
          employmentType,
          jobType,
          noticePeriod
        } = req.body;
        
        if (currentRole !== undefined) user.currentRole = currentRole ? currentRole.trim() : null;
        if (experienceYears !== undefined) {
          const years = parseInt(experienceYears);
          if (isNaN(years) || years < 0 || years > 50) {
            return badRequestResponse(res, 'Experience years must be between 0 and 50');
          }
          user.experienceYears = years;
        }
        if (experienceMonths !== undefined) {
          const months = parseInt(experienceMonths);
          if (isNaN(months) || months < 0 || months > 11) {
            return badRequestResponse(res, 'Experience months must be between 0 and 11');
          }
          user.experienceMonths = months;
        }
        if (employmentType !== undefined) {
          if (employmentType && !['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'].includes(employmentType)) {
            return badRequestResponse(res, 'Invalid employment type');
          }
          user.employmentType = employmentType;
        }
        if (jobType !== undefined) {
          if (jobType && !['Hybrid', 'Work from Home', 'Work from Office'].includes(jobType)) {
            return badRequestResponse(res, 'Invalid job type');
          }
          user.jobType = jobType;
        }
        if (noticePeriod !== undefined) {
          if (noticePeriod && !['Immediate', '1 Week', '2 Weeks', '1 Month', '2 Months', '3 Months'].includes(noticePeriod)) {
            return badRequestResponse(res, 'Invalid notice period');
          }
          user.noticePeriod = noticePeriod;
        }
        break;
      }

      case 'skills': {
        const { primarySkills, secondarySkills } = req.body;
        
        if (primarySkills !== undefined) {
          if (!Array.isArray(primarySkills) || primarySkills.length === 0) {
            return badRequestResponse(res, 'At least one primary skill is required');
          }
          user.primarySkills = primarySkills.filter(skill => skill && skill.trim()).map(skill => skill.trim());
        }
        
        if (secondarySkills !== undefined) {
          user.secondarySkills = Array.isArray(secondarySkills) 
            ? secondarySkills.filter(skill => skill && skill.trim()).map(skill => skill.trim())
            : [];
        }
        break;
      }

      case 'language': {
        const { language } = req.body;
        
        if (language !== undefined) {
          user.language = language ? language.trim() : null;
        }
        break;
      }

      case 'education': {
        const { education } = req.body;
        
        if (education !== undefined) {
          if (!Array.isArray(education) || education.length === 0) {
            return badRequestResponse(res, 'At least one education entry is required');
          }
          
          // Validate each education entry
          for (const edu of education) {
            if (!edu.degree || !edu.degree.trim()) {
              return badRequestResponse(res, 'Degree is required for all education entries');
            }
            if (!edu.institution || !edu.institution.trim()) {
              return badRequestResponse(res, 'Institution is required for all education entries');
            }
            if (!edu.passingYear || isNaN(parseInt(edu.passingYear)) || parseInt(edu.passingYear) < 1900 || parseInt(edu.passingYear) > new Date().getFullYear() + 5) {
              return badRequestResponse(res, 'Valid passing year is required for all education entries');
            }
            if (!edu.grade || !edu.grade.trim()) {
              return badRequestResponse(res, 'Grade is required for all education entries');
            }
          }
          
          user.education = education.map(edu => ({
            degree: edu.degree.trim(),
            institution: edu.institution.trim(),
            passingYear: parseInt(edu.passingYear),
            grade: edu.grade.trim()
          }));
        }
        break;
      }

      case 'online-profiles': {
        const { linkedInUrl, githubUrl, portfolioUrl } = req.body;
        
        if (linkedInUrl !== undefined) {
          if (linkedInUrl && !/^https?:\/\/.+\..+/.test(linkedInUrl)) {
            return badRequestResponse(res, 'Invalid LinkedIn URL');
          }
          user.linkedInUrl = linkedInUrl ? linkedInUrl.trim() : null;
        }
        
        if (githubUrl !== undefined) {
          if (githubUrl && !/^https?:\/\/.+\..+/.test(githubUrl)) {
            return badRequestResponse(res, 'Invalid GitHub URL');
          }
          user.githubUrl = githubUrl ? githubUrl.trim() : null;
        }
        
        if (portfolioUrl !== undefined) {
          if (portfolioUrl && !/^https?:\/\/.+\..+/.test(portfolioUrl)) {
            return badRequestResponse(res, 'Invalid portfolio URL');
          }
          user.portfolioUrl = portfolioUrl ? portfolioUrl.trim() : null;
        }
        break;
      }


      default:
        return badRequestResponse(res, 'Invalid section name');
    }

    // Calculate and update profile completion
    user.calculateProfileCompletion();
    await user.save();

    const userData = user.getPublicProfile();

    return successResponse(res, {
      profile: userData,
      profileCompletionPercentage: user.profileCompletionPercentage,
      section: sectionName
    }, `${sectionName.replace(/-/g, ' ')} saved successfully`);
  } catch (error) {
    console.error('Profile section save error:', error);
    return badRequestResponse(res, `Failed to save ${sectionName}: ${error.message}`);
  }
});

/**
 * @desc    Upload profile picture
 * @route   POST /api/v1/profile/upload-photo
 * @access  Private
 */
const uploadPhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    return badRequestResponse(res, 'No file uploaded');
  }

  // Validate file type
  if (!req.file.mimetype.startsWith('image/')) {
    return badRequestResponse(res, 'Only image files are allowed');
  }

  // Validate file size (5MB)
  if (req.file.size > 5 * 1024 * 1024) {
    return badRequestResponse(res, 'File size must be less than 5MB');
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    return notFoundResponse(res, 'User not found');
  }

  try {
    // Delete old profile picture from Cloudinary if exists
    if (user.profilePicture) {
      const oldPublicId = extractPublicId(user.profilePicture);
      if (oldPublicId) {
        try {
          await deleteFromCloudinary(oldPublicId, 'image');
        } catch (error) {
          console.warn('Failed to delete old profile picture:', error.message);
        }
      }
    }

    // Upload new image to Cloudinary
    const uploadResult = await uploadImage(req.file.buffer, {
      folder: 'user-profiles/photos',
      mimeType: req.file.mimetype,
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' }
      ]
    });

    // Update user profile picture
    user.profilePicture = uploadResult.url;
    user.calculateProfileCompletion();
    await user.save();

    return successResponse(res, {
      profilePicture: user.profilePicture
    }, 'Profile picture uploaded successfully');
  } catch (error) {
    console.error('Profile picture upload error:', error);
    return badRequestResponse(res, `Failed to upload profile picture: ${error.message}`);
  }
});

/**
 * @desc    Upload resume PDF
 * @route   POST /api/v1/profile/upload-resume
 * @access  Private
 */
const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    return badRequestResponse(res, 'No file uploaded');
  }

  // Validate file type
  if (req.file.mimetype !== 'application/pdf') {
    return badRequestResponse(res, 'Only PDF files are allowed');
  }

  // Validate file size (5MB)
  if (req.file.size > 5 * 1024 * 1024) {
    return badRequestResponse(res, 'File size must be less than 5MB');
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    return notFoundResponse(res, 'User not found');
  }

  try {
    // Delete old resume from Cloudinary if exists
    if (user.resumePdf) {
      const oldPublicId = extractPublicId(user.resumePdf);
      if (oldPublicId) {
        try {
          await deleteFromCloudinary(oldPublicId, 'raw');
        } catch (error) {
          console.warn('Failed to delete old resume:', error.message);
        }
      }
    }

    // Upload PDF to Cloudinary
    const uploadResult = await uploadPDF(req.file.buffer, {
      folder: 'user-profiles/resumes'
    });

    // Update user resume
    user.resumePdf = uploadResult.url;
    await user.save();

    return successResponse(res, {
      resumePdf: user.resumePdf
    }, 'Resume uploaded successfully');
  } catch (error) {
    console.error('Resume upload error:', error);
    return badRequestResponse(res, `Failed to upload resume: ${error.message}`);
  }
});

module.exports = {
  getProfile,
  saveProfile,
  saveProfileSection,
  uploadPhoto: [upload.single('photo'), uploadPhoto],
  uploadResume: [upload.single('resume'), uploadResume]
};
