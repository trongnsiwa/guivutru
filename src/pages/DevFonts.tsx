import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function DevFonts() {
  const testPhrase = 'Điều ước của tớ ở Đà Lạt 🌸 — ĐẶC BIỆT Ở CHỖ ĐÓ';
  const diacriticsFocus = 'ố ộ ỗ ữ ụ ử ở đ ằ ậ ĩ ữ ă â ê ô';
  const diacriticsAll = 'à á ả ã ạ ă ằ ắ ẳ ẵ ặ â ầ ấ ẩ ẫ ậ è é ẻ ẽ ẹ ê ề ế ể ễ ệ ì í ỉ ĩ ị ò ó ỏ õ ọ ô ồ ố ổ ỗ ộ ơ ờ ớ ở ỡ ợ ù ú ủ ũ ụ ư ừ ứ ử ữ ự ỳ ý ỷ ỹ ỵ đ';

  const sampleRef = useRef<HTMLParagraphElement>(null);
  const kalamRef = useRef<HTMLParagraphElement>(null);
  const [computedFont, setComputedFont] = useState<string>('Detecting...');
  const [computedKalamFont, setComputedKalamFont] = useState<string>('Detecting...');

  useEffect(() => {
    const update = () => {
      if (sampleRef.current) {
        setComputedFont(window.getComputedStyle(sampleRef.current).fontFamily);
      }
      if (kalamRef.current) {
        setComputedKalamFont(window.getComputedStyle(kalamRef.current).fontFamily);
      }
    };
    update();
    document.fonts.ready.then(update);
  }, []);

  return (
    <div className="flex flex-1 flex-col py-4 space-y-6">
      <div className="flex items-center justify-between border-b border-border-soft pb-3">
        <Link
          to="/"
          className="flex items-center gap-1.5 text-xs font-sans text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Về trang chủ</span>
        </Link>
        <span className="rounded bg-mint/10 border border-mint/30 px-2 py-0.5 font-mono text-[10px] text-mint flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          <span>INGRID DARLING + NUNITO + SRIRACHA + KALAM</span>
        </span>
      </div>

      <div className="space-y-2">
        <h1 className="font-display font-normal text-4xl text-text-primary">
          Kiểm tra hiển thị Font Tiếng Việt & Dấu
        </h1>
        <p className="font-sans font-normal text-xs text-text-secondary leading-[1.6]">
          Xác nhận các dấu phụ tiếng Việt (đặc biệt: <strong>{diacriticsFocus}</strong>) không bị misalign và không bị fallback sang font hệ thống.
        </p>
      </div>

      {/* Verification Cards */}
      <div className="w-full rounded-md border border-border-soft bg-bg-soft p-6 space-y-8">
        {/* 1. Ingrid Darling (font-display) */}
        <div className="space-y-4 border-b border-border-soft/60 pb-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs text-lavender font-sans uppercase tracking-wider font-semibold">
              1. font-display — Ingrid Darling (Weight 400 only)
            </span>
            <span className="text-[10px] font-mono text-mint bg-mint/10 px-2 py-0.5 rounded border border-mint/20">
              {computedFont}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-mono text-text-muted block mb-0.5">64px / wght 400 (Hero desktop):</span>
              <p
                ref={sampleRef}
                className="font-display font-normal text-[64px] leading-[1.25] tracking-normal text-text-primary overflow-visible"
              >
                {testPhrase}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-mono text-text-muted block mb-0.5">48px / wght 400 (Hero mobile):</span>
              <p className="font-display font-normal text-[48px] leading-[1.25] tracking-normal text-text-primary overflow-visible">
                {testPhrase}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-mono text-text-muted block mb-0.5">Focus Characters ({diacriticsFocus}):</span>
              <p className="font-display font-normal text-4xl text-star-glow tracking-wider">
                {diacriticsFocus}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-mono text-text-muted block mb-0.5">34px / wght 400 (Section headings):</span>
              <p className="font-display font-normal text-[34px] tracking-normal text-text-primary">
                3 bước gửi điều ước — {testPhrase}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-mono text-text-muted block mb-0.5">26px / wght 400 (TopBar Wordmark "Gửi Vũ Trụ ✨"):</span>
              <p className="font-display font-normal text-[26px] tracking-normal text-text-primary">
                Gửi Vũ Trụ ✨ — {testPhrase}
              </p>
            </div>
          </div>
        </div>

        {/* 2. Sriracha (font-note) */}
        <div className="space-y-4 border-b border-border-soft/60 pb-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-lavender font-sans uppercase tracking-wider font-semibold">
              2. font-note — Sriracha (Weight 400) Note Content & Share Card
            </span>
            <span className="text-[10px] font-mono text-text-muted">Check "ở đó"</span>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-mono text-text-muted block mb-0.5">22px (Standard Note Content):</span>
              <p className="font-note font-normal text-[22px] leading-[1.5] text-text-primary">
                "Mình muốn đến Đà Lạt và ở đó mãi mãi…" 🌸
              </p>
            </div>

            <div>
              <span className="text-[10px] font-mono text-text-muted block mb-0.5">Full Test Phrase (22px):</span>
              <p className="font-note font-normal text-[22px] leading-[1.5] text-text-secondary">
                {testPhrase}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-mono text-text-muted block mb-0.5">Focus Characters in Sriracha:</span>
              <p className="font-note font-normal text-2xl text-star-glow">
                {diacriticsFocus}
              </p>
            </div>
          </div>
        </div>

        {/* 3. Nunito (font-sans) */}
        <div className="space-y-4 border-b border-border-soft/60 pb-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-lavender font-sans uppercase tracking-wider font-semibold">
              3. font-sans — Nunito (Weights 400, 600, 700) Body, Buttons, UI
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-mono text-text-muted block mb-0.5">16px (Body copy, weight 400, leading 1.6):</span>
              <p className="font-sans font-normal text-[16px] leading-[1.6] text-text-primary">
                {testPhrase}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-mono text-text-muted block mb-0.5">14px (Buttons & UI, weight 600):</span>
              <p className="font-sans font-semibold text-[14px] leading-[1.6] text-text-primary">
                {testPhrase} — Viết điều ước ✨
              </p>
            </div>

            <div>
              <span className="text-[10px] font-mono text-text-muted block mb-0.5">All Vietnamese Diacritics (Nunito 400):</span>
              <p className="font-sans font-normal text-xs leading-[1.8] text-text-secondary">
                {diacriticsAll}
              </p>
            </div>
          </div>
        </div>

        {/* 4. Kalam (font-hand) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs text-lavender font-sans uppercase tracking-wider font-semibold">
              4. font-hand — Kalam (Accent, Signature, Footer)
            </span>
            <span className="text-[10px] font-mono text-mint bg-mint/10 px-2 py-0.5 rounded border border-mint/20">
              {computedKalamFont}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-mono text-text-muted block mb-0.5">Footer Line (16px, natural slant, not-italic):</span>
              <p ref={kalamRef} className="font-hand font-normal not-italic text-xl leading-[1.6] text-lavender">
                Viết điều mình muốn. Niêm phong. Để vũ trụ lo. ✨
              </p>
            </div>

            <div>
              <span className="text-[10px] font-mono text-text-muted block mb-0.5">Focus Characters in Kalam (ế ề ệ ộ ụ ữ ở):</span>
              <p className="font-hand font-normal not-italic text-2xl text-star-glow">
                ế ề ệ ộ ụ ữ ở
              </p>
            </div>

            <div>
              <span className="text-[10px] font-mono text-text-muted block mb-0.5">Full Test Phrase in Kalam:</span>
              <p className="font-hand font-normal not-italic text-base text-text-primary">
                {testPhrase}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <Link to="/">
          <Button variant="ghost" className="w-full text-xs">
            Quay lại trang chủ
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default DevFonts;
