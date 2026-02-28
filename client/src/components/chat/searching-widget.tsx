import { motion } from "framer-motion";

export function SearchingWidget() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: -12 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="flex flex-col items-center gap-5 px-10 py-7 rounded-2xl border border-border/60 bg-background/85 backdrop-blur-md shadow-xl"
      data-testid="searching-widget"
    >
      {/* VibeQuant text fill animation */}
      <div className="relative select-none" style={{ lineHeight: 1 }}>

        {/* Ghost outline layer */}
        <span
          className="block text-5xl font-black"
          style={{
            color: "transparent",
            WebkitTextStroke: "1px hsl(var(--primary) / 0.2)",
            letterSpacing: "0.10em",
          }}
        >
          VibeQuant
        </span>

        {/* Animated fill layer — fills from bottom to top, drains back down */}
        <motion.span
          className="absolute inset-0 block text-5xl font-black"
          style={{
            color: "hsl(var(--primary))",
            letterSpacing: "0.10em",
          }}
          animate={{
            clipPath: [
              "inset(100% 0 0% 0)",  // empty — surface at bottom
              "inset(0%   0 0% 0)",  // full  — surface at top
              "inset(0%   0 0% 0)",  // hold
              "inset(100% 0 0% 0)",  // drain — surface back to bottom
            ],
          }}
          transition={{
            duration: 2.6,
            times: [0, 0.38, 0.64, 1],
            repeat: Infinity,
            ease: [0.45, 0, 0.55, 1],
          }}
        >
          VibeQuant
        </motion.span>
      </div>

      {/* Subtle pulsing status line */}
      <motion.p
        className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground"
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        data-testid="text-searching-subtitle"
      >
        Analyzing markets
      </motion.p>

      {/* Thin progress bar */}
      <div className="relative w-32 h-px bg-border overflow-hidden rounded-full">
        <motion.div
          className="absolute inset-y-0 left-0 bg-primary/60 rounded-full"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          style={{ width: "50%" }}
        />
      </div>
    </motion.div>
  );
}
