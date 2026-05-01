import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Gift, Trophy, Sparkles } from "lucide-react";

interface Slide {
  id: number;
  icon: React.ReactNode;
  gradient: string;
  title: string;
  body: string;
  route: string;
}

const slides: Slide[] = [
  {
    id: 1,
    icon: <Gift className="w-6 h-6 text-white" />,
    gradient: "from-orange-400 to-orange-500",
    title: "Refer friends. Earn $3 each.",
    body: "Share your code. Get Mobile11 Money credit when they buy.",
    route: "/refer",
  },
  {
    id: 2,
    icon: <Trophy className="w-6 h-6 text-white" />,
    gradient: "from-amber-400 to-orange-500",
    title: "Climb your loyalty tier",
    body: "Earn up to 15% cashback on every eSIM.",
    route: "/app/profile",
  },
  {
    id: 3,
    icon: <Sparkles className="w-6 h-6 text-white" />,
    gradient: "from-rose-400 to-orange-500",
    title: "Top destinations this week",
    body: "Japan, Korea, Europe — from $4.",
    route: "/packages",
  },
];

export function PromoCarousel() {
  const [current, setCurrent] = useState(0);
  const [touching, setTouching] = useState(false);
  const touchStartX = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useNavigate();

  // Auto-rotate every 5 seconds (pauses while touching)
  const startAutoRotate = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (!touching) {
        setCurrent((prev) => (prev + 1) % slides.length);
      }
    }, 5000);
  }, [touching]);

  useEffect(() => {
    startAutoRotate();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startAutoRotate]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouching(true);
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setTouching(false);
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 50) {
      if (diff < 0) {
        // Swipe left → next
        setCurrent((prev) => (prev + 1) % slides.length);
      } else {
        // Swipe right → prev
        setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
      }
    }
    startAutoRotate();
  };

  return (
    <div className="relative">
      {/* Slide container */}
      <div
        className="overflow-hidden rounded-3xl"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {slides.map((slide) => (
            <button
              key={slide.id}
              onClick={() => navigate(slide.route)}
              className={`w-full flex-shrink-0 h-[128px] bg-gradient-to-r ${slide.gradient} rounded-3xl p-5 flex items-center gap-4 text-left`}
            >
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                {slide.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[16px] font-semibold text-white leading-tight">
                  {slide.title}
                </p>
                <p className="text-[13px] text-white/80 mt-1 leading-snug">
                  {slide.body}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 mt-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === current
                ? "bg-[#F97316] w-4"
                : "bg-[#D4D4D4]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
