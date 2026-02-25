import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function SearchingWidget() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-5xl mx-auto"
      data-testid="searching-widget"
    >
      <div className="flex flex-col items-center justify-center py-20 space-y-6">
        {/* Animated Icon */}
        <motion.div
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            rotate: {
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            },
            scale: {
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
          className="relative"
        >
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl" />
          <div className="relative bg-gradient-to-br from-primary/10 to-cyan-500/10 p-6 rounded-full border border-primary/20">
            <Sparkles className="w-12 h-12 text-primary" />
          </div>
        </motion.div>

        {/* Text Content */}
        <div className="text-center space-y-2">
          <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-semibold text-foreground"
            data-testid="text-searching-title"
          >
            Search in progress...
          </motion.h3>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground max-w-md"
            data-testid="text-searching-subtitle"
          >
            Analyzing and retrieving the best information
          </motion.p>
        </div>

        {/* Animated Dots */}
        <motion.div
          className="flex gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -10, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
              className="w-2 h-2 bg-primary rounded-full"
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
