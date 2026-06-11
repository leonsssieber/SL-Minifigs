import { cn } from "@/lib/utils";

/**
 * Das SL-Markenzeichen — überall in der gleichen "3D"-Optik
 * (dicker Rand + harter Versatz-Schatten, Neo-Brutalismus).
 * `onDark` für dunkle Hintergründe (Footer): Rand & Schatten in Hell.
 */
export function Logo({
  size = "md",
  onDark = false,
  className,
}: {
  size?: "sm" | "md";
  onDark?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block rounded-md bg-primary text-primary-foreground border-2 grid place-items-center font-black tracking-tight",
        size === "md" ? "h-9 w-9 text-xs" : "h-8 w-8 text-[10px]",
        onDark
          ? "border-background shadow-[3px_3px_0_0_hsl(var(--background)/0.35)]"
          : "border-foreground shadow-brutal-sm",
        className
      )}
    >
      SL
    </span>
  );
}
