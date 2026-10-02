import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Download, Home, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { firePastelConfetti } from '@/components/fx/Confetti';

export function Sealed() {
  useEffect(() => {
    firePastelConfetti();
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center py-6 space-y-6">
      <div className="space-y-4">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-bg-soft border border-border-strong text-4xl shadow-glow">
          ⭐
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-3xl font-normal text-text-primary">
            Điều ước đã bay lên trời 🔒
          </h1>
          <p className="font-sans text-sm text-text-secondary max-w-xs mx-auto">
            Vũ trụ đã nhận được thông điệp của bạn. Hãy kiên nhẫn và mỉm cười đón chờ nhé!
          </p>
        </div>
      </div>

      <div className="w-full max-w-xs space-y-3 pt-4">
        <Button
          variant="pill"
          onClick={() => firePastelConfetti()}
          className="w-full flex items-center justify-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          <span>Thả sao may mắn ✨</span>
        </Button>

        <Button
          variant="ghost"
          className="w-full flex items-center justify-center gap-2"
          onClick={() => alert('Tính năng tải ảnh card sẽ ra mắt ở Phase 3 nha 🌸')}
        >
          <Download className="h-4 w-4" />
          <span>Tải share card</span>
        </Button>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <Link to="/" className="w-full">
            <Button variant="ghost" className="w-full text-xs flex items-center justify-center gap-1">
              <Home className="h-3.5 w-3.5" />
              <span>Về nhà</span>
            </Button>
          </Link>
          <Link to="/viet" className="w-full">
            <Button variant="ghost" className="w-full text-xs flex items-center justify-center gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Viết thêm</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Sealed;
