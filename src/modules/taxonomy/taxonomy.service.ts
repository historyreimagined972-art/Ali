import { Board } from '../boards/board.model.js';
import { Class } from '../classes/class.model.js';
import { Subject } from '../subjects/subject.model.js';
import { Topic } from '../topics/topic.model.js';
import { AppError } from '../../middleware/errorHandler.js';

export class TaxonomyService {
  // Board operations
  async createBoard(name: string, country: string = 'Pakistan', code?: string, province?: string, districts?: string[]) {
    const existing = await Board.findOne({ name, country });
    if (existing) {
      throw new AppError('Board already exists', 409, 'CONFLICT');
    }
    if (code) {
      const codeExists = await Board.findOne({ code });
      if (codeExists) {
        throw new AppError('Board code already exists', 409, 'CONFLICT');
      }
    }
    return Board.create({ name, country, code, province, districts });
  }

  async getBoards(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [boards, total] = await Promise.all([
      Board.find().skip(skip).limit(limit).sort({ name: 1 }),
      Board.countDocuments(),
    ]);
    return { boards, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getBoardById(id: string) {
    const board = await Board.findById(id);
    if (!board) {
      throw new AppError('Board not found', 404, 'NOT_FOUND');
    }
    return board;
  }

  async updateBoard(id: string, data: { name?: string; country?: string; isActive?: boolean }) {
    const board = await Board.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!board) {
      throw new AppError('Board not found', 404, 'NOT_FOUND');
    }
    return board;
  }

  async deleteBoard(id: string) {
    const board = await Board.findByIdAndDelete(id);
    if (!board) {
      throw new AppError('Board not found', 404, 'NOT_FOUND');
    }
    // Also delete related classes, subjects, topics
    const classes = await Class.find({ board: id });
    const classIds = classes.map(c => c._id);
    await Subject.deleteMany({ class: { $in: classIds } });
    await Topic.deleteMany({ subject: { $in: (await Subject.find({ class: { $in: classIds } })).map(s => s._id) } });
    await Class.deleteMany({ board: id });
    return { message: 'Board deleted successfully' };
  }

  // Class operations
  async createClass(name: string, boardId: string, grade: number) {
    const board = await Board.findById(boardId);
    if (!board) {
      throw new AppError('Board not found', 404, 'NOT_FOUND');
    }

    const existing = await Class.findOne({ name, board: boardId });
    if (existing) {
      throw new AppError('Class already exists in this board', 409, 'CONFLICT');
    }

    return Class.create({ name, board: boardId, grade });
  }

  async getClasses(boardId?: string, page: number = 1, limit: number = 20) {
    const filter = boardId ? { board: boardId } : {};
    const skip = (page - 1) * limit;
    const [classes, total] = await Promise.all([
      Class.find(filter).populate('board', 'name country').skip(skip).limit(limit).sort({ grade: 1 }),
      Class.countDocuments(filter),
    ]);
    return { classes, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getClassById(id: string) {
    const classObj = await Class.findById(id).populate('board', 'name country');
    if (!classObj) {
      throw new AppError('Class not found', 404, 'NOT_FOUND');
    }
    return classObj;
  }

  async updateClass(id: string, data: { name?: string; board?: string; grade?: number; isActive?: boolean }) {
    const classObj = await Class.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!classObj) {
      throw new AppError('Class not found', 404, 'NOT_FOUND');
    }
    return classObj;
  }

  async deleteClass(id: string) {
    const classObj = await Class.findByIdAndDelete(id);
    if (!classObj) {
      throw new AppError('Class not found', 404, 'NOT_FOUND');
    }
    // Delete related subjects and topics
    const subjects = await Subject.find({ class: id });
    const subjectIds = subjects.map(s => s._id);
    await Topic.deleteMany({ subject: { $in: subjectIds } });
    await Subject.deleteMany({ class: id });
    return { message: 'Class deleted successfully' };
  }

  // Subject operations
  async createSubject(name: string, classId: string, code?: string) {
    const classObj = await Class.findById(classId);
    if (!classObj) {
      throw new AppError('Class not found', 404, 'NOT_FOUND');
    }

    const existing = await Subject.findOne({ name, class: classId });
    if (existing) {
      throw new AppError('Subject already exists in this class', 409, 'CONFLICT');
    }

    return Subject.create({ name, class: classId, code });
  }

  async getSubjects(classId?: string, page: number = 1, limit: number = 20) {
    const filter = classId ? { class: classId } : {};
    const skip = (page - 1) * limit;
    const [subjects, total] = await Promise.all([
      Subject.find(filter).populate({ path: 'class', populate: { path: 'board', select: 'name country' } }).skip(skip).limit(limit).sort({ name: 1 }),
      Subject.countDocuments(filter),
    ]);
    return { subjects, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getSubjectById(id: string) {
    const subject = await Subject.findById(id).populate({ path: 'class', populate: { path: 'board', select: 'name country' } });
    if (!subject) {
      throw new AppError('Subject not found', 404, 'NOT_FOUND');
    }
    return subject;
  }

  async updateSubject(id: string, data: { name?: string; class?: string; code?: string; isActive?: boolean }) {
    const subject = await Subject.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!subject) {
      throw new AppError('Subject not found', 404, 'NOT_FOUND');
    }
    return subject;
  }

  async deleteSubject(id: string) {
    const subject = await Subject.findByIdAndDelete(id);
    if (!subject) {
      throw new AppError('Subject not found', 404, 'NOT_FOUND');
    }
    await Topic.deleteMany({ subject: id });
    return { message: 'Subject deleted successfully' };
  }

  // Topic operations
  async createTopic(name: string, subjectId: string, description?: string, order?: number) {
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      throw new AppError('Subject not found', 404, 'NOT_FOUND');
    }

    const existing = await Topic.findOne({ name, subject: subjectId });
    if (existing) {
      throw new AppError('Topic already exists in this subject', 409, 'CONFLICT');
    }

    return Topic.create({ name, subject: subjectId, description, order });
  }

  async getTopics(subjectId?: string, page: number = 1, limit: number = 20) {
    const filter = subjectId ? { subject: subjectId } : {};
    const skip = (page - 1) * limit;
    const [topics, total] = await Promise.all([
      Topic.find(filter).populate({ path: 'subject', populate: { path: 'class', populate: { path: 'board', select: 'name country' } } }).skip(skip).limit(limit).sort({ order: 1, name: 1 }),
      Topic.countDocuments(filter),
    ]);
    return { topics, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getTopicById(id: string) {
    const topic = await Topic.findById(id).populate({ path: 'subject', populate: { path: 'class', populate: { path: 'board', select: 'name country' } } });
    if (!topic) {
      throw new AppError('Topic not found', 404, 'NOT_FOUND');
    }
    return topic;
  }

  async updateTopic(id: string, data: { name?: string; subject?: string; description?: string; order?: number; isActive?: boolean }) {
    const topic = await Topic.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!topic) {
      throw new AppError('Topic not found', 404, 'NOT_FOUND');
    }
    return topic;
  }

  async deleteTopic(id: string) {
    const topic = await Topic.findByIdAndDelete(id);
    if (!topic) {
      throw new AppError('Topic not found', 404, 'NOT_FOUND');
    }
    return { message: 'Topic deleted successfully' };
  }

  // Get full taxonomy tree — optimized with parallel queries instead of N+1
  async getTaxonomyTree(boardId?: string, classId?: string, subjectId?: string) {
    const boardFilter: any = {};
    if (boardId) boardFilter._id = boardId;

    // Fetch all data in parallel
    const [boards, allClasses, allSubjects, allTopics] = await Promise.all([
      Board.find(boardFilter).sort({ name: 1 }).lean(),
      Class.find({ isActive: true, ...(classId ? { _id: classId } : {}) }).sort({ grade: 1 }).lean(),
      Subject.find({ isActive: true, ...(subjectId ? { _id: subjectId } : {}) }).sort({ name: 1 }).lean(),
      Topic.find({ isActive: true }).sort({ order: 1, name: 1 }).lean(),
    ]);

    // Build lookup maps
    const classMap = new Map<string, any[]>();
    for (const cls of allClasses) {
      const boardId = String(cls.board);
      if (!classMap.has(boardId)) classMap.set(boardId, []);
      classMap.get(boardId)!.push(cls);
    }

    const subjectMap = new Map<string, any[]>();
    for (const subject of allSubjects) {
      const classId = String(subject.class);
      if (!subjectMap.has(classId)) subjectMap.set(classId, []);
      subjectMap.get(classId)!.push(subject);
    }

    const topicMap = new Map<string, any[]>();
    for (const topic of allTopics) {
      const subjectId = String(topic.subject);
      if (!topicMap.has(subjectId)) topicMap.set(subjectId, []);
      topicMap.get(subjectId)!.push(topic);
    }

    // Assemble tree
    return boards.map((board) => {
      const classes = (classMap.get(String(board._id)) || []).map((cls) => {
        const subjects = (subjectMap.get(String(cls._id)) || []).map((subject) => ({
          _id: subject._id,
          name: subject.name,
          code: subject.code,
          topics: topicMap.get(String(subject._id)) || [],
        }));
        return {
          _id: cls._id,
          name: cls.name,
          grade: cls.grade,
          subjects,
        };
      });
      return {
        _id: board._id,
        name: board.name,
        code: board.code,
        country: board.country,
        province: board.province,
        districts: board.districts,
        classes,
      };
    });
  }
}

export const taxonomyService = new TaxonomyService();
