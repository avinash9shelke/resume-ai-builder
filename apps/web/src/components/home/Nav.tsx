import Link from "next/link";
import { Logo } from "@/components/Logo";

const NAV_LINKS = [
  { label: "Resume Templates", href: "/onboarding" },
  { label: "My Resumes", href: "/dashboard" },
];

/** Top nav bar (design reference: screenshot) — logo and nav links. */
export function Nav() {
  return (
    <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
      <Link href="/">
        <Logo />
      </Link>

      <div className="hidden items-center gap-8 md:flex">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
