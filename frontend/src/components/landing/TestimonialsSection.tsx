import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Emily Chen",
    role: "HR Director, TCS",
    avatar: "",
    content:
      "AI Recruit cut our screening time by 80%. The AI ranking is incredibly accurate — we found our best hires through this platform.",
    rating: 5,
  },
  {
    name: "David Lee",
    role: "Senior Developer",
    avatar: "",
    content:
      "Uploaded my resume and got matched to my dream job in 2 days. The skill matching really works!",
    rating: 5,
  },
  {
    name: "Sarah Johnson",
    role: "Talent Lead, Google",
    avatar: "",
    content:
      "The candidate ranking feature saves us hours. We immediately see who's the best fit, backed by AI analysis.",
    rating: 5,
  },
];

export default function TestimonialsSection() {
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
            Testimonials
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Loved by recruiters & candidates
          </h2>
        </motion.div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star
                    key={j}
                    className="h-4 w-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                "{t.content}"
              </p>
              <div className="mt-5 flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={t.avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {t.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}