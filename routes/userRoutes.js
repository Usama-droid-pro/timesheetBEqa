const express = require('express');
const { body, param, query } = require('express-validator');
const { createUser, getAllUsers, updateUserPassword, deleteUser, searchUsersByName, updateUser, setUserActiveStatus } = require('../controllers/userController');
const { upload } = require('../middlewares/uploadMiddleware');
const { authMiddleware, adminMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * POST /api/users
 * Create a new user (Admin only)
 */
router.post('/', [
  // authMiddleware,
  // adminMiddleware,
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
      body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('role')
    .isIn(['QA', 'DESIGN', 'DEV', 'PM', 'Admin'])
    .withMessage('Role must be one of: QA, DESIGN, DEV, PM, Admin')
], createUser);

/**
 * GET /api/users
 * Get all users (exclude soft deleted)
 */
router.get('/', [
  // Temporarily removed auth for testing - TODO: Add back for production
  // authMiddleware,
  // adminMiddleware
], getAllUsers);

/**
 * GET /api/users/search
 * Search users by name (returns only id, name, and role)
 */
router.get('/search', [
  query('name')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Name search query must be at least 1 character')
], searchUsersByName);

/**
 * PUT /api/users/:id/password
 * Update user password (Admin only)
 */
router.put('/:id/password', [
  // authMiddleware,
  // adminMiddleware,
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
], updateUserPassword);

/**
 * PUT /api/users/:id
 * Update user fields (phone, dob, gender) and optionally password
 */
router.put('/:id', [
  authMiddleware,
  param('id').isMongoId().withMessage('Invalid user ID'),
  upload.single('image'),
  body('name').optional().isString().isLength({ min: 2, max: 100 }).withMessage('Name must be at least 2 characters'),
  body('phone').optional().isString(),
  body('dob').optional(),
  body('gender').optional().isIn(['Male', 'Female']).withMessage('Gender must be Male or Female'),
  body('currentPassword').optional().isString(),
  body('newPassword').optional().isString().isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  body('confirmPassword').optional().isString()
], updateUser);

/**
 * PUT /api/users/:id/active
 * Activate/deactivate user (Admin only)
 */
router.put('/:id/active', [
  authMiddleware,
  adminMiddleware,
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('active').isBoolean().withMessage('Active must be a boolean')
], setUserActiveStatus);

/**
 * DELETE /api/users/:id
 * Soft delete user (Admin only)
 */
router.delete('/:id', [
  authMiddleware,
  adminMiddleware,
  param('id').isMongoId().withMessage('Invalid user ID')
], deleteUser);

module.exports = router;
