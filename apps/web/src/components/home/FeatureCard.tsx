import type { ComponentType, ReactNode, SVGProps } from "react";

export interface FeatureCardProps {
  bgClass: string;
  badgeBgClass: string;
  iconClass: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  children: ReactNode;
  /** Extra classes on the outer card, e.g. `lg:col-span-2` to span a 2-column grid. */
  className?: string;
}

/** Large feature panel (design reference: screenshot) — colored card, icon badge,
 * heading + copy, and a decorative product mockup below. */
export function FeatureCard({
  bgClass,
  badgeBgClass,
  iconClass,
  icon: Icon,
  title,
  description,
  children,
  className = "",
}: FeatureCardProps) {
  return (
    <div className={`overflow-hidden rounded-3xl p-8 ${bgClass} ${className}`}>
      <span className={`flex h-14 w-14 items-center justify-center rounded-xl ${badgeBgClass}`}>
        <Icon className={`h-7 w-7 ${iconClass}`} />
      </span>
      <h3 className="mt-5 text-3xl font-bold text-gray-900">{title}</h3>
      <p className="mt-3 max-w-md text-base text-gray-600">{description}</p>
      <div className="relative mt-8 h-64">{children}</div>
    </div>
  );
}
