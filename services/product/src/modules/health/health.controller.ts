import type { Request, Response } from 'express';
import { db } from '../../prisma/db.js';

export const livenessCheck = (_req: Request, res: Response): void => {
  res.status(200).json({
    status: 'ok',
  });
};

export const readinessCheck = async (_req: Request, res: Response): Promise<void> => {
  try {
    // await prisma.$queryRaw`SELECT 1`;
    db.raw.sql`SELECT 1`;

    res.status(200).json({
      status: 'ready',
    });
  } catch {
    res.status(503).json({
      status: 'not_ready',
    });
  }
};
