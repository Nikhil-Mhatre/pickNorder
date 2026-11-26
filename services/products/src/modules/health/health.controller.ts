import type { RequestHandler } from 'express';
import { db } from '../../prisma/db.js';

export const livenessController: RequestHandler = (_req, res) => {
  res.status(200).json({
    status: 'ok',
  });
};

export const readinessController: RequestHandler = async (_req, res) => {
  try {
    await db.query(db.raw.sql`SELECT 1 AS ok`.returnsRow({ ok: 'pg/int4@1' }).build());

    res.status(200).json({
      status: 'ok',
    });
  } catch {
    res.status(503).json({
      status: 'error',
    });
  }
};
