/**
 * middleware/auth.js — Authentication and authorization middleware
 *
 * Exports two middleware factories:
 *   authenticate  — verifies the JWT in the Authorization header, attaches
 *                   req.user = { id, name, email, role }. Every protected
 *                   route uses this.
 *   requireRole   — factory that returns a middleware checking req.user.role
 *                   is in the allowed list. Used after authenticate.
 *
 * Token format expected: "Authorization: Bearer <jwt>"
 *
 * Security note: JWT is stored in localStorage on the frontend (per spec §5).
 * An httpOnly-cookie approach would be more secure (no XSS access to the token)
 * but would require CSRF handling — out of scope for this assignment.
 */
import jwt from 'jsonwebtoken';

/**
 * authenticate — verifies JWT and populates req.user.
 * Returns 401 if the header is missing or the token is invalid/expired.
 */
export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // The header must exist and follow "Bearer <token>" format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided. Please log in.' });
    }

    const token = authHeader.split(' ')[1];

    // jwt.verify throws if the token is invalid, expired, or tampered with.
    // We never trust the frontend for role/ID — everything comes from the token payload.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the decoded payload to the request for downstream handlers.
    // The payload shape matches what api/auth.js puts in when signing.
    req.user = {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (err) {
    // jwt.verify throws JsonWebTokenError / TokenExpiredError
    return res.status(401).json({ message: 'Invalid or expired token. Please log in again.' });
  }
};

/**
 * requireRole(...roles) — authorization middleware factory.
 *
 * Usage: router.get('/admin/...', authenticate, requireRole('admin'), handler)
 *
 * Returns 403 (Forbidden) rather than 401 (Unauthorized) because the user IS
 * authenticated — they just don't have permission for this resource.
 *
 * @param {...string} roles - One or more allowed role strings.
 * @returns Express middleware
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    // authenticate must run first — if req.user is missing, something is wired wrong
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}.`,
      });
    }

    next();
  };
};
