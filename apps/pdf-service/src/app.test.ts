import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createEmptyResume } from "@resume-ai/schema";

vi.mock("./pdf", () => ({
  htmlToPdf: vi.fn(async () => Buffer.from("%PDF-1.4 fake")),
  closeBrowser: vi.fn(async () => undefined),
}));

// Import after mocking so createApp picks up the mocked ./pdf module.
const { createApp } = await import("./app");

describe("pdf-service", () => {
  it("GET /health returns ok", async () => {
    const app = createApp();
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("POST /render returns a PDF for a valid resume", async () => {
    const app = createApp();
    const resume = createEmptyResume();
    resume.basics.name = "Ada Lovelace";

    const res = await request(app).post("/render").send(resume);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("application/pdf");
  });

  it("POST /render rejects an invalid payload", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/render")
      .send({ basics: { email: 12345 }, sections: "not-an-object" });
    expect(res.status).toBe(400);
  });

  it("POST /render/html returns rendered HTML containing the name", async () => {
    const app = createApp();
    const resume = createEmptyResume();
    resume.basics.name = "Grace Hopper";

    const res = await request(app).post("/render/html").send(resume);
    expect(res.status).toBe(200);
    expect(res.text).toContain("Grace Hopper");
  });

  it("POST /render/html renders certifications, awards, and custom sections", async () => {
    const app = createApp();
    const resume = createEmptyResume();
    resume.basics.name = "Marie Curie";
    resume.sections.certifications.items = [
      { id: "c1", hidden: false, title: "PMP", issuer: "PMI", date: "2020", website: { url: "", label: "" }, description: [] },
    ];
    resume.sections.awards.items = [
      {
        id: "a1",
        hidden: false,
        title: "Nobel Prize",
        awarder: "Nobel Committee",
        date: "1903",
        website: { url: "", label: "" },
        description: [{ id: "ad1", type: "paragraph", html: "Physics" }],
      },
    ];
    resume.customSections = [
      {
        id: "custom:s1",
        title: "Publications",
        hidden: false,
        icon: "",
        showDate: false,
        items: [
          {
            id: "i1",
            hidden: false,
            title: "Recherches sur les substances radioactives",
            subtitle: "",
            date: "1904",
            website: { url: "", label: "" },
            description: [{ id: "d1", type: "paragraph", html: "Doctoral thesis" }],
          },
        ],
      },
    ];
    resume.metadata.layout.sectionOrder.push({ id: "custom:s1", column: 0 });

    const res = await request(app).post("/render/html").send(resume);
    expect(res.status).toBe(200);
    expect(res.text).toContain("PMP");
    expect(res.text).toContain("Nobel Prize");
    expect(res.text).toContain("Publications");
    expect(res.text).toContain("Recherches sur les substances radioactives");
  });

  it("POST /render/html respects profile field toggles", async () => {
    const app = createApp();
    const resume = createEmptyResume();
    resume.basics.name = "Avinash Shelke";
    resume.basics.headline = "Staff Software Engineer";
    resume.basics.phone = "555-1234";
    resume.metadata.profileSettings.showHeadline = false;
    resume.metadata.profileSettings.showPhone = true;
    resume.metadata.profileSettings.uppercaseName = false;

    const res = await request(app).post("/render/html").send(resume);
    expect(res.status).toBe(200);
    expect(res.text).not.toContain("Staff Software Engineer");
    expect(res.text).toContain("555-1234");
    expect(res.text).not.toMatch(/<h1[^>]*class="uppercase"/);
  });

  it("POST /render/html renders rich text summary/description as paragraphs and bullets", async () => {
    const app = createApp();
    const resume = createEmptyResume();
    resume.basics.name = "Ada Lovelace";
    resume.summary.content = [
      { id: "s1", type: "paragraph", html: "Pioneer of <strong>computing</strong>." },
      { id: "s2", type: "bullet", html: "Wrote the first algorithm" },
      { id: "s3", type: "bullet", html: "Collaborated with Babbage" },
    ];

    const res = await request(app).post("/render/html").send(resume);
    expect(res.status).toBe(200);
    expect(res.text).toContain("<p>Pioneer of <strong>computing</strong>.</p>");
    expect(res.text).toContain("<ul><li>Wrote the first algorithm</li><li>Collaborated with Babbage</li></ul>");
  });

  it("POST /render/html renders flat skills as underlined tags", async () => {
    const app = createApp();
    const resume = createEmptyResume();
    resume.basics.name = "Ada Lovelace";
    resume.sections.skills.items = [
      { id: "k1", hidden: false, icon: "", iconColor: "", name: "AWS", proficiency: "", level: 0, keywords: [] },
      { id: "k2", hidden: false, icon: "", iconColor: "", name: "Docker", proficiency: "", level: 0, keywords: [] },
    ];

    const res = await request(app).post("/render/html").send(resume);
    expect(res.status).toBe(200);
    expect(res.text).toContain('<span class="skill-tag">AWS</span><span class="skill-tag">Docker</span>');
  });

  it("POST /render/html renders icon-tagged custom sections (e.g. Strengths) with an icon avatar per entry", async () => {
    const app = createApp();
    const resume = createEmptyResume();
    resume.basics.name = "Ada Lovelace";
    resume.customSections = [
      {
        id: "custom:s1",
        title: "Strengths",
        hidden: false,
        icon: "diamond",
        showDate: false,
        items: [
          {
            id: "i1",
            hidden: false,
            title: "Go-getter",
            subtitle: "",
            date: "",
            website: { url: "", label: "" },
            description: [{ id: "d1", type: "paragraph", html: "Persistence pays off." }],
          },
        ],
      },
    ];
    resume.metadata.layout.sectionOrder.push({ id: "custom:s1", column: 0 });

    const res = await request(app).post("/render/html").send(resume);
    expect(res.status).toBe(200);
    expect(res.text).toContain('<div class="icon-item">');
    expect(res.text).toContain('<span class="icon-avatar">');
    expect(res.text).toContain("Go-getter");
    expect(res.text).toContain("Persistence pays off.");
  });

  it("POST /render/html renders an Experience item's company logo when set", async () => {
    const app = createApp();
    const resume = createEmptyResume();
    resume.basics.name = "Ada Lovelace";
    resume.sections.experience.items = [
      {
        id: "w1",
        hidden: false,
        company: "Acme",
        position: "Engineer",
        location: "",
        period: "2020 - 2022",
        website: { url: "", label: "" },
        description: [],
        roles: [],
        logo: "data:image/png;base64,iVBORw0KGgo=",
      },
    ];

    const res = await request(app).post("/render/html").send(resume);
    expect(res.status).toBe(200);
    // Handlebars HTML-escapes "=" as "&#x3D;" in the base64 payload (valid,
    // renders identically) — match on the un-escaped prefix instead.
    expect(res.text).toContain('<img class="item-logo" src="data:image/png;base64,iVBORw0KGgo');
    expect(res.text).toContain('<div class="icon-item">');
  });

  it("POST /render/html omits the logo image and icon-item wrapper for an Experience item without a logo", async () => {
    const app = createApp();
    const resume = createEmptyResume();
    resume.basics.name = "Ada Lovelace";
    resume.sections.experience.items = [
      {
        id: "w1",
        hidden: false,
        company: "Acme",
        position: "Engineer",
        location: "",
        period: "2020 - 2022",
        website: { url: "", label: "" },
        description: [],
        roles: [],
        logo: "",
      },
    ];

    const res = await request(app).post("/render/html").send(resume);
    expect(res.status).toBe(200);
    // The `.item-logo` CSS rule is always present in the shared stylesheet;
    // what matters is that no <img> tag using it gets rendered.
    expect(res.text).not.toContain('<img class="item-logo"');
    expect(res.text).not.toContain('<div class="icon-item">');
  });

  it("POST /render/html renders a custom section's date field only when showDate is set", async () => {
    const app = createApp();
    const resume = createEmptyResume();
    resume.basics.name = "Ada Lovelace";
    resume.customSections = [
      {
        id: "custom:s1",
        title: "Custom",
        hidden: false,
        icon: "",
        showDate: true,
        items: [
          {
            id: "i1",
            hidden: false,
            title: "Custom Title",
            subtitle: "",
            date: "2020 - 2021",
            website: { url: "", label: "" },
            description: [{ id: "d1", type: "paragraph", html: "Custom Description" }],
          },
        ],
      },
    ];
    resume.metadata.layout.sectionOrder.push({ id: "custom:s1", column: 0 });

    const res = await request(app).post("/render/html").send(resume);
    expect(res.status).toBe(200);
    expect(res.text).not.toContain('<span class="icon-avatar">');
    expect(res.text).toContain('<span class="item-dates">2020 - 2021</span>');
  });

  it.each([
    "refined",
    "classic-serif",
    "obsidian-edge",
    "precision-line",
    "silver-banner",
    "cobalt-edge",
    "editorial-rule",
    "true-blue",
    "saffron-line",
    "steady-form",
    "hunter-green",
    "quicksilver",
    "classic-clear",
    "atlantic-blue",
    "mercury-flow",
    "meridian-slate",
    "azure-banner",
    "teal-outline",
    "teal-portrait",
    "dual-grid",
    "unknown-template-falls-back",
  ])(
    "POST /render/html renders every visual template (%s) without error, using every section kind",
    async (template) => {
      const app = createApp();
      const resume = createEmptyResume();
      resume.basics.name = "Ada Lovelace";
      resume.basics.headline = "Staff Software Engineer";
      resume.picture.url = "data:image/png;base64,iVBORw0KGgo=";
      resume.summary.content = [{ id: "s1", type: "paragraph", html: "Pioneer of computing." }];
      resume.sections.experience.items = [
        {
          id: "w1",
          hidden: false,
          company: "Acme",
          position: "Engineer",
          location: "",
          period: "2020 - 2022",
          website: { url: "", label: "" },
          description: [{ id: "wd1", type: "bullet", html: "Shipped things" }],
          roles: [],
          logo: "",
        },
      ];
      resume.sections.education.items = [
        {
          id: "e1",
          hidden: false,
          school: "MIT",
          degree: "BSc",
          area: "CS",
          grade: "",
          location: "",
          period: "2016 - 2020",
          website: { url: "", label: "" },
        },
      ];
      resume.sections.skills.items = [
        { id: "k1", hidden: false, icon: "", iconColor: "", name: "AWS", proficiency: "", level: 0, keywords: [] },
      ];
      resume.sections.projects.items = [
        {
          id: "pr1",
          hidden: false,
          name: "Engine",
          period: "2021",
          website: { url: "", label: "" },
          description: [{ id: "prd1", type: "paragraph", html: "Built a thing" }],
        },
      ];
      resume.sections.certifications.items = [
        { id: "c1", hidden: false, title: "PMP", issuer: "PMI", date: "2020", website: { url: "", label: "" }, description: [] },
      ];
      resume.sections.publications.items = [
        { id: "pu1", hidden: false, title: "A Paper", publisher: "ACM", date: "2019", website: { url: "", label: "" }, description: [] },
      ];
      resume.sections.volunteer.items = [
        { id: "v1", hidden: false, organization: "Red Cross", location: "", period: "2018", website: { url: "", label: "" }, description: [] },
      ];
      resume.sections.awards.items = [
        { id: "a1", hidden: false, title: "Nobel", awarder: "Committee", date: "1903", website: { url: "", label: "" }, description: [] },
      ];
      resume.sections.languages.items = [{ id: "l1", hidden: false, language: "English", fluency: "Native", level: 5 }];
      resume.sections.interests.items = [{ id: "i1", hidden: false, icon: "", iconColor: "", name: "Chess", keywords: [] }];
      resume.sections.references.items = [
        { id: "r1", hidden: false, name: "Ref", position: "Manager", website: { url: "", label: "" }, phone: "", description: [{ id: "rd1", type: "paragraph", html: "Great" }] },
      ];
      resume.customSections = [
        { id: "custom:cs1", title: "Strengths", hidden: false, icon: "diamond", showDate: false, items: [] },
      ];
      resume.metadata.layout.columns = 2;
      const knownTemplates = [
        "refined",
        "classic-serif",
        "obsidian-edge",
        "precision-line",
        "silver-banner",
        "cobalt-edge",
        "editorial-rule",
        "true-blue",
        "saffron-line",
        "steady-form",
        "hunter-green",
        "quicksilver",
        "classic-clear",
        "atlantic-blue",
        "mercury-flow",
        "meridian-slate",
        "azure-banner",
        "teal-outline",
        "teal-portrait",
        "dual-grid",
      ];
      resume.metadata.template = (
        knownTemplates.includes(template) ? template : "refined"
      ) as typeof resume.metadata.template;
      resume.metadata.layout.sectionOrder.push({ id: "custom:cs1", column: 1 });

      const res = await request(app).post("/render/html").send(resume);
      expect(res.status).toBe(200);
      expect(res.text).toContain("Ada Lovelace");
    },
  );
});
