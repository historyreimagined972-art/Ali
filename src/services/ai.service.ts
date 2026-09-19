import { env } from '../config/env.js';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export class AIService {
  private apiKey: string;
  private baseUrl: string;
  private appName: string;
  private appUrl: string;

  constructor() {
    this.apiKey = env.OPENROUTER_API_KEY;
    this.baseUrl = 'https://openrouter.ai/api/v1';
    this.appName = env.OPENROUTER_APP_NAME;
    this.appUrl = env.OPENROUTER_APP_URL;
  }

  private async chat(messages: ChatMessage[], model?: string): Promise<string> {
    const models = model ? [model] : [
      'google/gemma-4-26b-a4b-it:free',
      'google/gemma-4-31b-it:free',
      'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
    ];

    for (const m of models) {
      try {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': this.appUrl,
            'X-OpenRouter-Title': this.appName,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: m,
            messages,
          }),
        });

        if (response.ok) {
          const data = await response.json() as ChatCompletionResponse;
          return data.choices[0]?.message?.content || '';
        }

        // Rate limited or unavailable — try next model
        if (response.status === 429 || response.status === 404) continue;

        // Other errors — throw
        const error = await response.text();
        throw new Error(`AI API error: ${response.status} - ${error}`);
      } catch (err: any) {
        if (err.message?.includes('AI API error:')) throw err;
        // Network error — try next model
        continue;
      }
    }

    throw new Error('All AI models are currently unavailable. Please try again later.');
  }

  async answerWithTranscript(transcript: string, question: string): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are a helpful AI tutor for Pakistani students. You must answer questions using ONLY the provided transcript from a video lesson. 

Rules:
1. Answer based ONLY on the transcript content
2. If the answer is not in the transcript, clearly state "This information is not covered in the video transcript" and then provide a general explanation marked as [General Knowledge]
3. Keep explanations clear, simple, and appropriate for Pakistani students
4. Use examples from the transcript when possible
5. If the transcript is in Urdu or mixed language, respond in the same style`,
      },
      {
        role: 'user',
        content: `Transcript from the video lesson:\n\n${transcript}\n\n---\n\nStudent's question: ${question}`,
      },
    ];

    return this.chat(messages);
  }

  async generateTest(params: {
    topics: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    numQuestions: number;
    questionTypes: ('mcq' | 'short' | 'long')[];
    board?: string;
    classLevel?: string;
    subject?: string;
  }): Promise<{
    title: string;
    instructions: string;
    questions: {
      number: number;
      type: 'mcq' | 'short' | 'long';
      question: string;
      marks: number;
      options?: string[];
      correctAnswer?: string;
      rubric?: string;
    }[];
    totalMarks: number;
  }> {
    const prompt = `Generate a ${params.difficulty} difficulty test paper for Pakistani students.

Topics: ${params.topics.join(', ')}
${params.board ? `Board: ${params.board}` : ''}
${params.classLevel ? `Class: ${params.classLevel}` : ''}
${params.subject ? `Subject: ${params.subject}` : ''}
Number of questions: ${params.numQuestions}
Question types: ${params.questionTypes.join(', ')}

Create a professional test paper with:
1. A title
2. Instructions for students
3. ${params.numQuestions} questions with marks分配
4. For MCQs: 4 options each with one correct answer
5. For short answers: brief model answers
6. For long answers: detailed rubrics

Return the response in this exact JSON format:
{
  "title": "Test Title",
  "instructions": "Instructions text",
  "questions": [
    {
      "number": 1,
      "type": "mcq",
      "question": "Question text",
      "marks": 1,
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A"
    }
  ],
  "totalMarks": total
}`;

    const response = await this.chat([{ role: 'user', content: prompt }]);
    
    // Parse JSON response
    try {
      // Extract JSON from response (might be wrapped in markdown code block)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch {
      // Fallback: create a basic test structure
      return {
        title: `${params.difficulty.charAt(0).toUpperCase() + params.difficulty.slice(1)} Test`,
        instructions: 'Answer all questions. Read each question carefully before answering.',
        questions: [],
        totalMarks: 0,
      };
    }
  }

  async gradeSubjectiveAnswer(
    question: string,
    studentAnswer: string,
    modelAnswer: string,
    rubric?: string,
    board?: string,
    classLevel?: string,
    subject?: string
  ): Promise<{
    score: number;
    maxScore: number;
    feedback: string;
    rubricMatch: string[];
  }> {
    const prompt = `Grade this student's answer for a Pakistani ${board || ''} board ${classLevel || ''} ${subject || ''} exam.

Question: ${question}

Model Answer: ${modelAnswer}
${rubric ? `Rubric: ${rubric}` : ''}

Student's Answer: ${studentAnswer}

Grade the answer based on:
1. Accuracy of information
2. Completeness of response
3. Use of relevant terminology
4. Structure and clarity

Return in this JSON format:
{
  "score": points earned,
  "maxScore": maximum possible points,
  "feedback": "Detailed feedback for the student",
  "rubricMatch": [" criterion 1 met", "criterion 2 not met"]
}`;

    const response = await this.chat([{ role: 'user', content: prompt }]);
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch {
      return {
        score: 0,
        maxScore: 10,
        feedback: 'Unable to grade automatically. Please review manually.',
        rubricMatch: [],
      };
    }
  }

  async matchVideosToQuery(query: string, videoTitles: { id: string; title: string }[]): Promise<string[]> {
    if (videoTitles.length === 0) return [];

    const videoList = videoTitles.map((v, i) => `${i + 1}. [ID: ${v.id}] ${v.title}`).join('\n');

    const prompt = `A student is searching for a video lesson. They typed: "${query}"

Here are the available videos:
${videoList}

Return ONLY a JSON array of video IDs (the numbers in square brackets) that are relevant to the student's question, ordered by relevance (most relevant first). If none are relevant, return an empty array.

Return format: ["id1", "id2"]`;

    const response = await this.chat([{ role: 'user', content: prompt }]);

    try {
      const jsonMatch = response.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch {
      return [];
    }
  }
}

export const aiService = new AIService();
