const { Document, Paragraph, TextRun, AlignmentType, Packer } = require('docx');
const { jsPDF } = require('jspdf');

const TIMESTAMP_REGEX = /^\d{2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{3}/;

/**
 * Generate Word document buffer from transcription text
 */
async function generateWordDocument(text, options = {}) {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text parameter: expected non-empty string');
  }

  const { title = 'Transcription', fileName = 'transcription' } = options;

  const lines = text.split('\n').filter((line) => line.trim());
  const paragraphs = [];

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
    } else if (line.trim()) {
      currentText += (currentText ? ' ' : '') + line.trim();
    }
  }

  // Add any remaining text
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
            size: 22,
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  // If no structured content was found, add as plain text
  if (!hasStructuredContent) {
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
async function generatePdfDocument(text, options = {}) {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text parameter: expected non-empty string');
  }

  const { title = 'Transcription', fileName = 'transcription' } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  const lineHeight = 7;
  let y = margin;

  // Add title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Add metadata
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text(`File: ${fileName}`, margin, y);
  y += 6;
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
  y += 15;

  // Add content
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  const lines = text.split('\n').filter((line) => line.trim());
  let currentTimestamp = '';
  let currentText = '';
  let hasContentAdded = false;

  const addTextBlock = (timestamp, content) => {
    if (!content.trim()) return;

    hasContentAdded = true;

    if (y > pageHeight - margin - 20) {
      doc.addPage();
      y = margin;
    }

    if (timestamp) {
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(timestamp, margin, y);
      y += 5;
    }

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    const wrappedText = doc.splitTextToSize(content.trim(), maxWidth);

    for (const line of wrappedText) {
      if (y > pageHeight - margin - 10) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += lineHeight;
    }

    y += 3;
  };

  for (const line of lines) {
    if (line.startsWith('WEBVTT')) continue;

    const timestampMatch = line.match(TIMESTAMP_REGEX);

    if (timestampMatch) {
      if (currentText.trim()) {
        addTextBlock(currentTimestamp, currentText);
      }
      currentTimestamp = line.trim();
      currentText = '';
    } else if (line.trim()) {
      currentText += (currentText ? ' ' : '') + line.trim();
    }
  }

  if (currentText.trim()) {
    addTextBlock(currentTimestamp, currentText);
  }

  // If no structured content was found, add plain text fallback
  if (!hasContentAdded) {
    const wrappedText = doc.splitTextToSize(text, maxWidth);
    for (const line of wrappedText) {
      if (y > pageHeight - margin - 10) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += lineHeight;
    }
  }

  return Buffer.from(doc.output('arraybuffer'));
}

function escapeMarkdown(text) {
  return text.replace(/([\\`*_{}[\]()#+.!|-])/g, '\\$1');
}

/**
 * Generate Markdown document from transcription text
 */
async function generateMarkdownDocument(text, options = {}) {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text parameter: expected non-empty string');
  }

  const { title = 'Transcription', fileName = 'transcription' } = options;

  let markdown = `# ${escapeMarkdown(title)}\n\n`;
  markdown += `**File:** ${escapeMarkdown(fileName)}  \n`;
  markdown += `**Generated:** ${new Date().toLocaleString()}\n\n`;
  markdown += `---\n\n`;

  const lines = text.split('\n').filter((line) => line.trim());
  let currentTimestamp = '';
  let currentText = '';
  let hasContentAdded = false;

  const addMarkdownBlock = (timestamp, content) => {
    if (!content.trim()) return;

    hasContentAdded = true;
    if (timestamp) {
      markdown += `**${escapeMarkdown(timestamp)}**\n\n`;
    }
    markdown += `${escapeMarkdown(content.trim())}\n\n`;
  };

  for (const line of lines) {
    if (line.startsWith('WEBVTT')) continue;

    const timestampMatch = line.match(TIMESTAMP_REGEX);

    if (timestampMatch) {
      if (currentText.trim()) {
        addMarkdownBlock(currentTimestamp, currentText);
      }
      currentTimestamp = line.trim();
      currentText = '';
    } else if (line.trim()) {
      currentText += (currentText ? ' ' : '') + line.trim();
    }
  }

  if (currentText.trim()) {
    addMarkdownBlock(currentTimestamp, currentText);
  }

  // If no structured content was found, add plain text fallback
  if (!hasContentAdded) {
    markdown += escapeMarkdown(text);
  }

  return markdown;
}

module.exports = {
  generateWordDocument,
  generatePdfDocument,
  generateMarkdownDocument,
};
