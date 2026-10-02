import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center py-12 space-y-5">
      <span className="text-6xl animate-pulse">🪐</span>
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-normal text-text-primary">
          Lạc vào hố đen rồi 🪐
        </h1>
        <p className="font-sans text-sm text-text-secondary max-w-xs mx-auto">
          Trang bạn tìm không tồn tại hoặc đã bay vào một dải ngân hà khác rồi á.
        </p>
      </div>

      <Link to="/">
        <Button variant="pill" className="flex items-center gap-2">
          <Home className="h-4 w-4" />
          <span>Về lại với Trái Đất ✨</span>
        </Button>
      </Link>
    </div>
  );
}

export default NotFound;
