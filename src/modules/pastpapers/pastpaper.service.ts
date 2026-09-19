import { PastPaper } from './pastpaper.model.js';
import { AppError } from '../../middleware/errorHandler.js';

export class PastPaperService {
  async uploadPastPaper(data: {
    title: string;
    board: string;
    class: string;
    subject: string;
    year: number;
    fileUrl: string;
    fileName: string;
    extractedText?: string;
    uploadedBy: string;
  }) {
    return PastPaper.create(data);
  }

  async getPastPapers(
    boardId?: string,
    classId?: string,
    subjectId?: string,
    year?: number,
    page: number = 1,
    limit: number = 20
  ) {
    const filter: any = {};
    if (boardId) filter.board = boardId;
    if (classId) filter.class = classId;
    if (subjectId) filter.subject = subjectId;
    if (year) filter.year = year;

    const skip = (page - 1) * limit;
    const [papers, total] = await Promise.all([
      PastPaper.find(filter)
        .populate('board', 'name country')
        .populate('class', 'name grade')
        .populate('subject', 'name code')
        .skip(skip)
        .limit(limit)
        .sort({ year: -1, createdAt: -1 }),
      PastPaper.countDocuments(filter),
    ]);

    return { papers, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getPastPaperById(id: string) {
    const paper = await PastPaper.findById(id)
      .populate('board', 'name country')
      .populate('class', 'name grade')
      .populate('subject', 'name code');

    if (!paper) {
      throw new AppError('Past paper not found', 404, 'NOT_FOUND');
    }

    return paper;
  }

  async getPastPaperText(id: string) {
    const paper = await PastPaper.findById(id).select('+extractedText');
    if (!paper) {
      throw new AppError('Past paper not found', 404, 'NOT_FOUND');
    }
    return { extractedText: paper.extractedText || null };
  }

  async updatePastPaper(id: string, data: {
    title?: string;
    board?: string;
    class?: string;
    subject?: string;
    year?: number;
  }) {
    const paper = await PastPaper.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!paper) {
      throw new AppError('Past paper not found', 404, 'NOT_FOUND');
    }
    return paper;
  }

  async deletePastPaper(id: string) {
    const paper = await PastPaper.findByIdAndDelete(id);
    if (!paper) {
      throw new AppError('Past paper not found', 404, 'NOT_FOUND');
    }
    return { message: 'Past paper deleted successfully' };
  }

  // Get past papers for AI grounding reference
  async getPastPapersForReference(boardId: string, classId: string, subjectId: string, limit: number = 5) {
    const papers = await PastPaper.find({
      board: boardId,
      class: classId,
      subject: subjectId,
    })
      .select('+extractedText')
      .sort({ year: -1 })
      .limit(limit);

    return papers.filter(p => p.extractedText).map(p => ({
      year: p.year,
      title: p.title,
      text: p.extractedText,
    }));
  }
}

export const pastPaperService = new PastPaperService();
