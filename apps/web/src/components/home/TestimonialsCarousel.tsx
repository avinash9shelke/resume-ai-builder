"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QuoteIcon, SparklesIcon, StarIcon } from "@/components/icons";

const AVATAR_COLORS = ["bg-indigo-500", "bg-violet-500", "bg-blue-500"];

const TESTIMONIALS = [
  {
    quote:
      "ResumeCraft.ai changed my job search completely: one week and four interviews later, I landed a role paying 30% more than I expected.",
    name: "Jenica",
    role: "Solutions Engineer",
    company: "Udemy",
    initials: "JN",
  },
  {
    quote:
      "The AI Polish suggestions alone were worth it. I rewrote my whole summary in minutes and finally felt like my resume matched my experience.",
    name: "Marcus",
    role: "Product Manager",
    company: "Shopify",
    initials: "MP",
  },
  {
    quote:
      "I uploaded my old resume, picked a template, and had a polished, ATS-ready PDF in under 20 minutes. Genuinely the easiest resume tool I've used.",
    name: "Priya",
    role: "Data Analyst",
    company: "Stripe",
    initials: "PA",
  },
];

const TESTIMONIAL_INTERVAL_MS = 4500;

/**
 * User feedback carousel (design reference: screenshot) — a dark panel with
 * a floating testimonial card on the left (auto-cycling through reviews)
 * and a headline + CTA + rating summary on the right, closing out the home
 * page. Uses the purple/indigo #4F46E5 hue for the icons and pagination
 * dots instead of the reference's green/teal.
 */
export function TestimonialsCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((i) => (i + 1) % TESTIMONIALS.length), TESTIMONIAL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const testimonial = TESTIMONIALS[active];

  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <div className="relative overflow-hidden rounded-3xl bg-gray-900 px-8 py-16 sm:px-14">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <div className="relative mx-auto w-full max-w-sm">
            <div className="relative rounded-2xl bg-white px-6 pb-6 pt-12 shadow-2xl">
              <span
                className={`absolute -top-6 left-6 flex h-14 w-14 items-center justify-center rounded-full text-sm font-bold text-white ring-4 ring-white ${AVATAR_COLORS[active % AVATAR_COLORS.length]}`}
              >
                {testimonial.initials}
              </span>

              <QuoteIcon className="h-5 w-5 text-indigo-600" />
              <p className="mt-3 text-sm leading-relaxed text-gray-700">{testimonial.quote}</p>

              <div className="mt-5 border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{testimonial.name}</p>
                <p className="text-sm font-bold text-gray-900">{testimonial.role}</p>
              </div>
              <p className="mt-3 text-sm font-extrabold tracking-tight text-gray-400">{testimonial.company}</p>
            </div>

            <div className="mt-6 flex items-center justify-center gap-1.5">
              {TESTIMONIALS.map((t, i) => (
                <button
                  key={t.name}
                  type="button"
                  aria-label={`Show testimonial from ${t.name}`}
                  onClick={() => setActive(i)}
                  className={`rounded-full transition-all ${
                    i === active ? "h-2.5 w-2.5 bg-indigo-500" : "h-2 w-2 bg-white/30 hover:bg-white/50"
                  }`}
                />
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
              Your resume is an extension of yourself — make one that&apos;s truly you
            </h2>

            <Link
              href="/onboarding"
              className="mt-7 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-indigo-700"
            >
              Build Your Resume
              <SparklesIcon className="h-4 w-4" />
            </Link>

            <div className="mt-6 flex items-center gap-2 text-sm text-white">
              <span className="font-semibold">Excellent</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className="flex h-5 w-5 items-center justify-center rounded bg-indigo-600">
                    <StarIcon className="h-3 w-3 fill-current text-white" />
                  </span>
                ))}
              </div>
              <span className="text-white/70">5,335 Reviews</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
