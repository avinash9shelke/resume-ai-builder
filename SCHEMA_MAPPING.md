# JSON Resume Schema Mapping Strategy

## Core Schema Reference
We adhere to the [JSON Resume Standard](https://jsonresume.org/schema/).

### 1. Mapping UI to Schema
| UI Component | Schema Field | Description |
| --- | --- | --- |
| Header / Profile | `basics` | Name, label, image, email, phone, url, summary, location |
| Work Experience | `work` | Company, position, website, startDate, endDate, summary, highlights |
| Education | `education` | Institution, area, studyType, startDate, endDate, score, courses |
| Skills List | `skills` | Name, level, keywords |
| Projects | `projects` | Name, description, highlights, keywords, startDate, endDate, url, roles, entity, type |
| Certifications | `certificates` | Name, issuer, date, url |
| Awards | `awards` | Title, awarder, date, summary |
| Languages | `languages` | Language, fluency |
| Interests | `interests` | Name, keywords |
| References | `references` | Name, reference |
| Custom Section | `customSections` | User-defined title + list of entries (heading, subheading, date, description) |

### 2. Custom Extensions (Optional)
To support the "AI Polish" and "Layout" features, we extend the schema with a separate metadata object, plus a `customSections` field for fully user-defined sections:
- `metadata.layout`: Stores column configuration (1-col vs 2-col) and section order. Section ids in `sectionOrder` are either a built-in section name (e.g. `work`) or a `custom:<uuid>` id referencing an entry in `customSections`.
- `metadata.ai_suggestions`: Temporarily stores the 5 suggestions for each section.
- `customSections[]`: Each entry has an `id` (`custom:<uuid>`), a user-given `title`, and a list of free-form `items` (heading, subheading, date, description). Not part of the core JSON Resume standard.

### 3. Validation Strategy
- **Python (Backend):** Use `pydantic` to define the schema. This ensures that any data coming from the AI or being saved to the DB is valid.
- **Next.js (Frontend):** Use `zod` to mirror the Pydantic models for client-side validation and TypeScript safety.

### 4. Transformation Logic
- **Upload -> JSON:** AI Parser extracts text -> LangGraph maps to Pydantic Model -> Serialized to JSON.
- **UI -> PDF:** Next.js state -> JSON -> Puppeteer Service -> HTML Template -> PDF.
