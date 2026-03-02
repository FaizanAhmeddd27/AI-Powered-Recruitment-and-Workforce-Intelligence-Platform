import { Link } from "react-router-dom";
import Logo from "@/components/shared/Logo";
import { Separator } from "@/components/ui/separator";
import { FaGithub, FaLinkedin, FaTwitter } from "react-icons/fa";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Platform: [
      { label: "Browse Jobs", href: "/jobs" },
      { label: "For Candidates", href: "/signup" },
      { label: "For Recruiters", href: "/signup" },
    ],
    Company: [
      { label: "About Us", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
    ],
    Legal: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Cookie Policy", href: "#" },
    ],
  };

  return (
    <footer className="border-t border-border bg-card/50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <Logo size="md" />
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              AI-powered recruitment platform that matches talent with
              opportunity intelligently.
            </p>
            <div className="mt-4 flex gap-3">
              {[FaTwitter, FaLinkedin, FaGithub].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link Groups */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-foreground">{title}</h4>
              <ul className="mt-3 space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {currentYear} RecruitAI. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Powered by AI
          </p>
        </div>
      </div>
    </footer>
  );
}