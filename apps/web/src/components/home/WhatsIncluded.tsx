import {
  CloudUploadIcon,
  DownloadIcon,
  GiftIcon,
  LayersIcon,
  ShieldIcon,
  SmileIcon,
} from "@/components/icons";

const ITEMS = [
  {
    icon: GiftIcon,
    title: "Your First Resume, On Us",
    description: "Create, edit, and save your resume for free. No trial period, no credit card required.",
  },
  {
    icon: SmileIcon,
    title: "Just You on Your Resume",
    description: "We never brand your resume. No watermarks, no logos — it's your document, start to finish.",
  },
  {
    icon: DownloadIcon,
    title: "Unlimited PDF Downloads",
    description: "Update, edit, and export your resume as often as you like. There are no download limits.",
  },
  {
    icon: LayersIcon,
    title: "15+ Customizable Templates",
    description: "Choose from professional, ATS-friendly templates and fully customize structure, layout, and design.",
  },
  {
    icon: CloudUploadIcon,
    title: "Import Content or Start From Scratch",
    description: "Upload an existing resume file, paste its text, or start from a blank page — whatever's fastest for you.",
  },
  {
    icon: ShieldIcon,
    title: "We Respect Your Privacy",
    description: "Your data is never used for AI model training or shared with 3rd parties, and you can delete it anytime.",
  },
];

/** "What's included" closing section (design reference: screenshot) — a
 * simple grid of feature bullets, each with a small icon badge, reassuring
 * visitors about what they get before they commit to building a resume. */
export function WhatsIncluded() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          What&apos;s included with ResumeCraft.ai
        </h2>
        <p className="mt-4 text-lg text-gray-600">
          You won&apos;t find a more generous resume builder. Here&apos;s what you get.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map((item) => (
          <div key={item.title}>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <item.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-base font-bold text-gray-900">{item.title}</h3>
            <p className="mt-1.5 text-sm text-gray-600">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
