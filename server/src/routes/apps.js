import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

export default function appRoutes(db) {
  const router = express.Router();

  // Get all configs (admin sees all, user sees only their own)
  router.get('/', authenticateToken, (req, res) => {
    let configs;
    if (req.user.role === 'admin') {
      configs = db.prepare(`
        SELECT ac.*, u.username as created_by_username 
        FROM app_configs ac 
        LEFT JOIN users u ON ac.created_by = u.id 
        ORDER BY ac.created_at DESC
      `).all();
    } else {
      configs = db.prepare(`
        SELECT ac.*, u.username as created_by_username 
        FROM app_configs ac 
        LEFT JOIN users u ON ac.created_by = u.id 
        WHERE ac.created_by = ?
        ORDER BY ac.created_at DESC
      `).all(req.user.id);
    }
    res.json(configs);
  });

  // Get single config
  router.get('/:id', authenticateToken, (req, res) => {
    const config = db.prepare(`
      SELECT ac.*, u.username as created_by_username 
      FROM app_configs ac 
      LEFT JOIN users u ON ac.created_by = u.id 
      WHERE ac.id = ?
    `).get(req.params.id);

    if (!config) {
      return res.status(404).json({ error: 'Config not found' });
    }

    if (req.user.role !== 'admin' && config.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(config);
  });

  // Create config
  router.post('/', authenticateToken, (req, res) => {
    const { name, exe_path, method, copies, delay } = req.body;

    if (!name || !exe_path) {
      return res.status(400).json({ error: 'Name and exe_path required' });
    }

    const result = db.prepare(`
      INSERT INTO app_configs (name, exe_path, method, copies, delay, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      name,
      exe_path,
      method || 'simple',
      copies || 2,
      delay || 500,
      req.user.id
    );

    const config = db.prepare('SELECT * FROM app_configs WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(config);
  });

  // Update config
  router.put('/:id', authenticateToken, (req, res) => {
    const config = db.prepare('SELECT * FROM app_configs WHERE id = ?').get(req.params.id);

    if (!config) {
      return res.status(404).json({ error: 'Config not found' });
    }

    if (req.user.role !== 'admin' && config.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { name, exe_path, method, copies, delay } = req.body;

    db.prepare(`
      UPDATE app_configs 
      SET name = ?, exe_path = ?, method = ?, copies = ?, delay = ?
      WHERE id = ?
    `).run(
      name || config.name,
      exe_path || config.exe_path,
      method || config.method,
      copies || config.copies,
      delay || config.delay,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM app_configs WHERE id = ?').get(req.params.id);
    res.json(updated);
  });

  // Delete config
  router.delete('/:id', authenticateToken, (req, res) => {
    const config = db.prepare('SELECT * FROM app_configs WHERE id = ?').get(req.params.id);

    if (!config) {
      return res.status(404).json({ error: 'Config not found' });
    }

    if (req.user.role !== 'admin' && config.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    db.prepare('DELETE FROM app_configs WHERE id = ?').run(req.params.id);
    res.json({ message: 'Config deleted' });
  });

  return router;
}
