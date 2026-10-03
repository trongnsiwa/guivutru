export interface PreRenderedCard {
  dataUrl: string;
  blob: Blob;
}

export interface ShareCardResult {
  success: boolean;
  action: 'shared' | 'downloaded' | 'cancelled';
  dataUrl?: string;
}

export async function preRenderCard(node: HTMLElement): Promise<PreRenderedCard> {
  const { toPng } = await import('html-to-image');

  if (typeof document !== 'undefined' && document.fonts) {
    await document.fonts.ready;
  }

  const dataUrl = await toPng(node, {
    pixelRatio: 1,
    cacheBust: true,
    width: 1080,
    height: 1920,
    style: {
      position: 'static',
      left: '0',
      top: '0',
      margin: '0',
      transform: 'none',
    },
  });

  const res = await fetch(dataUrl);
  const blob = await res.blob();

  return { dataUrl, blob };
}

export async function exportAndShareCard(
  node: HTMLElement,
  noteId: string,
  cached?: PreRenderedCard | null
): Promise<ShareCardResult> {
  const fileName = `dieu-uoc-${noteId}.png`;

  let cardData = cached;
  if (!cardData) {
    cardData = await preRenderCard(node);
  }

  const { blob, dataUrl } = cardData;

  // Detect mobile device
  const isMobile =
    typeof navigator !== 'undefined' &&
    (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints > 1 && window.innerWidth <= 1024));

  // On mobile: check navigator.canShare({ files: [file] })
  if (isMobile && typeof navigator !== 'undefined' && navigator.canShare && navigator.share) {
    try {
      const file = new File([blob], fileName, { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Điều ước gửi vũ trụ ✨',
          text: 'Điều ước của mình đã được gửi lên vũ trụ ✨',
        });
        return { success: true, action: 'shared', dataUrl };
      }
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') {
        return { success: true, action: 'cancelled', dataUrl };
      }
      // Fall through to download if share failed
    }
  }

  // On desktop or fallback: trigger direct browser download
  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  link.click();

  return { success: true, action: 'downloaded', dataUrl };
}

export default exportAndShareCard;
