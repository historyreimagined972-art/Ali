import { Request, Response, NextFunction } from 'express';
import { doubtService } from './doubt.service.js';

export class DoubtController {
  async askDoubt(req: Request, res: Response, next: NextFunction) {
    try {
      const { transcript, question } = req.body;
      const result = await doubtService.askDoubt(transcript, question);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const doubtController = new DoubtController();
