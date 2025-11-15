import { Router, Request, Response } from 'express';
const r = Router();
r.post('/login', (req: Request, res: Response) => res.json({ ok: true }));
r.post('/register', (req: Request, res: Response) => res.json({ ok: true }));
export default r;