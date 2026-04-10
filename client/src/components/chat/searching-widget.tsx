import { motion } from "framer-motion";

export function SearchingWidget() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: -12 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center gap-6 px-14 py-10 rounded-xl glass-strong shadow-lg"
      data-testid="searching-widget"
    >
      {/* AutoScholar text fill animation */}
      <div className="relative select-none" style={{ lineHeight: 1 }}>

        {/* Ghost outline layer */}
        <span
          className="block text-5xl font-black tracking-wider"
          style={{
            color: "transparent",
            WebkitTextStroke: "1px hsl(var(--primary) / 0.15)",
          }}
        >
          AutoScholar
        </span>

        {/* Animated fill layer */}
        <motion.span
          className="absolute inset-0 block text-5xl font-black tracking-wider"
          style={{
            color: "hsl(var(--primary))",
          }}
          animate={{
            clipPath: [
              "inset(100% 0 0% 0)",
              "inset(0%   0 0% 0)",
              "inset(0%   0 0% 0)",
              "inset(100% 0 0% 0)",
            ],
          }}
          transition={{
            duration: 2.6,
            times: [0, 0.38, 0.64, 1],
            repeat: Infinity,
            ease: [0.45, 0, 0.55, 1],
          }}
        >
          AutoScholar
        </motion.span>
      </div>

      {/* Subtle pulsing status line */}
      <motion.p
        className="text-[10px] font-semibold tracking-[0.35em] uppercase text-muted-foreground"
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        data-testid="text-searching-subtitle"
      >
        Analyzing sources
      </motion.p>

      {/* Progress bar with glow */}
      <div className="relative w-36 h-0.5 bg-border/60 overflow-hidden rounded-full">
        <motion.div
          className="absolute inset-y-0 left-0 bg-primary/50 rounded-full"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          style={{ width: "50%" }}
        />
      </div>
    </motion.div>
  );
}
