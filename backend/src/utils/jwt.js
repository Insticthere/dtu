/**
 * utils/jwt.js — JWT sign and verify helpers
 *
 * Centralizing JWT operations here means:
 * - The payload shape is defined in one place.
 * - The secret and expiry are always read from env (not hardcoded).
 * - If we ever switch algorithms or add claims, there's one file to change.
 */
import jwt from 'jsonwebtoken';

/**
 * signToken — creates a signed JWT for a user.
 *
 * The payload intentionally includes only the fields downstream middleware
 * (auth.js) needs: id, name, email, role. We do NOT include passwordHash
 * or any sensitive data in the token.
 *
 * @param {Object} user - Mongoose User document (or plain object with the same fields)
 * @returns {string} Signed JWT string
 */
export const signToken = (user) => {
  return jwt.sign(
    {
      id: user._id.toString(), // Convert ObjectId to string for portability
      name: user.name,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

/**
 * verifyToken — synchronously verifies a JWT and returns the decoded payload.
 * Throws JsonWebTokenError or TokenExpiredError on failure.
 *
 * @param {string} token - JWT string to verify
 * @returns {Object} Decoded payload
 */
export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
