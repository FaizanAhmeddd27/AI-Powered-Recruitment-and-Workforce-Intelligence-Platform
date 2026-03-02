import { motion } from "framer-motion";
import {
  Brain,
  FileSearch,
  BarChart3,
  Zap,
  Shield,
  Users,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Resume Parsing",
    description:
      "Upload a PDF and our AI extracts skills, experience, and education in seconds with 95%+ accuracy.",
    color: "text-purple-500 bg-purple-500/10",
  },
  {
    icon: FileSearch,
    title: "Smart Skill Matching",
    description:
      "Automatically compare candidate skills against job requirements with weighted scoring.",
    color: "text-blue-500 bg-blue-500/10",
  },
  {
    icon: BarChart3,
    title: "AI Candidate Ranking",
    description:
      "Get a ranked list of top candidates for every job based on match scores and experience.",
    color: "text-emerald-500 bg-emerald-500/10",
  },
  {
    icon: Zap,
    title: "Real-time Analytics",
    description:
      "Live dashboards with application tracking, hiring funnels, and platform insights.",
    color: "text-yellow-500 bg-yellow-500/10",
  },
  {
    icon: Shield,
    title: "Multi-Database Architecture",
    description:
      "PostgreSQL for structured data, MongoDB for documents, Redis for caching — built for scale.",
    color: "text-red-500 bg-red-500/10",
  },
  {
    icon: Users,
    title: "Role-Based Access",
    description:
      "Separate experiences for candidates, recruiters, and admins with secure JWT authentication.",
    color: "text-indigo-500 bg-indigo-500/10",
  },
];

export default function FeaturesSection() {
  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Features
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything you need to hire smarter
          </h2>
          <p className="mt-3 text-muted-foreground">
            Powered by GROQ&apos;s Llama 3.1 70B model with a multi-database
            architecture for maximum performance.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="mt-12 grid gap-5 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-lg sm:p-7"
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${feature.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}