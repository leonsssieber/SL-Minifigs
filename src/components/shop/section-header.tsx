import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeader({
  title,
  href = "/produkte",
  linkLabel = "Alle ansehen",
}: {
  title: string;
  href?: string | null;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-8">
      <h2 className="flex items-center gap-3 font-display text-2xl md:text-3xl font-bold uppercase tracking-tight">
        <span className="inline-block h-4 w-4 rounded-sm border-2 border-foreground bg-primary" aria-hidden />
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="group inline-flex items-center gap-1 text-sm font-bold uppercase tracking-wide text-foreground/60 hover:text-foreground transition-colors"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
