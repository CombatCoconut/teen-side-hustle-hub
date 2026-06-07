import express, { Router, Request, Response } from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../database/db';
import { AppError } from '../middleware/errorHandler';
import { verifyToken } from '../middleware/auth';
import { AuthRequest } from '../middleware/errorHandler';

const router: Router = express.Router();

// Register user
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, userType, age, schoolName } = req.body;

    // Validation
    if (!email || !password || !userType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create user
    const userResult = await query(
      `INSERT INTO users (email, password, user_type, first_name, last_name, date_of_birth)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, email, user_type, created_at`,
      [email, hashedPassword, userType, firstName, lastName]
    );

    const user = userResult.rows[0];

    // If teen, create teen_workers entry
    if (userType === 'teen' && age) {
      await query(
        `INSERT INTO teen_workers (user_id, age, school_name)
         VALUES ($1, $2, $3)`,
        [user.id, age, schoolName || null]
      );
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, userType: user.user_type, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        userType: user.user_type,
      },
      token,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Login user
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const result = await query(
      `SELECT id, email, password, user_type FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcryptjs.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user.id, userType: user.user_type, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        userType: user.user_type,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Link parent account
router.post('/link-parent', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { parentEmail } = req.body;
    const teenUserId = req.userId;

    if (!parentEmail) {
      return res.status(400).json({ message: 'Parent email required' });
    }

    // Find parent user
    const parentResult = await query(
      `SELECT id FROM users WHERE email = $1 AND user_type = 'parent'`,
      [parentEmail]
    );

    if (parentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Parent user not found' });
    }

    const parentId = parentResult.rows[0].id;

    // Create parent account link
    const verificationToken = jwt.sign(
      { parentId, teenUserId },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '48h' }
    );

    await query(
      `INSERT INTO parent_accounts (parent_user_id, teen_user_id, verification_token, verification_token_expiry)
       VALUES ($1, $2, $3, NOW() + INTERVAL '48 hours')
       ON CONFLICT (parent_user_id, teen_user_id) DO UPDATE SET
       verification_token = $3, verification_token_expiry = NOW() + INTERVAL '48 hours'`,
      [parentId, teenUserId, verificationToken]
    );

    res.json({
      message: 'Parent link request sent. Parent must verify the link.',
      verificationToken,
    });
  } catch (error: any) {
    console.error('Link parent error:', error);
    res.status(500).json({ message: 'Failed to link parent account' });
  }
});

// Verify parent link
router.post('/verify-parent', async (req: Request, res: Response) => {
  try {
    const { verificationToken } = req.body;

    if (!verificationToken) {
      return res.status(400).json({ message: 'Verification token required' });
    }

    const decoded = jwt.verify(verificationToken, process.env.JWT_SECRET || 'secret') as any;

    // Update parent account as verified
    await query(
      `UPDATE parent_accounts SET verified = TRUE WHERE parent_user_id = $1 AND teen_user_id = $2`,
      [decoded.parentId, decoded.teenUserId]
    );

    res.json({ message: 'Parent account verified successfully' });
  } catch (error) {
    console.error('Verify parent error:', error);
    res.status(401).json({ message: 'Invalid or expired verification token' });
  }
});

// Get current user
router.get('/me', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT id, email, user_type, first_name, last_name, phone, profile_picture_url, verified, identity_verified
       FROM users WHERE id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to get user' });
  }
});

export default router;
