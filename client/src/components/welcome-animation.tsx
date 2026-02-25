import { useEffect, useState } from "react";
import { Sparkles, Zap, TrendingUp, BarChart3 } from "lucide-react";

interface WelcomeAnimationProps {
  onComplete: () => void;
}

export function WelcomeAnimation({ onComplete }: WelcomeAnimationProps) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Stage 0: Initial fade in
    const timer1 = setTimeout(() => setStage(1), 500);

    // Stage 1: Show text with explosion effect - Display for a long time
    const timer2 = setTimeout(() => setStage(2), 2000);

    // Stage 2: Fade out - Keep visible for 20 seconds total
    const timer3 = setTimeout(() => setStage(3), 18000);

    // Complete animation - 20 seconds total
    const timer4 = setTimeout(() => onComplete(), 20000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete]);

  if (stage === 3) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-background transition-opacity duration-700 ${
        stage === 2 ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-primary/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Radial gradient background */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-transparent to-transparent animate-pulse-slow" />

      {/* Main content container */}
      <div className="relative z-10 text-center">
        {/* Orbiting icons */}
        <div className="absolute inset-0 w-96 h-96 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2">
          <div
            className={`absolute inset-0 transition-all duration-1000 ${
              stage >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            }`}
          >
            <Sparkles
              className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 text-yellow-500 animate-bounce"
              style={{ animationDelay: '0s' }}
            />
            <Zap
              className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 text-blue-500 animate-bounce"
              style={{ animationDelay: '0.2s' }}
            />
            <TrendingUp
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-8 text-green-500 animate-bounce"
              style={{ animationDelay: '0.4s' }}
            />
            <BarChart3
              className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 text-purple-500 animate-bounce"
              style={{ animationDelay: '0.6s' }}
            />
          </div>
        </div>

        {/* Central logo with explosion effect */}
        <div
          className={`mb-8 transition-all duration-1000 ${
            stage >= 1
              ? 'opacity-100 scale-100 rotate-0'
              : 'opacity-0 scale-0 rotate-180'
          }`}
        >
          <div className="relative inline-block">
            {/* Glow rings */}
            <div className="absolute inset-0 -m-8">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <div
                className="absolute inset-0 rounded-full bg-primary/30 animate-ping"
                style={{ animationDelay: '0.5s' }}
              />
            </div>

            {/* Logo */}
            <div className="relative p-8 rounded-full bg-gradient-to-br from-primary/30 via-blue-500/30 to-purple-500/30 backdrop-blur-xl border-4 border-primary/50 shadow-2xl shadow-primary/50">
              <Sparkles className="w-24 h-24 text-primary drop-shadow-[0_0_30px_rgba(59,130,246,0.8)] animate-pulse-glow" />
            </div>
          </div>
        </div>

        {/* Welcome text with staggered animation */}
        <div
          className={`space-y-4 transition-all duration-1000 delay-300 ${
            stage >= 1
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-10'
          }`}
        >
          <h1 className="text-6xl md:text-8xl font-black tracking-tight">
            <span className="inline-block bg-gradient-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
              Bienvenue
            </span>
          </h1>

          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-20 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
            <p className="text-2xl md:text-4xl font-bold text-muted-foreground">
              Sur
            </p>
            <div className="h-px w-20 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
          </div>

          <h2 className="text-5xl md:text-7xl font-black">
            <span className="inline-block bg-gradient-to-r from-yellow-500 via-pink-500 to-purple-500 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
              VibeQuant
            </span>
          </h2>

          <div
            className={`mt-6 transition-all duration-700 delay-700 ${
              stage >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
            }`}
          >
            <p className="text-lg md:text-xl text-muted-foreground font-medium">
              Intelligence Financière Propulsée par l'IA
            </p>
          </div>
        </div>

        {/* Animated dots */}
        <div
          className={`mt-12 flex justify-center gap-2 transition-all duration-500 delay-1000 ${
            stage >= 1 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>

      {/* Bottom shine effect */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
    </div>
  );
}
