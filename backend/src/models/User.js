/**
 * models/User.js — Core user document
 *
 * Three roles: student (default), mentor, admin.
 * Passwords are NEVER stored in plain text — bcrypt hashing happens in
 * api/auth.js before creating a User document. This model never touches
 * plaintext passwords directly.
 *
 * Admin accounts are NOT self-registrable; the only admin is created via
 * seed.js reading credentials from environment variables. This is a deliberate
 * security choice so the admin surface is fully controlled by the operator.
 */
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,      // MongoDB creates a unique index for us
      lowercase: true,   // Normalize before storage so 'FOO@BAR.com' and 'foo@bar.com' are the same
      trim: true,
    },
    // Hashed with bcrypt (cost factor 12) — see api/auth.js
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    role: {
      type: String,
      enum: {
        values: ['student', 'mentor', 'admin'],
        message: 'Role must be student, mentor, or admin',
      },
      default: 'student',
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

export default mongoose.model('User', userSchema);
