import { Request, Response, NextFunction } from 'express';
import { pastPaperService } from './pastpaper.service.js';

export class PastPaperController {
  async uploadPastPaper(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, board, class: classId, subject, year } = req.body;
      const fileUrl = req.body.fileUrl || '';
      const fileName = req.body.fileName || 'past-paper.pdf';

      const paper = await pastPaperService.uploadPastPaper({
        title,
        board,
        class: classId,
        subject,
        year,
        fileUrl,
        fileName,
        uploadedBy: req.user!.userId,
      });

      res.status(201).json({ success: true, data: paper });
    } catch (error) {
      next(error);
    }
  }

  async getPastPapers(req: Request, res: Response, next: NextFunction) {
    try {
      const { board, class: classId, subject, year, page = 1, limit = 20 } = req.query;
      const result = await pastPaperService.getPastPapers(
        board as string,
        classId as string,
        subject as string,
        year ? Number(year) : undefined,
        Number(page),
        Number(limit)
      );
      res.status(200).json({
        success: true,
        data: result.papers,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getPastPaperById(req: Request, res: Response, next: NextFunction) {
    try {
      const paper = await pastPaperService.getPastPaperById(req.params.id as string);
      res.status(200).json({ success: true, data: paper });
    } catch (error) {
      next(error);
    }
  }

  async getPastPaperText(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await pastPaperService.getPastPaperText(req.params.id as string);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async updatePastPaper(req: Request, res: Response, next: NextFunction) {
    try {
      const paper = await pastPaperService.updatePastPaper(req.params.id as string, req.body);
      res.status(200).json({ success: true, data: paper });
    } catch (error) {
      next(error);
    }
  }

  async deletePastPaper(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await pastPaperService.deletePastPaper(req.params.id as string);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const pastPaperController = new PastPaperController();
