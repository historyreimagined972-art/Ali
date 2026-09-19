import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

interface TestPDFData {
  title: string;
  instructions: string;
  questions: {
    number: number;
    type: 'mcq' | 'short' | 'long';
    question: string;
    marks: number;
    options?: string[];
  }[];
  totalMarks: number;
  board?: string;
  classLevel?: string;
  subject?: string;
}

export class PDFService {
  async generateTestPDF(testData: TestPDFData): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const margin = 50;
    let y = height - margin;

    // Header
    page.drawText(testData.title, {
      x: margin,
      y,
      size: 18,
      font: timesRomanBoldFont,
      color: rgb(0, 0, 0),
    });
    y -= 30;

    // Board/Class/Subject info
    const infoParts = [];
    if (testData.board) infoParts.push(`Board: ${testData.board}`);
    if (testData.classLevel) infoParts.push(`Class: ${testData.classLevel}`);
    if (testData.subject) infoParts.push(`Subject: ${testData.subject}`);
    
    if (infoParts.length > 0) {
      page.drawText(infoParts.join(' | '), {
        x: margin,
        y,
        size: 10,
        font: timesRomanFont,
        color: rgb(0.5, 0.5, 0.5),
      });
      y -= 20;
    }

    // Total marks
    page.drawText(`Total Marks: ${testData.totalMarks}`, {
      x: margin,
      y,
      size: 12,
      font: timesRomanBoldFont,
      color: rgb(0, 0, 0),
    });
    y -= 25;

    // Instructions
    page.drawText('Instructions:', {
      x: margin,
      y,
      size: 12,
      font: timesRomanBoldFont,
      color: rgb(0, 0, 0),
    });
    y -= 15;

    const instructionLines = this.wrapText(testData.instructions, width - 2 * margin, timesRomanFont, 10);
    for (const line of instructionLines) {
      page.drawText(line, {
        x: margin,
        y,
        size: 10,
        font: timesRomanFont,
        color: rgb(0, 0, 0),
      });
      y -= 12;
    }
    y -= 15;

    // Questions
    for (const question of testData.questions) {
      // Check if we need a new page
      if (y < margin + 100) {
        y = height - margin;
        pdfDoc.addPage();
      }

      // Question number and marks
      const questionHeader = `Q${question.number}. (${question.marks} marks)`;
      page.drawText(questionHeader, {
        x: margin,
        y,
        size: 11,
        font: timesRomanBoldFont,
        color: rgb(0, 0, 0),
      });
      y -= 15;

      // Question text
      const questionLines = this.wrapText(question.question, width - 2 * margin, timesRomanFont, 10);
      for (const line of questionLines) {
        page.drawText(line, {
          x: margin,
          y,
          size: 10,
          font: timesRomanFont,
          color: rgb(0, 0, 0),
        });
        y -= 12;
      }
      y -= 5;

      // MCQ options
      if (question.type === 'mcq' && question.options) {
        for (let i = 0; i < question.options.length; i++) {
          const optionText = `  ${String.fromCharCode(65 + i)}. ${question.options[i]}`;
          page.drawText(optionText, {
            x: margin + 10,
            y,
            size: 10,
            font: timesRomanFont,
            color: rgb(0, 0, 0),
          });
          y -= 12;
        }
      }

      // Answer space for short/long questions
      if (question.type === 'short') {
        y -= 5;
        for (let i = 0; i < 4; i++) {
          page.drawText('_'.repeat(80), {
            x: margin,
            y,
            size: 10,
            font: timesRomanFont,
            color: rgb(0.8, 0.8, 0.8),
          });
          y -= 15;
        }
      } else if (question.type === 'long') {
        y -= 5;
        for (let i = 0; i < 8; i++) {
          page.drawText('_'.repeat(80), {
            x: margin,
            y,
            size: 10,
            font: timesRomanFont,
            color: rgb(0.8, 0.8, 0.8),
          });
          y -= 15;
        }
      }

      y -= 15;
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  private wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);
      
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [''];
  }
}

export const pdfService = new PDFService();
