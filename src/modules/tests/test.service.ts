import { Test } from './test.model.js';
import { Attempt } from './attempt.model.js';
import { aiService } from '../../services/ai.service.js';
import { AppError } from '../../middleware/errorHandler.js';

export class TestService {
  async generateTest(params: {
    topics: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    numQuestions: number;
    questionTypes: ('mcq' | 'short' | 'long')[];
    board?: string;
    classLevel?: string;
    subject?: string;
    createdBy: string;
  }) {
    const testContent = await aiService.generateTest(params);

    const test = await Test.create({
      title: testContent.title,
      instructions: testContent.instructions,
      topics: params.topics,
      difficulty: params.difficulty,
      questions: testContent.questions,
      totalMarks: testContent.totalMarks,
      board: params.board,
      classLevel: params.classLevel,
      subject: params.subject,
      createdBy: params.createdBy,
    });

    return test;
  }

  async getTestById(id: string) {
    const test = await Test.findById(id);
    if (!test) {
      throw new AppError('Test not found', 404, 'NOT_FOUND');
    }
    return test;
  }

  async getTestsForStudent(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [tests, total] = await Promise.all([
      Test.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
      Test.countDocuments(),
    ]);
    return { tests, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async startAttempt(testId: string, studentId: string) {
    const test = await Test.findById(testId);
    if (!test) {
      throw new AppError('Test not found', 404, 'NOT_FOUND');
    }

    // Check if student already has an in-progress attempt
    const existingAttempt = await Attempt.findOne({
      test: testId,
      student: studentId,
      status: 'in_progress',
    });

    if (existingAttempt) {
      return existingAttempt;
    }

    // Create new attempt
    const answers = test.questions.map(q => ({
      questionNumber: q.number,
      type: q.type,
      studentAnswer: '',
      maxScore: q.marks,
    }));

    const attempt = await Attempt.create({
      test: testId,
      student: studentId,
      answers,
      maxScore: test.totalMarks,
      status: 'in_progress',
    });

    return attempt;
  }

  async submitAttempt(attemptId: string, studentId: string, answers: { questionNumber: number; type: string; studentAnswer: string }[]) {
    const attempt = await Attempt.findOne({ _id: attemptId, student: studentId });
    if (!attempt) {
      throw new AppError('Attempt not found', 404, 'NOT_FOUND');
    }

    if (attempt.status !== 'in_progress') {
      throw new AppError('Attempt already submitted', 400, 'INVALID_REQUEST');
    }

    // Update answers
    attempt.answers = answers.map(a => ({
      questionNumber: a.questionNumber,
      type: a.type as 'mcq' | 'short' | 'long',
      studentAnswer: a.studentAnswer,
      maxScore: attempt.answers.find(ea => ea.questionNumber === a.questionNumber)?.maxScore || 0,
    }));

    attempt.status = 'submitted';
    attempt.submittedAt = new Date();

    // Auto-grade MCQs
    const test = await Test.findById(attempt.test);
    if (test) {
      let totalScore = 0;
      for (const answer of attempt.answers) {
        const question = test.questions.find(q => q.number === answer.questionNumber);
        if (question && question.type === 'mcq' && question.correctAnswer) {
          const isCorrect = answer.studentAnswer.toUpperCase() === question.correctAnswer.toUpperCase();
          answer.isCorrect = isCorrect;
          answer.score = isCorrect ? question.marks : 0;
          answer.feedback = isCorrect ? 'Correct' : `Correct answer: ${question.correctAnswer}`;
          totalScore += answer.score || 0;
        }
      }
      attempt.totalScore = totalScore;
      attempt.percentage = (totalScore / attempt.maxScore) * 100;
    }

    await attempt.save();
    return attempt;
  }

  async gradeSubjectiveAnswers(attemptId: string, studentId: string) {
    const attempt = await Attempt.findOne({ _id: attemptId, student: studentId });
    if (!attempt) {
      throw new AppError('Attempt not found', 404, 'NOT_FOUND');
    }

    const test = await Test.findById(attempt.test);
    if (!test) {
      throw new AppError('Test not found', 404, 'NOT_FOUND');
    }

    // Grade subjective answers
    for (const answer of attempt.answers) {
      if ((answer.type === 'short' || answer.type === 'long') && answer.studentAnswer) {
        const question = test.questions.find(q => q.number === answer.questionNumber);
        if (question) {
          const grading = await aiService.gradeSubjectiveAnswer(
            question.question,
            answer.studentAnswer,
            question.correctAnswer || '',
            question.rubric,
            test.board,
            test.classLevel,
            test.subject
          );

          answer.score = grading.score;
          answer.feedback = grading.feedback;
          answer.maxScore = question.marks;
        }
      }
    }

    // Recalculate totals
    attempt.totalScore = attempt.answers.reduce((sum, a) => sum + (a.score || 0), 0);
    attempt.percentage = (attempt.totalScore / attempt.maxScore) * 100;
    attempt.status = 'graded';
    attempt.gradedAt = new Date();

    await attempt.save();
    return attempt;
  }

  async getAttemptById(attemptId: string, studentId: string) {
    const attempt = await Attempt.findOne({ _id: attemptId, student: studentId })
      .populate('test', 'title instructions questions totalMarks');
    if (!attempt) {
      throw new AppError('Attempt not found', 404, 'NOT_FOUND');
    }
    return attempt;
  }

  async getStudentAttempts(studentId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [attempts, total] = await Promise.all([
      Attempt.find({ student: studentId })
        .populate('test', 'title difficulty totalMarks')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Attempt.countDocuments({ student: studentId }),
    ]);
    return { attempts, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

export const testService = new TestService();
