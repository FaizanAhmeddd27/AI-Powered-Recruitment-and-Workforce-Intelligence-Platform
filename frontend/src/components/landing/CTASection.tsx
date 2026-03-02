import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import CyberneticGridShader from "@/components/ui/cybernetic-grid-shader";
import { ArrowRight, Sparkles } from "lucide-react";

export default function CTASection() {
  return (
    <section className="relative overflow-hidden bg-card py-16 sm:py-24">
      {/* Cybernetic grid background */}
      <CyberneticGridShader />

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="rounded-3xl border border-border bg-background/80 p-8 shadow-2xl backdrop-blur-md sm:p-12 lg:p-16"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10"
          >
            <Sparkles className="h-7 w-7 text-primary" />
          </motion.div>

          <h2 className="mt-6 text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            Ready to transform your hiring?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Join thousands of companies and candidates using AI to make smarter
            recruitment decisions. Start for free today.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Button size="lg" asChild className="h-12 gap-2 rounded-xl px-8">
              <Link to="/signup">
                Start Hiring Smarter
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-12 rounded-xl px-8"
            >
              <Link to="/jobs">Explore Jobs</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}