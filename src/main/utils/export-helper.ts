import { Document, Paragraph, TextRun, AlignmentType, Packer } from 'docx';
import { jsPDF } from 'jspdf';
import { TIMESTAMP_REGEX } from './vtt-parser';

interface ExportOptions {
  title?: string;
  fileName?: string;
}

/**
 * Generate Word document buffer from transcription text
 */
export async function generateWordDocument(
  text: string,
  options: ExportOptions = {}
): Promise<Buffer> {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text parameter: expected non-empty string');
  }

  const { title = 'Transcription', fileName = 'transcription' } = options;

  const lines = text.split('\n').filter((line) => line.trim());
  const paragraphs: Paragraph[] = [];

  // Add title
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 32, // 16pt
        }),
      ],
      spacing: { after: 400 },
      alignment: AlignmentType.CENTER,
    })
  );

  // Add metadata
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `File: ${fileName}`,
          italics: true,
          size: 20, // 10pt
        }),
      ],
      spacing: { after: 200 },
    })
  );

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated: ${new Date().toLocaleString()}`,
          italics: true,
          size: 20, // 10pt
        }),
      ],
      spacing: { after: 400 },
    })
  );

  // Process transcription content
  let currentTimestamp = '';
  let currentText = '';
  let hasStructuredContent = false;

  for (const line of lines) {
    if (line.startsWith('WEBVTT')) continue;

    const timestampMatch = line.match(TIMESTAMP_REGEX);

    if (timestampMatch) {
      if (currentText.trim()) {
        hasStructuredContent = true;
        paragraphs.push(
          new Paragraph({
            children: [
              ...(currentTimestamp
                ? [
                    new TextRun({
                      text: currentTimestamp,
                      color: '666666',
                      size: 18,
                    }),
                    new TextRun({
                      text: '\n',
                      size: 18,
                    }),
                  ]
                : []),
              new TextRun({
                text: currentText.trim(),
                size: 22, // 11pt
              }),
            ],
            spacing: { after: 200 },
          })
        );
      }
      currentTimestamp = line.trim();
      currentText = '';
    } else {
      currentText += (currentText ? ' ' : '') + line.trim();
    }
  }

  // Add last segment
  if (currentText.trim()) {
    hasStructuredContent = true;
    paragraphs.push(
      new Paragraph({
        children: [
          ...(currentTimestamp
            ? [
                new TextRun({
                  text: currentTimestamp,
                  color: '666666',
                  size: 18,
                }),
                new TextRun({
                  text: '\n',
                  size: 18,
                }),
              ]
            : []),
          new TextRun({
            text: currentText.trim(),
            size: 22, // 11pt
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  // Fallback for unstructured text
  if (!hasStructuredContent && lines.length > 0) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: text,
            size: 22,
          }),
        ],
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

/**
 * Generate PDF document buffer from transcription text
 */
export async function generatePdfDocument(
  text: string,
  options: ExportOptions = {}
): Promise<Buffer> {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text parameter: expected non-empty string');
  }

  const { title = 'Transcription', fileName = 'transcription' } = options;

  // Create PDF document
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  // Add title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, y, { align: 'center' });
  y += 10;

  // Add metadata
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100);
  doc.text(`File: ${fileName}`, margin, y);
  y += 5;
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
  y += 15;

  // Reset font for content
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);

  const lines = text.split('\n').filter((line) => line.trim());
  let currentTimestamp = '';
  let currentText = '';
  let hasStructuredContent = false;

  const addParagraph = (timestamp: string, content: string) => {
    // Check if we need a new page
    if (y > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = 20;
    }

    if (timestamp) {
      doc.setTextColor(100);
      doc.setFontSize(9);
      doc.text(timestamp, margin, y);
      y += 5;
    }

    doc.setTextColor(0);
    doc.setFontSize(11);

    const splitText = doc.splitTextToSize(content, contentWidth);
    doc.text(splitText, margin, y);
    y += splitText.length * 5 + 5; // Line height + spacing
  };

  for (const line of lines) {
    if (line.startsWith('WEBVTT')) continue;

    const timestampMatch = line.match(TIMESTAMP_REGEX);

    if (timestampMatch) {
      if (currentText.trim()) {
        hasStructuredContent = true;
        addParagraph(currentTimestamp, currentText.trim());
      }
      currentTimestamp = line.trim();
      currentText = '';
    } else {
      currentText += (currentText ? ' ' : '') + line.trim();
    }
  }

  // Add last segment
  if (currentText.trim()) {
    hasStructuredContent = true;
    addParagraph(currentTimestamp, currentText.trim());
  }

  // Fallback for unstructured text
  if (!hasStructuredContent && lines.length > 0) {
    const splitText = doc.splitTextToSize(text, contentWidth);
    doc.text(splitText, margin, y);
  }

  return Buffer.from(doc.output('arraybuffer'));
}

/**
 * Generate Markdown document from transcription text
 */
export function generateMarkdownDocument(text: string, options: ExportOptions = {}): string {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text parameter: expected non-empty string');
  }

  const { title = 'Transcription', fileName = 'transcription' } = options;

  let markdown = `# ${title}\n\n`;
  markdown += `*File: ${fileName}*\n`;
  markdown += `*Generated: ${new Date().toLocaleString()}*\n\n`;
  markdown += `---\n\n`;

  const lines = text.split('\n').filter((line) => line.trim());
  let currentTimestamp = '';
  let currentText = '';
  let hasStructuredContent = false;

  for (const line of lines) {
    if (line.startsWith('WEBVTT')) continue;

    const timestampMatch = line.match(TIMESTAMP_REGEX);

    if (timestampMatch) {
      if (currentText.trim()) {
        hasStructuredContent = true;
        if (currentTimestamp) {
          markdown += `**${currentTimestamp}**\n\n`;
        }
        markdown += `${currentText.trim()}\n\n`;
      }
      currentTimestamp = line.trim();
      currentText = '';
    } else {
      currentText += (currentText ? ' ' : '') + line.trim();
    }
  }

  // Add last segment
  if (currentText.trim()) {
    hasStructuredContent = true;
    if (currentTimestamp) {
      markdown += `**${currentTimestamp}**\n\n`;
    }
    markdown += `${currentText.trim()}\n\n`;
  }

  // Fallback for unstructured text
  if (!hasStructuredContent && lines.length > 0) {
    markdown += text;
  }

  return markdown;
}
