import type { ComponentType, SVGProps } from "react";
import { DiamondIcon } from "@/components/icons";

/**
 * Maps a CustomSection's persisted `icon` key (see packages/resume-schema)
 * to the icon component shown next to each of its entries.
 */
export const CUSTOM_SECTION_ICON_MAP: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  diamond: DiamondIcon,
};
