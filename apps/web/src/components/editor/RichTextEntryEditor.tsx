"use client";

import { useEffect, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import type { RichTextEntry } from "@resume-ai/schema";
import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  BoldIcon,
  ItalicIcon,
  LinkIcon,
  UnderlineIcon,
} from "@/components/icons";
import { unwrapParagraph, wrapInParagraph } from "@/components/editor/richTextHtml";

export interface RichTextEntryEditorProps {
  entry: RichTextEntry;
  onChangeHtml: (html: string) => void;
  onFocusEntry?: () => void;
  placeholder?: string;
  /** Focuses this entry's editor as soon as it mounts (e.g. a just-added entry). */
  autoFocus?: boolean;
}

function ToolbarButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onMouseDown={(e) => e.preventDefault()} // preserve text selection when clicking the toolbar
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded ${
        active ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Inline rich-text editor for a single RichTextEntry block. Selecting text
 * reveals a bubble menu with Bold/Underline/Italic/Align/Link (matches the
 * reference design's selection toolbar).
 */
export function RichTextEntryEditor({
  entry,
  onChangeHtml,
  onFocusEntry,
  placeholder,
  autoFocus,
}: RichTextEntryEditorProps) {
  // Captured once at mount so later prop changes don't re-trigger the focus.
  const autoFocusOnMount = useRef(autoFocus);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
        heading: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        strike: false,
        hardBreak: false,
      }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      TextAlign.configure({ types: ["paragraph"] }),
      Placeholder.configure({ placeholder: placeholder ?? "Type something..." }),
    ],
    content: wrapInParagraph(entry.html),
    onUpdate: ({ editor }) => onChangeHtml(unwrapParagraph(editor.getHTML())),
    onFocus: () => onFocusEntry?.(),
    editorProps: {
      attributes: { class: "rich-text-entry text-sm text-gray-800 focus:outline-none" },
    },
    immediatelyRender: false,
  });

  // Focus a newly-added entry as soon as its editor is ready, so the user can start typing immediately.
  useEffect(() => {
    if (editor && autoFocusOnMount.current) {
      editor.commands.focus("end");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  // Sync external changes (e.g. AI Polish replacing this entry's content).
  useEffect(() => {
    if (!editor) return;
    const current = unwrapParagraph(editor.getHTML());
    if (current !== entry.html) {
      editor.commands.setContent(wrapInParagraph(entry.html), { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.html, editor]);

  if (!editor) return null;

  function setLink() {
    const previousUrl = editor!.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previousUrl ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor!.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor!.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  return (
    <>
      <BubbleMenu
        editor={editor}
        options={{ placement: "bottom", offset: 8 }}
        className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white p-1 shadow-lg"
      >
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          label="Bold"
        >
          <BoldIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          label="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          label="Italic"
        >
          <ItalicIcon className="h-4 w-4" />
        </ToolbarButton>
        <span className="mx-1 h-4 w-px bg-gray-200" />
        <ToolbarButton
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          label="Align left"
        >
          <AlignLeftIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          label="Align center"
        >
          <AlignCenterIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive({ textAlign: "justify" })}
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          label="Justify"
        >
          <AlignJustifyIcon className="h-4 w-4" />
        </ToolbarButton>
        <span className="mx-1 h-4 w-px bg-gray-200" />
        <ToolbarButton active={editor.isActive("link")} onClick={setLink} label="Link">
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
      </BubbleMenu>
      <EditorContent editor={editor} />
    </>
  );
}
