/**
 * api/auth.js — Authentication routes
 *
 * POST /api/auth/register  — Student or mentor signup
 * POST /api/auth/login     — Returns JWT
 * GET  /api/auth/me        — Current user (with MentorProfile if applicable)
 *
 * Design notes:
 * - Mentor registration is atomic-ish: we create User first, then MentorProfile.
 *   If MentorProfile creation fails, we delete the User to avoid orphan accounts.
 *   A true database transaction would be cleaner, but MongoDB Atlas M0 clusters
 *   support transactions — we use manual rollback here for simplicity and
 *   because it's clearer to read in an interview context.
 * - Passwords are hashed with bcrypt (cost factor 12). Cost 12 is a reasonable
 *   balance: slow enough to resist brute-force, fast enough for a web response.
 * - The admin role cannot be registered via this endpoint. The seed script is
 *   the only way to create an admin account.
 */
import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import MentorProfile from '../models/MentorProfile.js';
import { signToken } from '../utils/jwt.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// ── Helper: create an application error with a status code ───────────────────
const appError = (message, status) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role,
      // Mentor-specific fields (only required when role === 'mentor')
      professionalTitle,
      expertise,
      yearsOfExperience,
      bio,
      profileUrl,
      preferredSessionDuration,
    } = req.body;

    // Validate required base fields
    if (!name || !email || !password) {
      return next(appError('Name, email, and password are required.', 400));
    }

    // Disallow 'admin' role via self-registration — deliberate security gate
    if (role === 'admin') {
      return next(appError('Admin accounts cannot be created via registration.', 403));
    }

    // Validate mentor-specific fields when registering as a mentor
    if (role === 'mentor') {
      if (!professionalTitle || !expertise || !yearsOfExperience || !bio || !preferredSessionDuration) {
        return next(appError('Mentor registration requires: professionalTitle, expertise, yearsOfExperience, bio, preferredSessionDuration.', 400));
      }
      if (![30, 60].includes(Number(preferredSessionDuration))) {
        return next(appError('preferredSessionDuration must be 30 or 60.', 400));
      }
    }

    // Check for existing email before hashing (saves CPU on duplicates)
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return next(appError('An account with this email already exists.', 409));
    }

    // Hash the password — cost factor 12
    const passwordHash = await bcrypt.hash(password, 12);

    // Create the User document
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: role || 'student',
    });

    // If registering as mentor, create MentorProfile.
    // On failure, roll back the User document to avoid orphans.
    if (role === 'mentor') {
      try {
        await MentorProfile.create({
          user: user._id,
          professionalTitle,
          // expertise may come as a string "DSA,React" or an array — normalize it
          expertise: Array.isArray(expertise)
            ? expertise
            : expertise.split(',').map((s) => s.trim()),
          yearsOfExperience: Number(yearsOfExperience),
          bio,
          profileUrl: profileUrl || '',
          preferredSessionDuration: Number(preferredSessionDuration),
          // applicationStatus defaults to 'PENDING'
        });
      } catch (profileErr) {
        // Roll back the User to avoid orphan User without a profile
        await User.findByIdAndDelete(user._id);
        return next(profileErr);
      }
    }

    // Issue a JWT for the new user
    const token = signToken(user);

    res.status(201).json({
      message: 'Registration successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(appError('Email and password are required.', 400));
    }

    // Find user by email; select passwordHash explicitly (it's not in default selects
    // we'd configure if we ever add `select: false` — being explicit here is cleaner)
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Use a generic message to avoid email enumeration attacks
      return next(appError('Invalid email or password.', 401));
    }

    // Compare the plaintext password against the stored hash
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return next(appError('Invalid email or password.', 401));
    }

    const token = signToken(user);

    // Fetch MentorProfile if the user is a mentor, so the frontend has the status immediately
    let mentorProfile = null;
    if (user.role === 'mentor') {
      mentorProfile = await MentorProfile.findOne({ user: user._id }).lean();
    }

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mentorProfile: mentorProfile || undefined,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash').lean();
    if (!user) {
      return next(appError('User not found.', 404));
    }

    // Merge mentor profile if applicable
    let mentorProfile = null;
    if (user.role === 'mentor') {
      mentorProfile = await MentorProfile.findOne({ user: user._id }).lean();
    }

    res.json({
      user: {
        ...user,
        mentorProfile: mentorProfile || undefined,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
