"use client";

import { useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { v4 as uuidv4 } from "uuid";
import { richTextToPlainText, plainTextToRichText } from "@resume-ai/schema";
import { Button } from "@resume-ai/ui-core";
import { useResumeStore } from "@/lib/store";
import { getCroppedImageDataUrl } from "@/lib/cropImage";
import { AiPolishButton } from "@/components/editor/AiPolishButton";
import { InlineTextInput } from "@/components/editor/InlineTextInput";
import { RichTextField } from "@/components/editor/RichTextField";
import { SectionCardChrome } from "@/components/editor/SectionCardChrome";
import { ToggleSwitch } from "@/components/editor/ToggleSwitch";
import {
  AtSignIcon,
  CameraIcon,
  LinkIcon,
  MapPinIcon,
  PhoneIcon,
  PlusIcon,
  SettingsIcon,
  TagIcon,
  TrashIcon,
} from "@/components/icons";

const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png"];

/**
 * WYSIWYG-style Basics/Profile card: click directly on the name, headline,
 * contact details, or photo to edit them in place, with floating photo /
 * settings actions above the card (design reference: user-provided screenshots).
 * The gear icon opens a menu of field-visibility toggles + photo style,
 * matching the reference design.
 */
export function ProfileCard() {
  const basics = useResumeStore((s) => s.resume.basics);
  const summary = useResumeStore((s) => s.resume.summary);
  const picture = useResumeStore((s) => s.resume.picture);
  const settings = useResumeStore((s) => s.resume.metadata.profileSettings);
  const updateBasics = useResumeStore((s) => s.updateBasics);
  const updateSummary = useResumeStore((s) => s.updateSummary);
  const updatePicture = useResumeStore((s) => s.updatePicture);
  const updateProfileSettings = useResumeStore((s) => s.updateProfileSettings);
  const addCustomField = useResumeStore((s) => s.addCustomField);
  const updateCustomField = useResumeStore((s) => s.updateCustomField);
  const removeCustomField = useResumeStore((s) => s.removeCustomField);
  const atsHighlightedSections = useResumeStore((s) => s.atsHighlightedSections);
  const basicsFlagged = atsHighlightedSections.includes("basics");
  const summaryFlagged = atsHighlightedSections.includes("summary");

  // --- Photo upload + crop ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draftSrc, setDraftSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
      setPhotoError("Please upload a JPG or PNG image.");
      return;
    }
    setPhotoError(null);
    const reader = new FileReader();
    reader.onload = () => setDraftSrc(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSaveCrop() {
    if (!draftSrc || !croppedAreaPixels) return;
    const dataUrl = await getCroppedImageDataUrl(draftSrc, croppedAreaPixels);
    updatePicture({ url: dataUrl, hidden: false });
    setDraftSrc(null);
  }

  // --- Settings menu (gear icon) ---
  const [settingsOpen, setSettingsOpen] = useState(false);

  const photoShapeClass = settings.photoStyle === "square" ? "rounded-lg" : "rounded-full";

  return (
    <SectionCardChrome
      actions={[
        { icon: <CameraIcon className="h-4 w-4" />, label: "Upload photo", onClick: () => fileInputRef.current?.click() },
        { icon: <SettingsIcon className="h-4 w-4" />, label: "Section settings", onClick: () => setSettingsOpen((v) => !v) },
      ]}
      menu={
        settingsOpen && (
          <>
            {/*
              Full-viewport backdrop: closes the menu on any outside click
              *without* letting that click fall through to whatever card
              field happens to be underneath it (e.g. a field the user just
              toggled visible) — a plain click-outside listener would let
              the same click both close the menu and interact with the field
              beneath it, since they can occupy the same screen position.
            */}
            <div className="fixed inset-0 z-10" onClick={() => setSettingsOpen(false)} />
            <div className="absolute left-1/2 top-11 z-20 w-64 -translate-x-1/2 divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
            <div className="pb-1">
              <ToggleSwitch
                label="Headline"
                checked={settings.showHeadline}
                onChange={(v) => updateProfileSettings({ showHeadline: v })}
              />
              <ToggleSwitch
                label="Phone"
                checked={settings.showPhone}
                onChange={(v) => updateProfileSettings({ showPhone: v })}
              />
              <ToggleSwitch
                label="Website"
                checked={settings.showWebsite}
                onChange={(v) => updateProfileSettings({ showWebsite: v })}
              />
              <ToggleSwitch
                label="Email"
                checked={settings.showEmail}
                onChange={(v) => updateProfileSettings({ showEmail: v })}
              />
              <ToggleSwitch
                label="Location"
                checked={settings.showLocation}
                onChange={(v) => updateProfileSettings({ showLocation: v })}
              />
              <ToggleSwitch
                label="Uppercase name"
                checked={settings.uppercaseName}
                onChange={(v) => updateProfileSettings({ uppercaseName: v })}
              />
              <ToggleSwitch
                label="Photo"
                checked={!picture.hidden}
                onChange={(v) => updatePicture({ hidden: !v })}
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-gray-700">Photo Style</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Circle photo"
                  onClick={() => updateProfileSettings({ photoStyle: "circle" })}
                  className={`h-5 w-5 rounded-full border-2 ${
                    settings.photoStyle === "circle" ? "border-emerald-500 bg-emerald-500" : "border-gray-300"
                  }`}
                />
                <button
                  type="button"
                  aria-label="Square photo"
                  onClick={() => updateProfileSettings({ photoStyle: "square" })}
                  className={`h-5 w-5 rounded-md border-2 ${
                    settings.photoStyle === "square" ? "border-emerald-500 bg-emerald-500" : "border-gray-300"
                  }`}
                />
              </div>
            </div>
            </div>
          </>
        )
      }
    >
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleFileChange} />
      {photoError && <p className="mb-2 text-xs text-red-600">{photoError}</p>}

      <div
        id="section-basics"
        className={`flex items-start justify-between gap-6 ${
          basicsFlagged ? "rounded-lg bg-amber-50 p-3 ring-2 ring-amber-300" : ""
        }`}
      >
        <div className="min-w-0 flex-1">
          <InlineTextInput
            value={basics.name}
            placeholder="Your Name"
            onChange={(e) => updateBasics({ name: e.target.value })}
            className={`w-full text-3xl font-extrabold text-purple-900 ${settings.uppercaseName ? "uppercase" : ""}`}
          />
          {settings.showHeadline && (
            <InlineTextInput
              value={basics.headline}
              placeholder="🚀 Your headline, e.g. Staff Software Engineer"
              onChange={(e) => updateBasics({ headline: e.target.value })}
              className="mt-1 w-full text-base font-medium text-pink-600"
            />
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-gray-600">
            {settings.showEmail && (
              <div className="flex items-center gap-1.5">
                <AtSignIcon className="h-4 w-4 shrink-0 text-gray-400" />
                <InlineTextInput
                  autoWidth
                  type="email"
                  value={basics.email}
                  placeholder="email@example.com"
                  onChange={(e) => updateBasics({ email: e.target.value })}
                />
              </div>
            )}

            {settings.showPhone && (
              <div className="flex items-center gap-1.5">
                <PhoneIcon className="h-4 w-4 shrink-0 text-gray-400" />
                <InlineTextInput
                  autoWidth
                  value={basics.phone}
                  placeholder="Phone number"
                  onChange={(e) => updateBasics({ phone: e.target.value })}
                />
              </div>
            )}

            {settings.showWebsite && (
              <div className="flex items-center gap-1.5">
                <LinkIcon className="h-4 w-4 shrink-0 text-gray-400" />
                <InlineTextInput
                  autoWidth
                  value={basics.website.url}
                  placeholder="yourwebsite.com"
                  onChange={(e) => updateBasics({ website: { ...basics.website, url: e.target.value } })}
                />
              </div>
            )}

            {settings.showLocation && (
              <div className="flex items-center gap-1.5">
                <MapPinIcon className="h-4 w-4 shrink-0 text-gray-400" />
                <InlineTextInput
                  autoWidth
                  value={basics.location}
                  placeholder="City, Country"
                  onChange={(e) => updateBasics({ location: e.target.value })}
                />
              </div>
            )}

            {basics.customFields.map((field) => (
              <div key={field.id} className="group flex items-center gap-1.5">
                <TagIcon className="h-4 w-4 shrink-0 text-gray-400" />
                <InlineTextInput
                  autoWidth
                  value={field.text}
                  placeholder="Custom field"
                  onChange={(e) => updateCustomField(field.id, { text: e.target.value })}
                />
                <button
                  type="button"
                  aria-label="Remove custom field"
                  onClick={() => removeCustomField(field.id)}
                  className="hidden text-gray-300 hover:text-red-500 group-hover:inline"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              aria-label="Add custom field"
              title="Add custom field"
              onClick={addCustomField}
              className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500"
            >
              <PlusIcon className="h-3 w-3" />
            </button>
          </div>
        </div>

        {!picture.hidden && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`group relative h-20 w-20 shrink-0 overflow-hidden bg-gray-100 ring-2 ring-white ${photoShapeClass}`}
            aria-label="Change profile photo"
          >
            {picture.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={picture.url} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xs text-gray-400">Add photo</span>
            )}
            <span className="absolute inset-0 hidden items-center justify-center bg-black/30 group-hover:flex">
              <CameraIcon className="h-5 w-5 text-white" />
            </span>
          </button>
        )}
      </div>

      <div
        id="section-summary"
        className={`mt-4 ${summaryFlagged ? "rounded-lg bg-amber-50 p-3 ring-2 ring-amber-300" : ""}`}
      >
        <div className="mb-1 flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wide text-gray-400">Summary</label>
          <AiPolishButton
            target="summary"
            text={richTextToPlainText(summary.content)}
            context={{ name: basics.name, headline: basics.headline }}
            // Unlike Experience/Project bullet descriptions (where "Use this"
            // appends a new set of bullets alongside the existing ones), each
            // Summary suggestion is a complete rewrite of the whole paragraph
            // — appending it after the original would just leave two
            // overlapping, redundant paragraphs instead of an improvement.
            onReplace={(text) => updateSummary({ content: plainTextToRichText(text, uuidv4) })}
          />
        </div>
        <RichTextField
          entries={summary.content}
          onChange={(content) => updateSummary({ content })}
          placeholder="A brief professional summary..."
        />
      </div>

      {draftSrc && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Crop your photo</h3>
            <div className="relative h-72 w-full bg-gray-900">
              <Cropper
                image={draftSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape={settings.photoStyle === "square" ? "rect" : "round"}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_area, areaPixels) => setCroppedAreaPixels(areaPixels)}
              />
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="mt-3 w-full"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDraftSrc(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveCrop}>
                Save photo
              </Button>
            </div>
          </div>
        </div>
      )}
    </SectionCardChrome>
  );
}
