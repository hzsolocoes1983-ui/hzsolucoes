import { Router } from 'express';
const r = Router();
r.post('/login', (req, res) => res.json({ ok: true }));
r.post('/register', (req, res) => res.json({ ok: true }));
export default r;