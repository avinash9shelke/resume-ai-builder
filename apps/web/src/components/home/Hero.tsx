import Link from "next/link";
import { ProductFlipCards } from "@/components/home/ProductFlipCards";
import { SparklesIcon, StarIcon } from "@/components/icons";

const AVATAR_COLORS = ["bg-rose-400", "bg-amber-400", "bg-emerald-400", "bg-blue-400", "bg-violet-400"];

/** Home page hero (design reference: screenshot) — headline + CTA on the left,
 * an auto-flipping stack of our real product panels on the right (see
 * ProductFlipCards.tsx). */
export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
            Free AI Resume Builder
          </p>
          <h1 className="mt-4 text-5xl font-extrabold leading-[1.05] tracking-tight text-gray-900 sm:text-6xl">
            Build a job-winning resume for free
          </h1>
          <p className="mt-6 max-w-md text-lg text-gray-600">
            Your first resume is 100% free forever. Unlimited downloads, AI-polished content, and
            professionally designed templates. Yes, really.
          </p>

          <div className="mt-8">
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-7 py-4 text-base font-bold text-white shadow-lg hover:bg-gray-800"
            >
              Get started for free
              <SparklesIcon className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 flex items-center gap-3">
            <div className="flex">
              {AVATAR_COLORS.map((color, i) => (
                <span
                  key={i}
                  className={`-ml-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white first:ml-0 ${color}`}
                >
                  {String.fromCharCode(65 + i)}
                </span>
              ))}
            </div>
            <div>
              <div className="flex text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon key={i} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
              <p className="text-sm font-medium text-gray-600">Trusted by professionals worldwide</p>
            </div>
          </div>
        </div>

        <ProductFlipCards />
      </div>
    </section>
  );
}
