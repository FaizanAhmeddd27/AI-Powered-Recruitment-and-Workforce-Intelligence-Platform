import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface GlobalLoaderProps {
  isLoading: boolean;
}

export default function GlobalLoader({ isLoading }: GlobalLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [showLoader, setShowLoader] = useState(isLoading);

  useEffect(() => {
    if (isLoading) {
      setShowLoader(true);
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 200);
      return () => clearInterval(interval);
    } else {
      setProgress(100);
      const timeout = setTimeout(() => setShowLoader(false), 600);
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  return (
    <AnimatePresence>
      {showLoader && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
        >
          {/* Animated background particles */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 30 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-primary/10"
                style={{
                  width: Math.random() * 6 + 2,
                  height: Math.random() * 6 + 2,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -100, 0],
                  opacity: [0, 0.6, 0],
                  scale: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          {/* Logo + spinner */}
          <motion.div
            className="relative z-10 flex flex-col items-center gap-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            {/* Animated logo */}
            <div className="relative">
              {/* Outer ring */}
              <motion.div
                className="absolute -inset-4 rounded-full border-2 border-primary/20"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              />

              {/* Middle ring */}
              <motion.div
                className="absolute -inset-2 rounded-full border border-primary/30"
                animate={{ rotate: -360 }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              />

              {/* Logo center */}
              <motion.div
                className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-xl sm:h-24 sm:w-24"
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(var(--primary), 0.2)",
                    "0 0 40px rgba(var(--primary), 0.4)",
                    "0 0 20px rgba(var(--primary), 0.2)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="text-3xl font-bold text-primary-foreground sm:text-4xl">
                  AI
                </span>
              </motion.div>

              {/* Orbiting dots */}
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute h-2 w-2 rounded-full bg-primary"
                  style={{
                    top: "50%",
                    left: "50%",
                  }}
                  animate={{
                    x: [0, Math.cos((i * 120 * Math.PI) / 180) * 50],
                    y: [0, Math.sin((i * 120 * Math.PI) / 180) * 50],
                    opacity: [0.3, 1, 0.3],
                    scale: [0.5, 1.2, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>

            {/* Brand name */}
            <motion.div className="text-center">
              <motion.h1
                className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                RecruitAI
              </motion.h1>
              <motion.p
                className="mt-1 text-xs tracking-widest uppercase text-muted-foreground sm:text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Intelligent Hiring Platform
              </motion.p>
            </motion.div>

            {/* Progress bar */}
            <motion.div
              className="w-48 sm:w-64"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary via-primary/80 to-primary"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
              <motion.p
                className="mt-3 text-center text-xs text-muted-foreground"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Loading resources...
              </motion.p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}