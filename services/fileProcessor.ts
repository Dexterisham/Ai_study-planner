import type * as PdfJs from 'pdfjs-dist';

// These are loaded from CDN, so we declare them to satisfy TypeScript
declare const JSZip: any;
declare const pdfjsLib: typeof PdfJs;

// Add type definition for JSZipObject to fix type errors
interface JSZipObject {
    name: string;
    dir: boolean;
    async(type: 'arraybuffer'): Promise<ArrayBuffer>;
}

const getPdfjs = async (): Promise<typeof PdfJs> => {
  // @ts-ignore
  const lib = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.min.mjs');
  lib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.worker.min.mjs`;
  return lib;
};

async function processPdf(pdfData: ArrayBuffer, pdfjs: typeof PdfJs): Promise<string[]> {
  const images: string[] = [];
  const pdf = await pdfjs.getDocument({ data: pdfData }).promise;

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    // Using a scale of 2.0 for better resolution, which helps AI vision models.
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
        console.warn(`Could not get canvas context for page ${i}`);
        continue;
    }

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };
    
    try {
        // Using a type assertion to work around a potential mismatch between the CDN-loaded
        // pdf.js library and the installed type definitions. The runtime API
        // expects an object with canvasContext and viewport, which we are providing.
        await page.render(renderContext as any).promise;
        // Get image data URL and extract base64 part.
        images.push(canvas.toDataURL('image/png').split(',')[1]);
    } catch (renderError) {
        console.error(`Error rendering page ${i}:`, renderError);
    } finally {
        // Ensure page data is cleaned up to free memory.
        page.cleanup();
    }
  }
  return images;
}


export async function processZipFile(zipFile: File, updateProgress: (message: string) => void): Promise<string[]> {
  updateProgress('Initializing PDF processor...');
  const pdfjs = await getPdfjs();
  updateProgress('Unzipping file...');
  const jszip = new JSZip();
  const zip = await jszip.loadAsync(zipFile);
  
  const pdfFiles: JSZipObject[] = (Object.values(zip.files) as JSZipObject[]).filter((file) => !file.dir && file.name.toLowerCase().endsWith('.pdf'));
  
  if (pdfFiles.length === 0) {
      throw new Error("No PDF files found in the uploaded ZIP.");
  }

  let allImages: string[] = [];
  
  for (let i = 0; i < pdfFiles.length; i++) {
    const file = pdfFiles[i];
    updateProgress(`Processing PDF ${i + 1}/${pdfFiles.length}: ${file.name}`);
    const pdfData = await file.async('arraybuffer');
    const imagesFromPdf = await processPdf(pdfData, pdfjs);
    allImages = [...allImages, ...imagesFromPdf];
  }
  
  return allImages;
}