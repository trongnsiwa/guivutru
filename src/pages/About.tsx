import { Sparkles, ShieldCheck, Heart, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export function About() {
  return (
    <div className="flex flex-1 flex-col py-2 space-y-6">
      <div className="text-center space-y-2 pt-2">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-soft border border-border-soft text-star-glow shadow-glow">
          <Moon className="h-7 w-7 text-lavender" />
        </div>
        <h1 className="font-display text-3xl font-normal text-text-primary">
          Về Gửi Vũ Trụ ✨
        </h1>
        <p className="font-display font-normal text-[22px] sm:text-[24px] text-lavender leading-[1.3]">
          "Viết điều mình muốn. Niêm phong. Để vũ trụ lo."
        </p>
      </div>

      <div className="space-y-4 font-sans text-sm text-text-secondary leading-relaxed">
        <div className="rounded-md border border-border-soft bg-bg-soft/70 p-4 space-y-2">
          <div className="flex items-center gap-2 font-sans font-semibold text-base text-text-primary">
            <Sparkles className="h-4 w-4 text-star-glow" />
            <span>Tụi mình là ai?</span>
          </div>
          <p>
            Gửi Vũ Trụ là một góc nhỏ tĩnh lặng trên internet, nơi bạn có thể gửi gắm những ước mơ, tâm tư, hay những mục tiêu tương lai.
          </p>
        </div>

        <div className="rounded-md border border-border-soft bg-bg-soft/70 p-4 space-y-2">
          <div className="flex items-center gap-2 font-sans font-semibold text-base text-text-primary">
            <ShieldCheck className="h-4 w-4 text-mint" />
            <span>Bảo mật & Riêng tư</span>
          </div>
          <p>
            Ở phiên bản này, tất cả điều ước được lưu trữ hoàn toàn trên thiết bị của riêng bạn (localStorage). Không cần đăng ký, không gửi dữ liệu đi đâu cả.
          </p>
        </div>

        <div className="rounded-md border border-border-soft bg-bg-soft/70 p-4 space-y-2">
          <div className="flex items-center gap-2 font-sans font-semibold text-base text-text-primary">
            <Heart className="h-4 w-4 text-pink" />
            <span>Niềm tin vào tương lai</span>
          </div>
          <p>
            Khi niêm phong một điều ước, bạn học cách buông bỏ nỗi lo và tin tưởng vào hành trình của chính mình.
          </p>
        </div>
      </div>

      <div className="pt-2">
        <Link to="/viet" className="block w-full">
          <Button variant="pill" className="w-full">
            <span>Bắt đầu viết điều ước ✨</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default About;
