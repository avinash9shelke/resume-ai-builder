import { beforeEach, describe, expect, it } from "vitest";
import { v4 as uuidv4 } from "uuid";
import {
  getSingleLineText,
  plainTextToRichText,
  richTextToPlainText,
  setSingleLineRichText,
} from "@resume-ai/schema";
import { useResumeStore } from "./store";

beforeEach(() => {
  useResumeStore.getState().resetToBlank();
});

describe("useResumeStore", () => {
  it("adds, updates, and removes list items", () => {
    const { addItem, updateItem, removeItem } = useResumeStore.getState();

    addItem("experience");
    let items = useResumeStore.getState().resume.sections.experience.items;
    expect(items).toHaveLength(1);
    const id = items[0].id;

    updateItem("experience", id, { position: "Engineer" });
    items = useResumeStore.getState().resume.sections.experience.items;
    expect(items[0].position).toBe("Engineer");

    removeItem("experience", id);
    expect(useResumeStore.getState().resume.sections.experience.items).toHaveLength(0);
  });

  it("updates basics", () => {
    useResumeStore.getState().updateBasics({ name: "Ada Lovelace" });
    expect(useResumeStore.getState().resume.basics.name).toBe("Ada Lovelace");
  });

  it("stores and round-trips rich text summary entries", () => {
    const { updateSummary } = useResumeStore.getState();

    updateSummary({ content: plainTextToRichText("Line one\nLine two", uuidv4) });
    const content = useResumeStore.getState().resume.summary.content;
    expect(content).toHaveLength(2);
    expect(content.every((e) => e.type === "paragraph")).toBe(true);
    expect(richTextToPlainText(content)).toBe("Line one\nLine two");

    // Simulates AI Polish "Use this" replacing the whole field with one suggestion.
    updateSummary({ content: plainTextToRichText("Polished summary.", uuidv4) });
    expect(richTextToPlainText(useResumeStore.getState().resume.summary.content)).toBe(
      "Polished summary.",
    );
  });

  it("maps bullet-marked lines (e.g. an AI Polish suggestion) to bullet-type entries", () => {
    const { updateSummary } = useResumeStore.getState();

    updateSummary({
      content: plainTextToRichText("• Led AI initiatives\n• Reduced costs by 30%", uuidv4),
    });
    const content = useResumeStore.getState().resume.summary.content;

    expect(content.map((e) => e.html)).toEqual(["Led AI initiatives", "Reduced costs by 30%"]);
    expect(content.every((e) => e.type === "bullet")).toBe(true);
    expect(richTextToPlainText(content)).toBe("• Led AI initiatives\n• Reduced costs by 30%");
  });

  it("manages flat skill items", () => {
    const { addItem, updateItem, removeItem } = useResumeStore.getState();

    addItem("skills");
    let items = useResumeStore.getState().resume.sections.skills.items;
    expect(items).toHaveLength(1);
    const skillId = items[0].id;

    updateItem("skills", skillId, { name: "AWS", level: 4 });
    items = useResumeStore.getState().resume.sections.skills.items;
    expect(items[0].name).toBe("AWS");
    expect(items[0].level).toBe(4);

    removeItem("skills", skillId);
    expect(useResumeStore.getState().resume.sections.skills.items).toHaveLength(0);
  });

  it("manages custom fields on basics", () => {
    const { addCustomField, updateCustomField, removeCustomField } = useResumeStore.getState();

    addCustomField();
    let fields = useResumeStore.getState().resume.basics.customFields;
    expect(fields).toHaveLength(1);
    const id = fields[0].id;

    updateCustomField(id, { text: "Portfolio: example.com" });
    fields = useResumeStore.getState().resume.basics.customFields;
    expect(fields[0].text).toBe("Portfolio: example.com");

    removeCustomField(id);
    expect(useResumeStore.getState().resume.basics.customFields).toHaveLength(0);
  });

  it("updates profile settings (field toggles + photo style)", () => {
    const { updateProfileSettings } = useResumeStore.getState();

    updateProfileSettings({ showPhone: true, showHeadline: false });
    let settings = useResumeStore.getState().resume.metadata.profileSettings;
    expect(settings.showPhone).toBe(true);
    expect(settings.showHeadline).toBe(false);
    // Untouched fields keep their defaults.
    expect(settings.showEmail).toBe(true);

    updateProfileSettings({ photoStyle: "square" });
    settings = useResumeStore.getState().resume.metadata.profileSettings;
    expect(settings.photoStyle).toBe("square");
  });

  it("sets the template and theme (with theme driving design colors)", () => {
    const { setTemplate, setTheme } = useResumeStore.getState();

    setTemplate("hunter-green");
    expect(useResumeStore.getState().resume.metadata.template).toBe("hunter-green");

    setTheme("emerald");
    const metadata = useResumeStore.getState().resume.metadata;
    expect(metadata.theme).toBe("emerald");
    expect(metadata.design.colors.primary).toBe("rgba(5, 150, 105, 1)");
  });

  it("clamps section columns when switching from 2 to 1", () => {
    const { setColumns, moveSection } = useResumeStore.getState();
    setColumns(2);
    moveSection("skills", 1, 0);
    expect(
      useResumeStore.getState().resume.metadata.layout.sectionOrder.find((p) => p.id === "skills")
        ?.column,
    ).toBe(1);

    setColumns(1);
    expect(
      useResumeStore.getState().resume.metadata.layout.sectionOrder.every((p) => p.column === 0),
    ).toBe(true);
  });

  it("redistributes sections across both columns when switching 1 -> 2 -> 1 -> 2", () => {
    // Regression test: a naive column-count toggle used to only ever clamp
    // column indices *down* (never redistribute back out), so a
    // 2 -> 1 -> 2 round trip left every section bunched in column 0 with
    // column 1 permanently empty — the exported/previewed resume then
    // rendered with a huge blank second column instead of a real 2-column
    // layout.
    const { setColumns } = useResumeStore.getState();

    setColumns(1);
    expect(
      useResumeStore.getState().resume.metadata.layout.sectionOrder.every((p) => p.column === 0),
    ).toBe(true);

    setColumns(2);
    const order = useResumeStore.getState().resume.metadata.layout.sectionOrder;
    const columnsUsed = new Set(order.map((p) => p.column));
    expect(columnsUsed.has(1)).toBe(true);
    expect(order.some((p) => p.id === "experience" && p.column !== undefined)).toBe(true);
  });

  it("recomputes the section split when switching templates with different column defaults", () => {
    const { setColumns, setTemplate } = useResumeStore.getState();
    setColumns(1);

    setTemplate("hunter-green");
    const metadata = useResumeStore.getState().resume.metadata;
    expect(metadata.layout.columns).toBe(2);
    const columnsUsed = new Set(metadata.layout.sectionOrder.map((p) => p.column));
    expect(columnsUsed.has(0)).toBe(true);
    expect(columnsUsed.has(1)).toBe(true);
  });

  it("moveSection reorders within a column", () => {
    const { setColumns, moveSection } = useResumeStore.getState();
    setColumns(1);
    moveSection("skills", 0, 0);
    const order = useResumeStore.getState().resume.metadata.layout.sectionOrder;
    const nonBasics = order.filter((p) => p.id !== "basics" && p.id !== "summary");
    expect(nonBasics[0].id).toBe("skills");
  });

  it("adds, updates, and removes certifications and awards", () => {
    const { addItem, updateItem, removeItem } = useResumeStore.getState();

    addItem("certifications");
    const certId = useResumeStore.getState().resume.sections.certifications.items[0].id;
    updateItem("certifications", certId, { title: "PMP", issuer: "PMI" });
    expect(useResumeStore.getState().resume.sections.certifications.items[0].title).toBe("PMP");

    addItem("awards");
    const awardId = useResumeStore.getState().resume.sections.awards.items[0].id;
    updateItem("awards", awardId, { title: "Nobel Prize" });
    expect(useResumeStore.getState().resume.sections.awards.items[0].title).toBe("Nobel Prize");

    removeItem("certifications", certId);
    removeItem("awards", awardId);
    expect(useResumeStore.getState().resume.sections.certifications.items).toHaveLength(0);
    expect(useResumeStore.getState().resume.sections.awards.items).toHaveLength(0);
  });

  it("manages custom sections end-to-end", () => {
    const {
      addCustomSection,
      updateCustomSectionTitle,
      addCustomSectionItem,
      updateCustomSectionItem,
      removeCustomSectionItem,
      removeCustomSection,
    } = useResumeStore.getState();

    addCustomSection("Publications");
    const section = useResumeStore.getState().resume.customSections[0];
    expect(section.title).toBe("Publications");
    expect(section.id.startsWith("custom:")).toBe(true);

    // The new section should also be appended to the layout's section order.
    expect(
      useResumeStore.getState().resume.metadata.layout.sectionOrder.some((p) => p.id === section.id),
    ).toBe(true);

    updateCustomSectionTitle(section.id, "Research");
    expect(useResumeStore.getState().resume.customSections[0].title).toBe("Research");

    addCustomSectionItem(section.id);
    const itemId = useResumeStore.getState().resume.customSections[0].items[0].id;
    updateCustomSectionItem(section.id, itemId, { title: "Paper Title" });
    expect(useResumeStore.getState().resume.customSections[0].items[0].title).toBe("Paper Title");

    removeCustomSectionItem(section.id, itemId);
    expect(useResumeStore.getState().resume.customSections[0].items).toHaveLength(0);

    removeCustomSection(section.id);
    expect(useResumeStore.getState().resume.customSections).toHaveLength(0);
    expect(
      useResumeStore.getState().resume.metadata.layout.sectionOrder.some((p) => p.id === section.id),
    ).toBe(false);
  });

  it("preserves spaces when live-typing a custom section's description (setSingleLineRichText)", () => {
    // Regression test: plainTextToRichText/richTextToPlainText's `.trim()`
    // used to eat a trailing space on every keystroke when the value was
    // re-derived on each render, corrupting text typed into a single-line
    // field (e.g. "Some description here." -> "Somedescriptionhere.").
    // setSingleLineRichText/getSingleLineText must round-trip without trimming.
    const text = "Some description here.";
    let description: ReturnType<typeof setSingleLineRichText> = [];
    for (let i = 1; i <= text.length; i++) {
      description = setSingleLineRichText(description, text.slice(0, i), uuidv4);
      expect(getSingleLineText(description)).toBe(text.slice(0, i));
    }
    expect(getSingleLineText(description)).toBe(text);

    // The entry's id should stay stable across keystrokes (not regenerated each time).
    const id = description[0].id;
    description = setSingleLineRichText(description, `${text} more`, uuidv4);
    expect(description[0].id).toBe(id);
  });
});
