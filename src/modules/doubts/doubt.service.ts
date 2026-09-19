import { aiService } from '../../services/ai.service.js';

export class DoubtService {
  async askDoubt(transcript: string, question: string) {
    const answer = await aiService.answerWithTranscript(transcript, question);
    return {
      question,
      answer,
      isGroundedInTranscript: !answer.includes('[General Knowledge]'),
    };
  }
}

export const doubtService = new DoubtService();
