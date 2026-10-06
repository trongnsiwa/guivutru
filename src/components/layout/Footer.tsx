import React from 'react';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = React.memo(function Footer() {
  return (
    <footer
      style={{ contain: 'layout paint' }}
      className="mt-auto w-full py-8 border-t border-border-soft/40 text-center text-xs text-text-muted [contain:layout_paint]"
    >
      <div className="mx-auto max-w-[430px] px-4 space-y-3">
        <div className="flex items-center justify-center gap-1.5 leading-[1.3]">
          <span className="font-display font-normal text-[22px] text-text-secondary tracking-normal">
            Viết điều mình muốn. Niêm phong. Để vũ trụ lo.
          </span>
          <span className="text-star-glow text-sm inline select-none">✨</span>
        </div>

        <div className="flex items-center justify-center gap-4 text-xs font-sans text-text-secondary">
          <Link to="/" className="text-text-secondary hover:text-text-primary transition-colors">
            Trang chủ
          </Link>
          <span aria-hidden="true">•</span>
          <Link to="/viet" className="text-text-secondary hover:text-text-primary transition-colors">
            Viết điều ước
          </Link>
          <span aria-hidden="true">•</span>
          <Link to="/toi" className="text-text-secondary hover:text-text-primary transition-colors">
            Góc của tôi
          </Link>
          <span aria-hidden="true">•</span>
          <Link to="/gioi-thieu" className="text-text-secondary hover:text-text-primary transition-colors">
            Giới thiệu
          </Link>
        </div>

        <p className="flex items-center justify-center gap-1 pt-1">
          <span className="text-text-secondary">Dành tặng bạn và những ước mơ bay xa</span>
          <Heart className="h-3 w-3 text-pink fill-pink/30 inline" />
        </p>
      </div>
    </footer>
  );
});

export default Footer;
