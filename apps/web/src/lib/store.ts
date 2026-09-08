import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import {
  createEmptyResume,
  CUSTOM_SECTION_PREFIX,
  DEFAULT_COLUMNS_BY_TEMPLATE,
  getDefaultSectionOrderForTemplate,
  getThemeColors,
  isCustomSectionId,
  plainTextToRichText,
  type Basics,
  type CustomField,
  type CustomSection,
  type CustomSectionItem,
  type Picture,
  type ProfileSettings,
  type Resume,
  type SectionId,
  type SectionKey,
  type SectionPlacement,
  type Sections,
  type Summary,
  type TemplateKey,
  type ThemeKey,
  type Typography,
} from "@resume-ai/schema";

type ListSectionKey = SectionKey;
type ListItemFor<K extends ListSectionKey> = Sections[K]["items"][number];

function emptyWebsite() {
  return { url: "", label: "" };
}

const NEW_ITEM_FACTORY: {
  [K in ListSectionKey]: () => ListItemFor<K>;
} = {
  experience: () => ({ id: uuidv4(), hidden: false, company: "", position: "", location: "", period: "", website: emptyWebsite(), description: [], roles: [], logo: "" }),
  education: () => ({ id: uuidv4(), hidden: false, school: "", degree: "", area: "", grade: "", location: "", period: "", website: emptyWebsite() }),
  projects: () => ({ id: uuidv4(), hidden: false, name: "", period: "", website: emptyWebsite(), description: [] }),
  skills: () => ({ id: uuidv4(), hidden: false, icon: "", iconColor: "", name: "", proficiency: "", level: 0, keywords: [] }),
  languages: () => ({ id: uuidv4(), hidden: false, language: "", fluency: "", level: 0 }),
  interests: () => ({ id: uuidv4(), hidden: false, icon: "", iconColor: "", name: "", keywords: [] }),
  awards: () => ({ id: uuidv4(), hidden: false, title: "", awarder: "", date: "", website: emptyWebsite(), description: [] }),
  certifications: () => ({ id: uuidv4(), hidden: false, title: "", issuer: "", date: "", website: emptyWebsite(), description: [] }),
  publications: () => ({ id: uuidv4(), hidden: false, title: "", publisher: "", date: "", website: emptyWebsite(), description: [] }),
  volunteer: () => ({ id: uuidv4(), hidden: false, organization: "", location: "", period: "", website: emptyWebsite(), description: [] }),
  references: () => ({ id: uuidv4(), hidden: false, name: "", position: "", website: emptyWebsite(), phone: "", description: [] }),
};

interface ResumeStore {
  resume: Resume;
  isDirty: boolean;

  // Ephemeral UI-only state (not part of the persisted resume): section ids
  // flagged by the last ATS score check, so the board/profile card can
  // highlight exactly which sections need attention.
  atsHighlightedSections: string[];
  setAtsHighlightedSections: (sectionIds: string[]) => void;

  loadResume: (resume: Resume) => void;
  resetToBlank: () => void;
  setTitle: (title: string) => void;

  updateBasics: (partial: Partial<Basics>) => void;
  updateSummary: (partial: Partial<Summary>) => void;
  updatePicture: (partial: Partial<Picture>) => void;

  addCustomField: () => void;
  updateCustomField: (id: string, partial: Partial<CustomField>) => void;
  removeCustomField: (id: string) => void;

  addItem: <K extends ListSectionKey>(section: K) => void;
  updateItem: <K extends ListSectionKey>(
    section: K,
    id: string,
    partial: Partial<ListItemFor<K>>,
  ) => void;
  removeItem: (section: ListSectionKey, id: string) => void;

  setColumns: (columns: 1 | 2) => void;
  setSectionOrder: (order: SectionPlacement[]) => void;
  moveSection: (sectionId: SectionId, targetColumn: number, targetIndex: number) => void;

  setTemplate: (template: TemplateKey) => void;
  setTheme: (theme: ThemeKey | string) => void;

  updateProfileSettings: (partial: Partial<ProfileSettings>) => void;
  updateTypography: (partial: Partial<Typography>) => void;

  addCustomSection: (
    title: string,
    options?: {
      icon?: string;
      showDate?: boolean;
      seedItems?: Array<{ heading: string; description: string }>;
    },
  ) => void;
  removeCustomSection: (sectionId: string) => void;
  updateCustomSectionTitle: (sectionId: string, title: string) => void;
  addCustomSectionItem: (sectionId: string) => void;
  updateCustomSectionItem: (
    sectionId: string,
    itemId: string,
    partial: Partial<CustomSectionItem>,
  ) => void;
  removeCustomSectionItem: (sectionId: string, itemId: string) => void;
}

export const useResumeStore = create<ResumeStore>((set) => ({
  resume: createEmptyResume(),
  isDirty: false,

  atsHighlightedSections: [],
  setAtsHighlightedSections: (sectionIds) => set({ atsHighlightedSections: sectionIds }),

  loadResume: (resume) => set({ resume, isDirty: false, atsHighlightedSections: [] }),

  resetToBlank: () => set({ resume: createEmptyResume(), isDirty: false, atsHighlightedSections: [] }),

  setTitle: (title) =>
    set((state) => ({ resume: { ...state.resume, title }, isDirty: true })),

  updateBasics: (partial) =>
    set((state) => ({
      resume: { ...state.resume, basics: { ...state.resume.basics, ...partial } },
      isDirty: true,
    })),

  updateSummary: (partial) =>
    set((state) => ({
      resume: { ...state.resume, summary: { ...state.resume.summary, ...partial } },
      isDirty: true,
    })),

  updatePicture: (partial) =>
    set((state) => ({
      resume: { ...state.resume, picture: { ...state.resume.picture, ...partial } },
      isDirty: true,
    })),

  addCustomField: () =>
    set((state) => ({
      resume: {
        ...state.resume,
        basics: {
          ...state.resume.basics,
          customFields: [
            ...state.resume.basics.customFields,
            { id: uuidv4(), icon: "", text: "", link: "" },
          ],
        },
      },
      isDirty: true,
    })),

  updateCustomField: (id, partial) =>
    set((state) => ({
      resume: {
        ...state.resume,
        basics: {
          ...state.resume.basics,
          customFields: state.resume.basics.customFields.map((f) =>
            f.id === id ? { ...f, ...partial } : f,
          ),
        },
      },
      isDirty: true,
    })),

  removeCustomField: (id) =>
    set((state) => ({
      resume: {
        ...state.resume,
        basics: {
          ...state.resume.basics,
          customFields: state.resume.basics.customFields.filter((f) => f.id !== id),
        },
      },
      isDirty: true,
    })),

  addItem: (section) =>
    set((state) => ({
      resume: {
        ...state.resume,
        sections: {
          ...state.resume.sections,
          [section]: {
            ...state.resume.sections[section],
            items: [...state.resume.sections[section].items, NEW_ITEM_FACTORY[section]()],
          },
        },
      },
      isDirty: true,
    })),

  updateItem: (section, id, partial) =>
    set((state) => ({
      resume: {
        ...state.resume,
        sections: {
          ...state.resume.sections,
          [section]: {
            ...state.resume.sections[section],
            items: (state.resume.sections[section].items as Array<{ id: string }>).map((item) =>
              item.id === id ? { ...item, ...partial } : item,
            ),
          },
        },
      },
      isDirty: true,
    })),

  removeItem: (section, id) =>
    set((state) => ({
      resume: {
        ...state.resume,
        sections: {
          ...state.resume.sections,
          [section]: {
            ...state.resume.sections[section],
            items: (state.resume.sections[section].items as Array<{ id: string }>).filter(
              (item) => item.id !== id,
            ),
          },
        },
      },
      isDirty: true,
    })),

  setColumns: (columns) =>
    set((state) => {
      const currentOrder = state.resume.metadata.layout.sectionOrder;
      // Going from 1 -> 2 columns: if every section is still bunched into
      // column 0 (either it was always 1-column, or a previous 2 -> 1 -> 2
      // round-trip collapsed it — see below), a plain clamp leaves the new
      // second column completely empty while the template's fixed-width
      // sidebar CSS still only shows column 0, so the rest of the page
      // renders blank. Recompute a real per-template split instead,
      // preserving any custom section placements.
      const needsRedistribution = columns === 2 && currentOrder.every((p) => p.column === 0);
      const sectionOrder = needsRedistribution
        ? [
            ...getDefaultSectionOrderForTemplate(state.resume.metadata.template as TemplateKey),
            ...currentOrder.filter((p) => isCustomSectionId(p.id)),
          ]
        : currentOrder.map((placement) =>
            placement.column >= columns ? { ...placement, column: columns - 1 } : placement,
          );
      return {
        resume: {
          ...state.resume,
          metadata: {
            ...state.resume.metadata,
            layout: { ...state.resume.metadata.layout, columns, sectionOrder },
          },
        },
        isDirty: true,
      };
    }),

  setSectionOrder: (order) =>
    set((state) => ({
      resume: {
        ...state.resume,
        metadata: {
          ...state.resume.metadata,
          layout: { ...state.resume.metadata.layout, sectionOrder: order },
        },
      },
      isDirty: true,
    })),

  // `targetIndex` is the position within the target column (not the flat array).
  moveSection: (sectionId, targetColumn, targetIndex) =>
    set((state) => {
      const order = state.resume.metadata.layout.sectionOrder;
      const moved = order.find((p) => p.id === sectionId);
      if (!moved) return state;

      const remaining = order.filter((p) => p.id !== sectionId);
      const columnCount = state.resume.metadata.layout.columns;
      const groups: SectionPlacement[][] = Array.from({ length: columnCount }, () => []);
      for (const placement of remaining) {
        const col = Math.min(placement.column, columnCount - 1);
        groups[col].push(placement);
      }
      const clampedIndex = Math.max(0, Math.min(targetIndex, groups[targetColumn].length));
      groups[targetColumn].splice(clampedIndex, 0, { ...moved, column: targetColumn });

      const newOrder = groups.flat();
      return {
        resume: {
          ...state.resume,
          metadata: {
            ...state.resume.metadata,
            layout: { ...state.resume.metadata.layout, sectionOrder: newOrder },
          },
        },
        isDirty: true,
      };
    }),

  setTemplate: (template) =>
    set((state) => {
      // Different templates can have different column counts/conventions
      // (e.g. which column is the sidebar) — reusing the old sectionOrder
      // as-is can leave a column empty or sections in the wrong spot for
      // the new template, the same way an unhandled columns change would
      // (see setColumns above). Recompute a matching default split,
      // preserving any custom section placements.
      const columns = DEFAULT_COLUMNS_BY_TEMPLATE[template] ?? 1;
      const customPlacements = state.resume.metadata.layout.sectionOrder.filter((p) =>
        isCustomSectionId(p.id),
      );
      const sectionOrder = [...getDefaultSectionOrderForTemplate(template), ...customPlacements];
      return {
        resume: {
          ...state.resume,
          metadata: {
            ...state.resume.metadata,
            template,
            layout: { ...state.resume.metadata.layout, columns, sectionOrder },
          },
        },
        isDirty: true,
      };
    }),

  setTheme: (theme) =>
    set((state) => ({
      resume: {
        ...state.resume,
        metadata: {
          ...state.resume.metadata,
          theme,
          design: { ...state.resume.metadata.design, colors: getThemeColors(theme) },
        },
      },
      isDirty: true,
    })),

  updateProfileSettings: (partial) =>
    set((state) => ({
      resume: {
        ...state.resume,
        metadata: {
          ...state.resume.metadata,
          profileSettings: { ...state.resume.metadata.profileSettings, ...partial },
        },
      },
      isDirty: true,
    })),

  updateTypography: (partial) =>
    set((state) => ({
      resume: {
        ...state.resume,
        metadata: {
          ...state.resume.metadata,
          typography: { ...state.resume.metadata.typography, ...partial },
        },
      },
      isDirty: true,
    })),

  addCustomSection: (title, options) =>
    set((state) => {
      const items: CustomSectionItem[] = (options?.seedItems ?? []).map((seed) => ({
        id: uuidv4(),
        hidden: false,
        title: seed.heading,
        subtitle: "",
        date: "",
        website: emptyWebsite(),
        description: plainTextToRichText(seed.description, uuidv4),
      }));
      const newSection: CustomSection = {
        id: `${CUSTOM_SECTION_PREFIX}${uuidv4()}`,
        title,
        hidden: false,
        items,
        icon: options?.icon ?? "",
        showDate: options?.showDate ?? false,
      };
      const columns = state.resume.metadata.layout.columns;
      const newPlacement: SectionPlacement = { id: newSection.id, column: columns - 1 };
      return {
        resume: {
          ...state.resume,
          customSections: [...state.resume.customSections, newSection],
          metadata: {
            ...state.resume.metadata,
            layout: {
              ...state.resume.metadata.layout,
              sectionOrder: [...state.resume.metadata.layout.sectionOrder, newPlacement],
            },
          },
        },
        isDirty: true,
      };
    }),

  removeCustomSection: (sectionId) =>
    set((state) => ({
      resume: {
        ...state.resume,
        customSections: state.resume.customSections.filter((s) => s.id !== sectionId),
        metadata: {
          ...state.resume.metadata,
          layout: {
            ...state.resume.metadata.layout,
            sectionOrder: state.resume.metadata.layout.sectionOrder.filter(
              (p) => p.id !== sectionId,
            ),
          },
        },
      },
      isDirty: true,
    })),

  updateCustomSectionTitle: (sectionId, title) =>
    set((state) => ({
      resume: {
        ...state.resume,
        customSections: state.resume.customSections.map((s) =>
          s.id === sectionId ? { ...s, title } : s,
        ),
      },
      isDirty: true,
    })),

  addCustomSectionItem: (sectionId) =>
    set((state) => ({
      resume: {
        ...state.resume,
        customSections: state.resume.customSections.map((s) =>
          s.id === sectionId
            ? {
                ...s,
                items: [
                  ...s.items,
                  {
                    id: uuidv4(),
                    hidden: false,
                    title: "",
                    subtitle: "",
                    date: "",
                    website: emptyWebsite(),
                    description: [],
                  },
                ],
              }
            : s,
        ),
      },
      isDirty: true,
    })),

  updateCustomSectionItem: (sectionId, itemId, partial) =>
    set((state) => ({
      resume: {
        ...state.resume,
        customSections: state.resume.customSections.map((s) =>
          s.id === sectionId
            ? {
                ...s,
                items: s.items.map((item) => (item.id === itemId ? { ...item, ...partial } : item)),
              }
            : s,
        ),
      },
      isDirty: true,
    })),

  removeCustomSectionItem: (sectionId, itemId) =>
    set((state) => ({
      resume: {
        ...state.resume,
        customSections: state.resume.customSections.map((s) =>
          s.id === sectionId ? { ...s, items: s.items.filter((item) => item.id !== itemId) } : s,
        ),
      },
      isDirty: true,
    })),
}));

export type { ListSectionKey };
