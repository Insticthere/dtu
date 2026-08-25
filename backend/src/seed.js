/**
 * seed.js — Database seeding script
 *
 * Usage: npm run seed (from project root) or node src/seed.js (from backend/)
 *
 * What this does:
 * 1. Creates the admin account from ADMIN_SEED_* environment variables.
 *    The admin is never self-registrable via the API — this is the ONLY way to
 *    create one. This is a deliberate security choice: the operator controls the
 *    admin credentials via environment variables, not via a public endpoint.
 * 2. Creates two demo mentor accounts with APPROVED status so the app is
 *    immediately usable for demonstration without having to manually approve.
 * 3. Creates a demo student account.
 *
 * Idempotency: re-running seed skips records that already exist (checks by email).
 * Safe to run multiple times.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Reconstruct __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (two directories up from backend/src/)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import MentorProfile from './models/MentorProfile.js';

const seed = async () => {
  try {
    console.log('🌱 Connecting to MongoDB Atlas for seeding...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected.');

    // ── 1. Admin account ──────────────────────────────────────────────────────
    const adminEmail = process.env.ADMIN_SEED_EMAIL;
    const adminName = process.env.ADMIN_SEED_NAME;
    const adminPassword = process.env.ADMIN_SEED_PASSWORD;

    if (!adminEmail || !adminName || !adminPassword) {
      throw new Error('ADMIN_SEED_EMAIL, ADMIN_SEED_NAME, and ADMIN_SEED_PASSWORD must be set in .env');
    }

    const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });
    if (existingAdmin) {
      console.log(`⏭  Admin already exists (${adminEmail}), skipping.`);
    } else {
      const adminHash = await bcrypt.hash(adminPassword, 12);
      await User.create({
        name: adminName,
        email: adminEmail.toLowerCase(),
        passwordHash: adminHash,
        role: 'admin',
      });
      console.log(`✅ Admin created: ${adminEmail}`);
    }

    // ── 2. Demo mentor accounts ───────────────────────────────────────────────
    const demoMentors = [
      {
        user: {
          name: 'Priya Sharma',
          email: 'priya.mentor@demo.com',
          role: 'mentor',
        },
        profile: {
          professionalTitle: 'Senior Software Engineer at Google',
          expertise: ['System Design', 'DSA', 'Backend Development'],
          yearsOfExperience: 7,
          bio: 'I help engineers crack FAANG interviews and build scalable systems. Specialized in Java and Go.',
          profileUrl: 'https://linkedin.com/in/priya-demo',
          preferredSessionDuration: 60,
          applicationStatus: 'APPROVED',
          averageRating: 4.8,
          totalReviews: 12,
        },
      },
      {
        user: {
          name: 'Arjun Mehta',
          email: 'arjun.mentor@demo.com',
          role: 'mentor',
        },
        profile: {
          professionalTitle: 'Full Stack Developer & Startup Advisor',
          expertise: ['React', 'Node.js', 'Product Development'],
          yearsOfExperience: 5,
          bio: 'Building startups for 5+ years. I mentor on React, Node.js, and early-stage product strategy.',
          profileUrl: 'https://linkedin.com/in/arjun-demo',
          preferredSessionDuration: 30,
          applicationStatus: 'APPROVED',
          averageRating: 4.5,
          totalReviews: 8,
        },
      },
    ];

    for (const demo of demoMentors) {
      const existing = await User.findOne({ email: demo.user.email });
      if (existing) {
        console.log(`⏭  Demo mentor already exists (${demo.user.email}), skipping.`);
        continue;
      }
      const passwordHash = await bcrypt.hash('Demo@123456', 12);
      const user = await User.create({ ...demo.user, passwordHash });
      await MentorProfile.create({ user: user._id, ...demo.profile });
      console.log(`✅ Demo mentor created: ${demo.user.email} (password: Demo@123456)`);
    }

    // ── 3. Demo student account ───────────────────────────────────────────────
    const studentEmail = 'student@demo.com';
    const existingStudent = await User.findOne({ email: studentEmail });
    if (existingStudent) {
      console.log(`⏭  Demo student already exists (${studentEmail}), skipping.`);
    } else {
      const studentHash = await bcrypt.hash('Demo@123456', 12);
      await User.create({
        name: 'Demo Student',
        email: studentEmail,
        passwordHash: studentHash,
        role: 'student',
      });
      console.log(`✅ Demo student created: ${studentEmail} (password: Demo@123456)`);
    }

    console.log('\n🎉 Seeding complete!');
    console.log('┌─────────────────────────────────────────────┐');
    console.log('│  Admin login:                               │');
    console.log(`│    Email:    ${adminEmail.padEnd(31)}│`);
    console.log(`│    Password: (set in ADMIN_SEED_PASSWORD)   │`);
    console.log('│  Demo mentors password: Demo@123456         │');
    console.log('│  Demo student password: Demo@123456         │');
    console.log('└─────────────────────────────────────────────┘');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
  }
};

seed();
