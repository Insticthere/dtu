/**
 * api/admin.js — Admin-only routes for mentor application management
 *
 * All routes require: authenticate + requireRole('admin').
 * The admin account is seeded via seed.js and cannot be self-registered.
 *
 * GET   /api/admin/mentor-applications              — List applications (?status=&search=)
 * PATCH /api/admin/mentor-applications/:id/approve — Approve a mentor
 * PATCH /api/admin/mentor-applications/:id/reject  — Reject a mentor
 * GET   /api/admin/dashboard                        — Basic aggregate counts
 *
 * Note on `:id` — this is the MentorProfile._id, NOT the User._id.
 * The admin application list returns MentorProfile documents, so their IDs
 * are used in the approve/reject endpoints.
 */
import express from 'express';
import MentorProfile from '../models/MentorProfile.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication and the 'admin' role
router.use(authenticate, requireRole('admin'));

const appError = (message, status) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// ── GET /api/admin/mentor-applications ───────────────────────────────────────
// Supports ?status=PENDING|APPROVED|REJECTED and ?search= (name/title)
router.get('/mentor-applications', async (req, res, next) => {
  try {
    const { status, search } = req.query;

    const filter = {};
    if (status) {
      filter.applicationStatus = status.toUpperCase();
    }

    let applications = await MentorProfile.find(filter)
      .populate('user', 'name email createdAt')
      .sort({ createdAt: -1 }) // Newest first
      .lean();

    // Apply text search (name or title)
    if (search) {
      const regex = new RegExp(search, 'i');
      applications = applications.filter(
        (a) => regex.test(a.user?.name) || regex.test(a.professionalTitle)
      );
    }

    res.json({ applications });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/admin/mentor-applications/:id/approve ─────────────────────────
router.patch('/mentor-applications/:id/approve', async (req, res, next) => {
  try {
    const profile = await MentorProfile.findById(req.params.id).populate('user', 'name email');
    if (!profile) {
      return next(appError('Mentor application not found.', 404));
    }

    if (profile.applicationStatus === 'APPROVED') {
      return next(appError('This mentor is already approved.', 400));
    }

    profile.applicationStatus = 'APPROVED';
    await profile.save();

    res.json({
      message: `${profile.user.name}'s application has been approved. They can now configure availability.`,
      profile,
    });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/admin/mentor-applications/:id/reject ───────────────────────────
router.patch('/mentor-applications/:id/reject', async (req, res, next) => {
  try {
    const profile = await MentorProfile.findById(req.params.id).populate('user', 'name email');
    if (!profile) {
      return next(appError('Mentor application not found.', 404));
    }

    if (profile.applicationStatus === 'REJECTED') {
      return next(appError('This application is already rejected.', 400));
    }

    profile.applicationStatus = 'REJECTED';
    await profile.save();

    res.json({
      message: `${profile.user.name}'s application has been rejected.`,
      profile,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/admin/dashboard ──────────────────────────────────────────────────
// Returns basic aggregate counts for the admin dashboard
router.get('/dashboard', async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalMentors,
      pendingApplications,
      approvedMentors,
      totalBookings,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'mentor' }),
      MentorProfile.countDocuments({ applicationStatus: 'PENDING' }),
      MentorProfile.countDocuments({ applicationStatus: 'APPROVED' }),
      Booking.countDocuments(),
    ]);

    res.json({
      stats: {
        totalUsers,
        totalMentors,
        pendingApplications,
        approvedMentors,
        totalStudents: totalUsers - totalMentors - 1, // subtract admin(s)
        totalBookings,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
