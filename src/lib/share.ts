import { toPng } from 'html-to-image';

export interface ExportCardOptions {
  fileName?: string;
  pixelRatio?: number;
}

export async function exportCardAsPng(
  node: HTMLElement,
  options: ExportCardOptions = {}
): Promise<string> {
  const { fileName = 'gui-vu-tru-dieu-uoc.png', pixelRatio = 2 } = options;

  try {
    const dataUrl = await toPng(node, {
      pixelRatio,
      cacheBust: true,
    });

    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    link.click();

    return dataUrl;
  } catch (error) {
    console.error('Failed to export share card:', error);
    throw error;
  }
}
