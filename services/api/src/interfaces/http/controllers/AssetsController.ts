import type { Request, Response } from 'express';
import { SUPPORTED_ASSETS } from '../../../config/assets.js';

export class AssetsController {
  getAll(_req: Request, res: Response): void {
    res.status(200).json({
      data: SUPPORTED_ASSETS,
    });
  }
}
