import { Request, Response, NextFunction } from 'express';
import { testService } from './test.service.js';
import { pdfService } from '../../services/pdf.service.js';

export class TestController {
  async generateTest(req: Request, res: Response, next: NextFunction) {
    try {
      const { topics, difficulty, numQuestions, questionTypes, board, classLevel, subject } = req.body;
      const test = await testService.generateTest({
        topics,
        difficulty,
        numQuestions: numQuestions || 10,
        questionTypes: questionTypes || ['mcq'],
        board,
        classLevel,
        subject,
        createdBy: req.user!.userId,
      });
      res.status(201).json({ success: true, data: test });
    } catch (error) {
      next(error);
    }
  }

  async getTestById(req: Request, res: Response, next: NextFunction) {
    try {
      const test = await testService.getTestById(req.params.id as string);
      res.status(200).json({ success: true, data: test });
    } catch (error) {
      next(error);
    }
  }

  async getTests(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const result = await testService.getTestsForStudent(Number(page), Number(limit));
      res.status(200).json({ success: true, data: result.tests, pagination: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages } });
    } catch (error) {
      next(error);
    }
  }

  async downloadTestPDF(req: Request, res: Response, next: NextFunction) {
    try {
      const test = await testService.getTestById(req.params.id as string);
      const pdfBuffer = await pdfService.generateTestPDF({
        title: test.title,
        instructions: test.instructions,
        questions: test.questions,
        totalMarks: test.totalMarks,
        board: test.board,
        classLevel: test.classLevel,
        subject: test.subject,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${test.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }

  async startAttempt(req: Request, res: Response, next: NextFunction) {
    try {
      const { testId } = req.body;
      const attempt = await testService.startAttempt(testId, req.user!.userId);
      res.status(201).json({ success: true, data: attempt });
    } catch (error) {
      next(error);
    }
  }

  async submitAttempt(req: Request, res: Response, next: NextFunction) {
    try {
      const { attemptId, answers } = req.body;
      const attempt = await testService.submitAttempt(attemptId, req.user!.userId, answers);
      res.status(200).json({ success: true, data: attempt });
    } catch (error) {
      next(error);
    }
  }

  async gradeAttempt(req: Request, res: Response, next: NextFunction) {
    try {
      const { attemptId } = req.body;
      const attempt = await testService.gradeSubjectiveAnswers(attemptId, req.user!.userId);
      res.status(200).json({ success: true, data: attempt });
    } catch (error) {
      next(error);
    }
  }

  async getAttempt(req: Request, res: Response, next: NextFunction) {
    try {
      const attempt = await testService.getAttemptById(req.params.id as string, req.user!.userId);
      res.status(200).json({ success: true, data: attempt });
    } catch (error) {
      next(error);
    }
  }

  async getMyAttempts(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const result = await testService.getStudentAttempts(req.user!.userId, Number(page), Number(limit));
      res.status(200).json({ success: true, data: result.attempts, pagination: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages } });
    } catch (error) {
      next(error);
    }
  }
}

export const testController = new TestController();
