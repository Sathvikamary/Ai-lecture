import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';

// Configure the worker from the CDN that matches the installed version,
// so we never have to ship a separate worker file.
const PDFJS_VERSION = pdfjsLib.version;
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

/** Strip any file-type meta language so the AI never sees "This is a PDF". */
function cleanExtractedText(raw: string): string {
  return raw
    .split(String.fromCharCode(0)).join(' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '')
    .trim();
}

async function extractPdf(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items
      .map((item) => ('str' in item ? (item as { str: string }).str : ''))
      .filter(Boolean);
    pages.push(strings.join(' '));
  }
  return pages.join('\n\n');
}

async function extractDocx(file: File): Promise<string> {
  // A .docx is a ZIP; the main document body lives in word/document.xml.
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const docXml = zip.file('word/document.xml');
  if (!docXml) return '';
  const xml = await docXml.async('string');
  // Convert paragraph breaks, then strip all remaining tags.
  return xml
    .replace(/<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function extractPptx(file: File): Promise<string> {
  // A .pptx is a ZIP; each slide is ppt/slides/slide{n}.xml.
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)/)?.[1] ?? '0', 10);
      const nb = parseInt(b.match(/slide(\d+)/)?.[1] ?? '0', 10);
      return na - nb;
    });
  const slides: string[] = [];
  for (const name of slideFiles) {
    const xml = await zip.files[name].async('string');
    const text = xml
      .replace(/<\/a:p>/g, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/[ \t]+/g, ' ')
      .trim();
    slides.push(text);
  }
  return slides.join('\n\n---\n\n');
}

function extractTextFile(file: File): Promise<string> {
  return file.text();
}

/**
 * Extract the full text content of an uploaded document.
 * Supports PDF, DOCX, PPTX, TXT, and MD. Returns ONLY the document's
 * own text — no file-type metadata is ever injected.
 */
export async function extractFileText(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  let raw = '';
  try {
    if (ext === 'pdf') {
      raw = await extractPdf(file);
    } else if (ext === 'docx') {
      raw = await extractDocx(file);
    } else if (ext === 'pptx') {
      raw = await extractPptx(file);
    } else if (ext === 'txt' || ext === 'md') {
      raw = await extractTextFile(file);
    } else if (ext === 'doc') {
      // Legacy .doc binary format can't be parsed in-browser; surface a
      // clear error instead of inventing placeholder content.
      throw new Error('Legacy .doc files are not supported. Please convert to .docx and re-upload.');
    } else {
      throw new Error(`Unsupported file type: .${ext}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Could not read file';
    throw new Error(msg);
  }
  const cleaned = cleanExtractedText(raw);
  if (cleaned.length < 20) {
    throw new Error(
      'No readable text could be extracted from this file. If it is a scanned PDF, it may need OCR first.'
    );
  }
  return cleaned;
}

export const EXTRACTABLE_TYPES = ['pdf', 'docx', 'pptx', 'txt', 'md'];
