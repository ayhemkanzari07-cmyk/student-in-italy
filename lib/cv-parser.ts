import { PDFParse } from "pdf-parse";
import WordExtractor from "word-extractor";

const MAX_CV_TEXT_LENGTH = 30000;

function cleanText(text: string) {
  return text
    .replace(/\u0000/g, "")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_CV_TEXT_LENGTH);
}

export async function extractCvText(
  buffer: Buffer,
  fileName: string
): Promise<string> {
  const extension = fileName
    .toLowerCase()
    .split(".")
    .pop();

  if (!extension) {
    throw new Error("CV file extension is missing.");
  }

  // PDF
  if (extension === "pdf") {
    const parser = new PDFParse({
      data: buffer,
    });

    try {
      const result = await parser.getText();

      const text = cleanText(result.text || "");

      if (!text) {
        throw new Error(
          "No readable text was found in this PDF. If the CV is a scanned image, OCR is required."
        );
      }

      return text;
    } finally {
      await parser.destroy();
    }
  }

  // DOC / DOCX
  if (extension === "doc" || extension === "docx") {
    const extractor = new WordExtractor();

    const document = await extractor.extract(buffer);

    const body = document.getBody() || "";
    const headers = document.getHeaders() || "";
    const footers = document.getFooters() || "";
    const textboxes = document.getTextboxes() || "";

    const text = cleanText(
      [
        headers,
        body,
        textboxes,
        footers,
      ]
        .filter(Boolean)
        .join("\n")
    );

    if (!text) {
      throw new Error("No readable text was found in this Word document.");
    }

    return text;
  }

  throw new Error(
    "Unsupported CV format. Please upload PDF, DOC, or DOCX."
  );
}