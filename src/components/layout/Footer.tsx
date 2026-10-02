import { Sparkles, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="mt-auto w-full py-8 border-t border-border-soft/40 text-center text-xs text-text-muted">
      <div className="mx-auto max-w-[430px] px-4 space-y-3">
        <p className="flex items-center justify-center gap-1.5 font-hand font-normal not-italic text-base text-lavender/90">
          <span>Viết điều mình muốn. Niêm phong. Để vũ trụ lo.</span>
          <Sparkles className="h-3.5 w-3.5 text-star-glow inline" />
        </p>

        <div className="flex items-center justify-center gap-4 text-xs font-sans">
          <Link to="/" className="hover:text-text-secondary transition-colors">
            Trang chủ
          </Link>
          <span>•</span>
          <Link to="/viet" className="hover:text-text-secondary transition-colors">
            Viết điều ước
          </Link>
          <span>•</span>
          <Link to="/toi" className="hover:text-text-secondary transition-colors">
            Góc của tôi
          </Link>
          <span>•</span>
          <Link to="/gioi-thieu" className="hover:text-text-secondary transition-colors">
            Giới thiệu
          </Link>
        </div>

        <p className="flex items-center justify-center gap-1 pt-1 opacity-70">
          <span>Dành tặng bạn và những ước mơ bay xa</span>
          <Heart className="h-3 w-3 text-pink fill-pink/30 inline" />
        </p>
      </div>
    </footer>
  );
}

export default Footer;
