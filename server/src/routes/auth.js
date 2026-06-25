import { Router } from 'express';
import crypto from 'crypto';
import { prisma } from '../db.js';
import { authenticate, generateToken } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password wajib diisi.' });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Username atau password salah.' });
    }

    // Verify password
    let passwordValid = false;
    if (user.isDefaultPassword) {
      // Default passwords are stored as plain text
      passwordValid = (password === user.password);
    } else {
      // Changed passwords are SHA-256 hashed
      const hashed = crypto.createHash('sha256').update(password).digest('hex');
      passwordValid = (hashed === user.password);
    }

    if (!passwordValid) {
      return res.status(401).json({ error: 'Username atau password salah.' });
    }

    // Update last login
    const today = new Date().toISOString().split('T')[0];
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: today },
    });

    // Generate token
    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
        isDefaultPassword: user.isDefaultPassword,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me — get current user from token
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, username: true, name: true, role: true,
        email: true, lastLogin: true, isDefaultPassword: true,
      },
    });
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/change-password
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password baru minimal 6 karakter.' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan.' });

    // Verify current password
    let currentValid = false;
    if (user.isDefaultPassword) {
      currentValid = (currentPassword === user.password);
    } else {
      const hashed = crypto.createHash('sha256').update(currentPassword).digest('hex');
      currentValid = (hashed === user.password);
    }

    if (!currentValid) {
      return res.status(401).json({ error: 'Password saat ini salah.' });
    }

    // Hash new password and save
    const hashedNew = crypto.createHash('sha256').update(newPassword).digest('hex');
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNew, isDefaultPassword: false },
    });

    res.json({ success: true, message: 'Password berhasil diubah.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
