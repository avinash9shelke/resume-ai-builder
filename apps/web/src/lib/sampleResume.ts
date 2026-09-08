import {
  createEmptyResume,
  DEFAULT_COLUMNS_BY_TEMPLATE,
  DEFAULT_THEME_BY_TEMPLATE,
  getDefaultSectionOrderForTemplate,
  getThemeColors,
  type Resume,
  type RichText,
  type TemplateKey,
} from "@resume-ai/schema";

function bullets(lines: string[]): RichText {
  return lines.map((html, i) => ({
    id: `sample-bullet-${i}-${html.slice(0, 8)}`,
    type: "bullet" as const,
    html,
    date: "",
    dateTo: "",
  }));
}

function paragraph(html: string): RichText {
  return [{ id: `sample-p-${html.slice(0, 8)}`, type: "paragraph" as const, html, date: "", dateTo: "" }];
}

/**
 * A realistic, fully-populated sample resume used to render live template
 * previews in the onboarding gallery — never persisted, purely for showing
 * off each template's visual identity. Content is drawn from the sample
 * resume the user provided ("Resume-Sept-2026.pdf").
 */
export function createSampleResume(template: string, theme?: string): Resume {
  const resume = createEmptyResume();
  resume.basics = {
    ...resume.basics,
    name: "Avinash Shelke",
    headline: "Staff Software Engineer at HMH | AWS Certified",
    email: "avinashe107@gmail.com",
    phone: "+91 7039968812",
    location: "Pune, MH",
    website: { url: "linkedin.com/in/avinash-shelke", label: "" },
  };
  resume.summary = {
    ...resume.summary,
    content: paragraph(
      "Staff Software Engineer with 11+ years of experience architecting scalable, distributed systems across FinTech, E-Commerce, Ed-Tech, and TeleCom/Media. Expert in Java, Spring Boot, Microservices, AWS, and Event-Driven Architectures using Kafka and Kubernetes. Proven track record blending core backend resilience with Generative AI and LLM integration.",
    ),
  };
  resume.sections.experience.items = [
    {
      id: "sample-exp-1",
      hidden: false,
      company: "HMH",
      position: "Staff Software Engineer",
      location: "Pune",
      period: "01/2024 - Present",
      website: { url: "", label: "" },
      description: bullets([
        "Architected and built the HMH Coachly platform from the ground up using cloud-native, event-driven microservices on AWS.",
        "Integrated Zoom and Salesforce to enhance coaching, scheduling, and engagement workflows.",
        "Built AI-powered analytics platform to evaluate student submissions and generate actionable performance insights.",
      ]),
      roles: [],
      logo: "",
    },
    {
      id: "sample-exp-2",
      hidden: false,
      company: "Amdocs",
      position: "Software Development Specialist",
      location: "Pune",
      period: "04/2020 - 12/2023",
      website: { url: "", label: "" },
      description: bullets([
        "Designed subscription marketplace capabilities enabling telecom operators to manage digital service offerings.",
        "Implemented event-driven microservices, enhancing scalability for partner onboarding and subscription workflows.",
        "Designed multi-tenant solutions with tenant-aware event routing and logical data isolation.",
      ]),
      roles: [],
      logo: "",
    },
    {
      id: "sample-exp-3",
      hidden: false,
      company: "CGI",
      position: "Senior Software Engineer",
      location: "Pune",
      period: "10/2019 - 03/2020",
      website: { url: "", label: "" },
      description: bullets([
        "Simplified refund procedures for multiple merchants, enhancing operational efficiency.",
        "Engineered Spring Batch job for streamlined processing and validation of refund transaction files.",
      ]),
      roles: [],
      logo: "",
    },
  ];
  resume.sections.education.items = [
    {
      id: "sample-edu-1",
      hidden: false,
      school: "Savitribai Phule Pune University",
      degree: "MCA",
      area: "Computer Software Engineering",
      grade: "",
      location: "Pune, India",
      period: "01/2015",
      website: { url: "", label: "" },
    },
    {
      id: "sample-edu-2",
      hidden: false,
      school: "Savitribai Phule Pune University",
      degree: "BCA",
      area: "Computer Software Engineering",
      grade: "",
      location: "Pune",
      period: "01/2012",
      website: { url: "", label: "" },
    },
  ];
  resume.sections.skills.items = [
    { id: "sample-skill-1", hidden: false, icon: "", iconColor: "", name: "Java", proficiency: "Expert", level: 5, keywords: [] },
    { id: "sample-skill-2", hidden: false, icon: "", iconColor: "", name: "Spring Boot", proficiency: "Expert", level: 5, keywords: [] },
    { id: "sample-skill-3", hidden: false, icon: "", iconColor: "", name: "Microservices", proficiency: "Expert", level: 5, keywords: [] },
    { id: "sample-skill-4", hidden: false, icon: "", iconColor: "", name: "AWS", proficiency: "Advanced", level: 4, keywords: [] },
    { id: "sample-skill-5", hidden: false, icon: "", iconColor: "", name: "Kafka", proficiency: "Advanced", level: 4, keywords: [] },
    { id: "sample-skill-6", hidden: false, icon: "", iconColor: "", name: "Kubernetes", proficiency: "Advanced", level: 4, keywords: [] },
    { id: "sample-skill-7", hidden: false, icon: "", iconColor: "", name: "Python", proficiency: "Intermediate", level: 3, keywords: [] },
    { id: "sample-skill-8", hidden: false, icon: "", iconColor: "", name: "LangChain", proficiency: "Intermediate", level: 3, keywords: [] },
  ];
  resume.sections.languages.items = [{ id: "sample-lang-1", hidden: false, language: "English", fluency: "Native", level: 5 }];
  resume.sections.certifications.items = [
    {
      id: "sample-cert-1",
      hidden: false,
      title: "AWS Solution Architect - Associate",
      issuer: "AWS",
      date: "09/2025",
      website: { url: "", label: "" },
      description: [],
    },
    {
      id: "sample-cert-2",
      hidden: false,
      title: "AWS Certified Developer - Associate",
      issuer: "AWS",
      date: "02/2026",
      website: { url: "", label: "" },
      description: [],
    },
  ];
  resume.sections.awards.items = [
    {
      id: "sample-award-1",
      hidden: false,
      title: "Standing Tall Award",
      awarder: "HMH Software",
      date: "",
      website: { url: "", label: "" },
      description: paragraph("Recognized for exceptional technical leadership and significant contributions to strategic initiatives."),
    },
    {
      id: "sample-award-2",
      hidden: false,
      title: "Pioneer's Team Award",
      awarder: "HMH Software",
      date: "",
      website: { url: "", label: "" },
      description: paragraph("Honored for driving innovation, collaboration, and successful delivery of high-impact solutions."),
    },
  ];
  resume.customSections = [
    {
      id: "custom:sample-strengths",
      title: "Strengths",
      hidden: false,
      icon: "diamond",
      showDate: false,
      items: [
        {
          id: "sample-strength-1",
          hidden: false,
          title: "Strategic Planning",
          subtitle: "",
          date: "",
          website: { url: "", label: "" },
          description: paragraph(
            "Led cross-functional initiatives that translated business goals into actionable technical roadmaps.",
          ),
        },
        {
          id: "sample-strength-2",
          hidden: false,
          title: "Collaboration",
          subtitle: "",
          date: "",
          website: { url: "", label: "" },
          description: paragraph(
            "Partnered closely with product and design teams to ship reliable, high-impact features.",
          ),
        },
      ],
    },
  ];
  const templateKey = template as TemplateKey;
  const resolvedTheme = theme ?? DEFAULT_THEME_BY_TEMPLATE[templateKey] ?? "classic-blue";
  resume.metadata.template = template;
  resume.metadata.theme = resolvedTheme;
  resume.metadata.design.colors = getThemeColors(resolvedTheme);
  resume.metadata.layout.columns = DEFAULT_COLUMNS_BY_TEMPLATE[templateKey] ?? 1;
  resume.metadata.layout.sectionOrder = [
    ...getDefaultSectionOrderForTemplate(templateKey),
    { id: "custom:sample-strengths", column: 1 },
  ];
  return resume;
}
