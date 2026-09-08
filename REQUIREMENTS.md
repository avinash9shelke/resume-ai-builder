# Requirement Specification: ResumeCraft.ai

## Project Overview
ResumeCraft.ai is a platform that leverages AI to help users create, polish, and customize their resumes. It follows the JSON Resume Schema standard and uses a modern microservices architecture.

## Technology Stack
- **Frontend:** Next.js (Micro-frontend ready), Tailwind CSS, dnd-kit.
- **Backend:** Python (FastAPI/Flask), Pydantic for data validation.
- **AI Orchestration:** LangChain, LangGraph.
- **PDF Generation:** Puppeteer (Node.js service).
- **Data Format:** JSON Resume Schema (https://rxresu.me/schema.json).

---

## Feature Requirements

### 1. Resume Upload and Parsing
- **Goal:** Allow users to upload existing resumes (PDF/DOCX) and map the content to editable UI components.
- **Requirements:**
    - Support for PDF and DOCX file uploads.
    - AI-powered parsing (using LangChain/LangGraph) to extract information.
    - Mapping extracted data to the `json-resume-schema`.
    - Handle edge cases where parsing might be incomplete (fallback to manual entry).
- **Technical Detail:** Use a Python-based parser that feeds text into an LLM to structure it into JSON.

### 2. Create Resume from Scratch
- **Goal:** Provide a step-by-step or modular interface to build a resume.
- **Requirements:**
    - Editable list of sections: Basics, Work, Education, Skills, Projects, Languages, Interests, References.
    - Real-time preview of the resume as the user types.
    - Form validation using Pydantic on the backend and Zod/Formik on the frontend.

### 3. AI Polish Section
- **Goal:** Enhance resume content using AI suggestions.
- **Requirements:**
    - "AI Polish" button available for every text-heavy section (Summary, Work Experience, Projects).
    - Provide 5 distinct suggestions for each polish request.
    - User can:
        - Preview the suggestion.
        - Replace current content with a suggestion.
        - Discard suggestions.
- **Technical Detail:** Implement using LangGraph to manage the workflow of generating and refining suggestions.

### 4. Photo Management
- **Goal:** Allow users to add a professional photo to their resume.
- **Requirements:**
    - Upload functionality for common image formats (JPG, PNG).
    - Basic image cropping and resizing tool.
    - Option to show/hide the photo in the final layout.

### 5. Layout and Drag-and-Drop (DnD)
- **Goal:** Flexible resume customization.
- **Requirements:**
    - Use `dnd-kit` library for reordering sections.
    - Switch between 1-column and 2-column layouts.
    - Drag sections between columns in 2-column mode.
    - Sections should snap to a grid/container.

### 6. PDF Export
- **Goal:** High-fidelity resume download.
- **Requirements:**
    - Extract UI component content back into the `json-resume-schema` format.
    - Use Puppeteer to render a hidden HTML template and print it to PDF.
    - Ensure styling (fonts, spacing) is preserved in the PDF.
- **Technical Detail:** A dedicated Node.js microservice for Puppeteer to handle high-load PDF rendering.

### 7. Home Screen
- **Goal:** Landing page to showcase product capabilities.
- **Requirements:**
    - Hero section with clear CTA.
    - Feature highlights: Resume Builder, AI Polish, Templates, AI Assistance.
    - User dashboard to manage multiple resumes.

### 8. Data Architecture (JSON Resume Schema)
- **Goal:** Standardized data interchange.
- **Requirements:**
    - All internal data storage must follow the `json-resume-schema`.
    - Refer to:
        - [Schema JSON](https://rxresu.me/schema.json)
        - [Docs](https://docs.rxresu.me/guides/json-resume-schema)

### 9. Microservice & Micro-frontend Architecture
- **Goal:** Scalability and independent deployment.
- **Requirements:**
    - **Frontend:** Next.js application structured to support Module Federation if needed.
    - **API Gateway:** To route requests between frontend and various backends.
    - **AI Service:** Python service handling LangGraph/LangChain logic.
    - **PDF Service:** Node.js service for Puppeteer rendering.
    - **Auth Service:** (Optional) for user management.
