import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { Vortex } from "@/components/ui/vortex";
import { useTheme } from "@/context/ThemeContext";
import { ArrowRight, Play, Sparkles } from "lucide-react";

export default function HeroSection() {
  const { theme } = useTheme();

  return (
    <section className="relative overflow-hidden">
      {/* Background - white for light mode, black for dark mode */}
      <div
        className={`absolute inset-0 ${
          theme === "dark"
            ? "bg-black"
            : "bg-white"
        }`}
      />

      {/* Show BackgroundPaths in light mode, Vortex in dark mode */}
      {theme === "light" && <BackgroundPaths className="z-[1]" />}
      
      {theme === "dark" ? (
        <Vortex
          backgroundColor="#000000"
          particleCount={280}
          baseHue={220}
          rangeY={800}
          baseSpeed={0.0}
          rangeSpeed={1.0}
          containerClassName="min-h-[90vh] sm:min-h-screen relative z-10"
          className="flex min-h-[90vh] items-center justify-center px-4 sm:min-h-screen sm:px-6"
        >
          <div className="mx-auto max-w-5xl text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-950/30 text-orange-100 backdrop-blur-md px-4 py-1.5 text-xs font-medium sm:text-sm"
            >
              <Sparkles className="h-3.5 w-3.5 text-orange-400" />
              Powered by Llama 3.1 70B AI
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-4xl font-black leading-tight tracking-tight text-white drop-shadow-lg sm:text-5xl md:text-6xl lg:text-7xl"
            >
              Hire Smarter with
              <br />
              <span className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
                AI Intelligence
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-slate-300 drop-shadow sm:text-base md:text-lg"
            >
              AI-powered resume parsing, skill matching, and candidate ranking.
              Stop manual screening — let AI find your perfect match in seconds.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
            >
              <Button
                size="lg"
                asChild
                className="h-12 gap-2 rounded-xl px-8 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 sm:h-14 sm:px-10 sm:text-base bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Link to="/signup">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-12 gap-2 rounded-xl px-8 text-sm transition-all duration-300 sm:h-14 sm:px-10 sm:text-base border-slate-600 bg-slate-800/50 text-white hover:bg-slate-700"
              >
                <Link to="/jobs">
                  <Play className="h-4 w-4" />
                  Browse Jobs
                </Link>
              </Button>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="mt-12 grid grid-cols-3 gap-4 sm:gap-8"
            >
              {[
                { value: "10,000+", label: "Jobs Posted" },
                { value: "50,000+", label: "Candidates" },
                { value: "95%", label: "Match Accuracy" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 + i * 0.15, duration: 0.5 }}
                  className="text-center"
                >
                  <p className="text-xl font-bold text-white drop-shadow sm:text-2xl md:text-3xl">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400 drop-shadow sm:text-sm">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </Vortex>
      ) : (
        <div className="min-h-[90vh] sm:min-h-screen relative z-10">
          <div className="flex min-h-[90vh] items-center justify-center px-4 sm:min-h-screen sm:px-6">
            <div className="mx-auto max-w-5xl text-center">
              {/* Badge - adjusted for light mode */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-100/80 text-orange-800 backdrop-blur-md px-4 py-1.5 text-xs font-medium sm:text-sm"
              >
                <Sparkles className="h-3.5 w-3.5 text-orange-600" />
                Powered by Llama 3.1 70B AI
              </motion.div>

              {/* Heading - BLACK text for light mode */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-4xl font-black leading-tight tracking-tight text-gray-900 drop-shadow-sm sm:text-5xl md:text-6xl lg:text-7xl"
              >
                Hire Smarter with
                <br />
                <span className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
                  AI Intelligence
                </span>
              </motion.h1>

              {/* Subtitle - DARK GRAY text for light mode */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-gray-700 drop-shadow-sm sm:text-base md:text-lg"
              >
                AI-powered resume parsing, skill matching, and candidate ranking.
                Stop manual screening — let AI find your perfect match in seconds.
              </motion.p>

              {/* CTA Buttons - adjusted for light mode */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
              >
                <Button
                  size="lg"
                  asChild
                  className="h-12 gap-2 rounded-xl px-8 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 sm:h-14 sm:px-10 sm:text-base bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Link to="/signup">
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="h-12 gap-2 rounded-xl px-8 text-sm transition-all duration-300 sm:h-14 sm:px-10 sm:text-base border-gray-300 bg-white/80 text-gray-700 hover:bg-gray-100"
                >
                  <Link to="/jobs">
                    <Play className="h-4 w-4" />
                    Browse Jobs
                  </Link>
                </Button>
              </motion.div>

              {/* Stats row - adjusted for light mode */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="mt-12 grid grid-cols-3 gap-4 sm:gap-8"
              >
                {[
                  { value: "10,000+", label: "Jobs Posted" },
                  { value: "50,000+", label: "Candidates" },
                  { value: "95%", label: "Match Accuracy" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 + i * 0.15, duration: 0.5 }}
                    className="text-center"
                  >
                    <p className="text-xl font-bold text-gray-900 drop-shadow-sm sm:text-2xl md:text-3xl">
                      {stat.value}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-600 drop-shadow-sm sm:text-sm">
                      {stat.label}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}