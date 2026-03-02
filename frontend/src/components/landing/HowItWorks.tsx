import { motion } from "framer-motion";
import { Upload, Brain, Trophy, Handshake } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: Upload,
    title: "Upload Resume",
    description: "Candidates upload a PDF resume. Our system stores it in MongoDB GridFS.",
  },
  {
    num: "02",
    icon: Brain,
    title: "AI Analyzes",
    description: "GROQ AI extracts skills, experience, and education with confidence scores.",
  },
  {
    num: "03",
    icon: Trophy,
    title: "Get Ranked",
    description: "AI calculates match scores and ranks candidates for every open position.",
  },
  {
    num: "04",
    icon: Handshake,
    title: "Hire Fast",
    description: "Recruiters review top matches, shortlist, interview, and make data-driven hires.",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-muted/30 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            How it works
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            From resume to hire in 4 steps
          </h2>
        </motion.div>

        <div className="relative mt-12 grid gap-6 sm:mt-16 sm:grid-cols-2 lg:grid-cols-4 sm:gap-8">
          {/* Connector line (desktop only) */}
          <div className="absolute top-16 left-[12.5%] right-[12.5%] hidden h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20 lg:block" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative text-center"
              >
                <div className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-primary bg-background shadow-md sm:h-16 sm:w-16">
                  <Icon className="h-6 w-6 text-primary sm:h-7 sm:w-7" />
                </div>
                <span className="mt-3 block text-xs font-bold text-primary">
                  STEP {step.num}
                </span>
                <h3 className="mt-1 text-base font-semibold text-foreground sm:text-lg">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {step.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}