import express from 'express';
import bcrypt from 'bcryptjs';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

export default function userRoutes(db) {
  const router = express.Router();

  // Get all users (admin only)
  router.get('/', authenticateToken, requireAdmin, (req, res) => {
    const users = db.prepare(`
      SELECT id, username, role, created_at,
        (SELECT COUNT(*) FROM app_configs WHERE created_by = users.id) as config_count,
        (SELECT COUNT(*) FROM launch_history WHERE user_id = users.id) as launch_count
      FROM users 
      ORDER BY created_at DESC
    `).all();
    res.json(users);
  });

  // Create user (admin only)
  router.post('/', authenticateToken, requireAdmin, (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run(
      username,
      hashedPassword,
      role || 'user'
    );

    const user = db.prepare('SELECT id, username, role, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(user);
  });

  // Update user (admin only)
  router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { username, password, role } = req.body;

    if (username) {
      const existing = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, req.params.id);
      if (existing) {
        return res.status(409).json({ error: 'Username already exists' });
      }
    }

    let hashedPassword = user.password;
    if (password) {
      hashedPassword = bcrypt.hashSync(password, 10);
    }

    db.prepare('UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?').run(
      username || user.username,
      hashedPassword,
      role || user.role,
      req.params.id
    );

    const updated = db.prepare('SELECT id, username, role, created_at FROM users WHERE id = ?').get(req.params.id);
    res.json(updated);
  });

  // Delete user (admin only)
  router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ message: 'User deleted' });
  });

  return router;
}
