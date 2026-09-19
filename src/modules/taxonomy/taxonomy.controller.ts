import { Request, Response, NextFunction } from 'express';
import { taxonomyService } from './taxonomy.service.js';

export class TaxonomyController {
  // Board operations
  async createBoard(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, country, code, province, districts } = req.body;
      const board = await taxonomyService.createBoard(name, country, code, province, districts);
      res.status(201).json({ success: true, data: board });
    } catch (error) {
      next(error);
    }
  }

  async getBoards(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const result = await taxonomyService.getBoards(Number(page), Number(limit));
      res.status(200).json({ success: true, data: result.boards, pagination: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages } });
    } catch (error) {
      next(error);
    }
  }

  async getBoardById(req: Request, res: Response, next: NextFunction) {
    try {
      const board = await taxonomyService.getBoardById(req.params.id as string);
      res.status(200).json({ success: true, data: board });
    } catch (error) {
      next(error);
    }
  }

  async updateBoard(req: Request, res: Response, next: NextFunction) {
    try {
      const board = await taxonomyService.updateBoard(req.params.id as string, req.body);
      res.status(200).json({ success: true, data: board });
    } catch (error) {
      next(error);
    }
  }

  async deleteBoard(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await taxonomyService.deleteBoard(req.params.id as string);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // Class operations
  async createClass(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, board, grade } = req.body;
      const classObj = await taxonomyService.createClass(name, board, grade);
      res.status(201).json({ success: true, data: classObj });
    } catch (error) {
      next(error);
    }
  }

  async getClasses(req: Request, res: Response, next: NextFunction) {
    try {
      const { board, page = 1, limit = 20 } = req.query;
      const result = await taxonomyService.getClasses(board as string, Number(page), Number(limit));
      res.status(200).json({ success: true, data: result.classes, pagination: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages } });
    } catch (error) {
      next(error);
    }
  }

  async getClassById(req: Request, res: Response, next: NextFunction) {
    try {
      const classObj = await taxonomyService.getClassById(req.params.id as string);
      res.status(200).json({ success: true, data: classObj });
    } catch (error) {
      next(error);
    }
  }

  async updateClass(req: Request, res: Response, next: NextFunction) {
    try {
      const classObj = await taxonomyService.updateClass(req.params.id as string, req.body);
      res.status(200).json({ success: true, data: classObj });
    } catch (error) {
      next(error);
    }
  }

  async deleteClass(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await taxonomyService.deleteClass(req.params.id as string);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // Subject operations
  async createSubject(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, class: classId, code } = req.body;
      const subject = await taxonomyService.createSubject(name, classId, code);
      res.status(201).json({ success: true, data: subject });
    } catch (error) {
      next(error);
    }
  }

  async getSubjects(req: Request, res: Response, next: NextFunction) {
    try {
      const { class: classId, page = 1, limit = 20 } = req.query;
      const result = await taxonomyService.getSubjects(classId as string, Number(page), Number(limit));
      res.status(200).json({ success: true, data: result.subjects, pagination: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages } });
    } catch (error) {
      next(error);
    }
  }

  async getSubjectById(req: Request, res: Response, next: NextFunction) {
    try {
      const subject = await taxonomyService.getSubjectById(req.params.id as string);
      res.status(200).json({ success: true, data: subject });
    } catch (error) {
      next(error);
    }
  }

  async updateSubject(req: Request, res: Response, next: NextFunction) {
    try {
      const subject = await taxonomyService.updateSubject(req.params.id as string, req.body);
      res.status(200).json({ success: true, data: subject });
    } catch (error) {
      next(error);
    }
  }

  async deleteSubject(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await taxonomyService.deleteSubject(req.params.id as string);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // Topic operations
  async createTopic(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, subject, description, order } = req.body;
      const topic = await taxonomyService.createTopic(name, subject, description, order);
      res.status(201).json({ success: true, data: topic });
    } catch (error) {
      next(error);
    }
  }

  async getTopics(req: Request, res: Response, next: NextFunction) {
    try {
      const { subject, page = 1, limit = 20 } = req.query;
      const result = await taxonomyService.getTopics(subject as string, Number(page), Number(limit));
      res.status(200).json({ success: true, data: result.topics, pagination: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages } });
    } catch (error) {
      next(error);
    }
  }

  async getTopicById(req: Request, res: Response, next: NextFunction) {
    try {
      const topic = await taxonomyService.getTopicById(req.params.id as string);
      res.status(200).json({ success: true, data: topic });
    } catch (error) {
      next(error);
    }
  }

  async updateTopic(req: Request, res: Response, next: NextFunction) {
    try {
      const topic = await taxonomyService.updateTopic(req.params.id as string, req.body);
      res.status(200).json({ success: true, data: topic });
    } catch (error) {
      next(error);
    }
  }

  async deleteTopic(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await taxonomyService.deleteTopic(req.params.id as string);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // Get full taxonomy tree
  async getTaxonomyTree(req: Request, res: Response, next: NextFunction) {
    try {
      const { board, class: classId, subject } = req.query;
      const tree = await taxonomyService.getTaxonomyTree(board as string, classId as string, subject as string);
      res.status(200).json({ success: true, data: tree });
    } catch (error) {
      next(error);
    }
  }
}

export const taxonomyController = new TaxonomyController();
