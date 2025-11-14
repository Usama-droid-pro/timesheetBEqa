const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sendSuccess, sendError, sendServerError } = require('../utils/responseHandler');

const createUser = async (userData) => {
  try {
    const { name, email, password, role } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser && !existingUser.isDeleted) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      isDeleted: false
    });

    await user.save();

    // Return user without password
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  } catch (error) {
    throw error;
  }
};


const getAllUsers = async () => {
  try {
    const users = await User.find({ isDeleted: false })
      .select('-password')
      .sort({ createdAt: -1 });

    return users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      dob: user.dob,
      gender: user.gender,
      profilePic: user.profilePic,
      active: user?.active,
      updatedAt: user.updatedAt
    }));
  } catch (error) {
    throw error;
  }
};


const updateUserPassword = async (userId, newPassword) => {
  try {
    const user = await User.findById(userId);

    if (!user || user.isDeleted) {
      throw new Error('User not found');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      updatedAt: user.updatedAt
    };
  } catch (error) {
    throw error;
  }
};


const deleteUser = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user || user.isDeleted) {
      throw new Error('User not found');
    }

    // Soft delete
    await user.deleteOne({ _id: userId });

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      deletedAt: new Date()
    };
  } catch (error) {
    throw error;
  }
};


const searchUsersByName = async (searchQuery) => {
  try {
    if (!searchQuery || searchQuery.trim().length === 0) {
      return [];
    }

    // Use regex for case-insensitive partial matching on name
    const searchRegex = new RegExp(searchQuery.trim(), 'i');

    const users = await User.find({
      name: { $regex: searchRegex }
    })
      .select('name role')
      .sort({ name: 1 })
      .limit(50); // Limit results for performance

    return users.filter(user => user.role !== 'Admin').map(user => ({
      id: user._id,
      name: user.name,
      role: user.role
    }));
  } catch (error) {
    throw error;
  }
};

const updateUser = async (userId, updates) => {
  try {
    const user = await User.findById(userId);
    if (!user || user.isDeleted) {
      throw new Error('User not found');
    }


    if (Object.prototype.hasOwnProperty.call(updates, 'profilePic')) {
      const profilePic = updates.profilePic;
      if (typeof profilePic === 'string') {
        user.profilePic = profilePic.trim();
      }
    }


    if (Object.prototype.hasOwnProperty.call(updates, 'name')) {
      const name = updates.name;
      if (typeof name === 'string') {
        const trimmed = name.trim();
        if (trimmed.length < 2) {
          throw new Error('Name must be at least 2 characters long');
        }
        user.name = trimmed;
      }
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'phone')) {
      const phone = updates.phone;
      user.phone = typeof phone === 'string' ? phone.trim() : null;
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'dob')) {
      const dob = updates.dob;
      if (dob === null || dob === '') {
        user.dob = null;
      } else {
        const dateVal = new Date(dob);
        if (isNaN(dateVal.getTime())) {
          throw new Error('Invalid date of birth');
        }
        user.dob = dateVal;
      }
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'gender')) {
      const gender = updates.gender;
      if (gender !== null && gender !== undefined) {
        const allowed = ['Male', 'Female'];
        if (!allowed.includes(gender)) {
          throw new Error('Invalid gender');
        }
        user.gender = gender;
      } else {
        user.gender = null;
      }
    }

    const { currentPassword, newPassword, confirmPassword } = updates;
    if (currentPassword || newPassword || confirmPassword) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        throw new Error('Current, new, and confirm password are required');
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        throw new Error('Current password is incorrect');
      }
      if (newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }
      if (newPassword !== confirmPassword) {
        throw new Error('New password and confirm password do not match');
      }
      const hashed = await bcrypt.hash(newPassword, 10);
      user.password = hashed;
    }

    await user.save();

    console.log("user is ", user)

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      dob: user.dob,
      gender: user.gender,
      profilePic: user.profilePic,
      updatedAt: user.updatedAt
    };
  } catch (error) {
    throw error;
  }
};

const updateUserProfilePic = async (userId, imageUrl) => {
  try {
    const user = await User.findById(userId);
    if (!user || user.isDeleted) {
      throw new Error('User not found');
    }
    user.profilePic = imageUrl || null;
    await user.save();
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      dob: user.dob,
      gender: user.gender,
      profilePic: user.profilePic,
      updatedAt: user.updatedAt
    };
  } catch (error) {
    throw error;
  }
};


const active_deactivateUser = async (userId, activeStatus) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    user.active = activeStatus;
    await user.save();
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
      updatedAt: user.updatedAt
    };
  } catch (error) {
    throw error;
  }
};
module.exports = {
  createUser,
  getAllUsers,
  updateUserPassword,
  deleteUser,
  searchUsersByName,
  updateUser,
  updateUserProfilePic,
  active_deactivateUser
};
