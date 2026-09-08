export interface LogoProps {
  className?: string;
  iconClassName?: string;
  showWordmark?: boolean;
}

/** ResumeCraft.ai brand mark: the overlapping-bubbles icon, optionally paired
 * with the wordmark (see /public/logo.svg for the standalone icon asset). */
export function Logo({ className = "", iconClassName = "h-7 w-7", showWordmark = true }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="" aria-hidden="true" className={iconClassName} />
      {showWordmark && <span className="text-lg font-bold text-gray-900">ResumeCraft.ai</span>}
    </span>
  );
}
