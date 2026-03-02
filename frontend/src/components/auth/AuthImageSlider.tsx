import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { Sparkles, Zap, Target, Award, CheckCircle2, Brain, Rocket } from "lucide-react";

const images = [
  { 
    id: 1, 
    src: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=600&fit=crop",
    alt: "Team collaboration" 
  },
  { 
    id: 2, 
    src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop",
    alt: "Professional meeting" 
  },
  { 
    id: 3, 
    src: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=600&fit=crop",
    alt: "Job interview" 
  },
];

export default function AuthImageSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { theme } = useTheme();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative h-full w-full overflow-hidden ${
      theme === "dark" 
        ? "bg-[#1F1F1F]" 
        : "bg-gradient-to-br from-slate-50 via-white to-slate-100"
    }`}>
      <div className="flex h-full flex-col justify-center px-8 py-12 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-lg mx-auto"
        >
          {/* Header */}
          <div className="mb-6">
            <div className={`mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 ${
                theme === "dark" 
                  ? "border-orange-500/20 bg-orange-500/10" 
                  : "border-orange-500/30 bg-orange-500/5"
              }`}
            >
              <Sparkles className="h-4 w-4 text-orange-500" />
              <span className={`text-sm font-medium ${
                theme === "dark" ? "text-orange-400" : "text-orange-600"
              }`}>
                Powered by AI
              </span>
            </div>
            
            <h1 className={`text-4xl font-bold xl:text-5xl ${
              theme === "dark" ? "text-white" : "text-slate-900"
            }`}>
              AI-Powered
              <br />
              <span className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
                Recruitment
              </span>
            </h1>
            
            <p className={`mt-3 text-base ${
              theme === "dark" ? "text-slate-400" : "text-slate-600"
            }`}>
              Smart matching. Faster hiring. Better results.
            </p>
          </div>

          {/* Image Slider - Circular/Oval Shape */}
          <div className="relative mb-8 flex justify-center">
            <div className={`relative overflow-hidden rounded-[2rem] shadow-2xl ${
              theme === "dark" 
                ? "ring-2 ring-slate-800" 
                : "ring-2 ring-slate-200"
            }`}
            style={{ width: '320px', height: '380px' }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, scale: 1.2, rotate: 5 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.9, rotate: -5 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="h-full w-full"
                >
                  <img
                    src={images[currentIndex].src}
                    alt={images[currentIndex].alt}
                    className="h-full w-full object-cover"
                  />
                </motion.div>
              </AnimatePresence>

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

              {/* Dots indicator */}
              <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentIndex
                        ? "w-8 bg-orange-500"
                        : "w-2 bg-white/60 hover:bg-white/80"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Key Benefits */}
          <div className="space-y-3 mb-6">
            {[
              { icon: Brain, text: "AI-powered candidate matching" },
              { icon: Zap, text: "Save 80% of screening time" },
              { icon: Target, text: "95% accuracy in skill matching" },
              { icon: Rocket, text: "Hire faster, hire smarter" },
            ].map((feature, i) => (
              <motion.div
                key={feature.text}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                className={`flex items-center gap-3 rounded-xl p-3 ${
                  theme === "dark" 
                    ? "bg-slate-800/40 border border-slate-800" 
                    : "bg-white border border-slate-200 shadow-sm"
                }`}
              >
                <div className={`rounded-lg p-2 ${
                  theme === "dark" ? "bg-orange-500/15" : "bg-orange-500/10"
                }`}>
                  <feature.icon className="h-4 w-4 text-orange-500" />
                </div>
                <p className={`text-sm font-medium ${
                  theme === "dark" ? "text-slate-300" : "text-slate-700"
                }`}>
                  {feature.text}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Testimonial */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className={`rounded-xl p-5 ${
              theme === "dark" 
                ? "bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20" 
                : "bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200"
            }`}
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className={`text-sm font-medium italic ${
                  theme === "dark" ? "text-slate-300" : "text-slate-700"
                }`}>
                  "We reduced our hiring time by 70% and found better candidates than ever before."
                </p>
                <p className={`mt-2 text-xs ${
                  theme === "dark" ? "text-slate-500" : "text-slate-600"
                }`}>
                  — Sarah Chen, HR Director
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
