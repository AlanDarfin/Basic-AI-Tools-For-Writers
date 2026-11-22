export interface Settings {
  htmlNotes: boolean;
  htmlRegisterExtensions: boolean;
  htmlDefaultMode: "visual" | "source" | "preview";
  htmlFolder: string;
  htmlImportImages: boolean;
  htmlExternalImages: "block" | "download";
  htmlClipboardCompatibility: boolean;
  copyMode: "dedicated" | "smart" | "always";
  preserveFormatting: boolean;
  preserveResize: boolean;
  movidesk: boolean;
  copyFontFamily: string;
  copyFontSize: string;
  copyTextColor: string;
  color: string;
  lineWidth: number;
  fontSize: number;
  saveMode: "new" | "replace" | "copy";
  annotationFolder: string;
  editable: boolean;
  width: number;
  preserveHeight: boolean;
  normalizeCopy: boolean;
  ribbon: boolean;
  multiPaste: boolean;
  pasteWidth: boolean;
  blankLines: boolean;
  naming: string;
  folder: string;
  duplicates: boolean;
  duplicateAction: "reuse" | "ask" | "save";
  persistIndex: boolean;
  autoMarkers: boolean;
  quickTools: boolean;
}
export const defaults: Settings = {
  htmlNotes: true,
  htmlRegisterExtensions: false,
  htmlDefaultMode: "visual",
  htmlFolder: "",
  htmlImportImages: true,
  htmlExternalImages: "block",
  htmlClipboardCompatibility: false,
  copyMode: "dedicated",
  preserveFormatting: true,
  preserveResize: true,
  movidesk: true,
  copyFontFamily: "",
  copyFontSize: "",
  copyTextColor: "",
  color: "#ef4444",
  lineWidth: 4,
  fontSize: 28,
  saveMode: "new",
  annotationFolder: "",
  editable: true,
  width: 600,
  preserveHeight: false,
  normalizeCopy: false,
  ribbon: false,
  multiPaste: true,
  pasteWidth: false,
  blankLines: true,
  naming: "{note}-{date}-{counter}",
  folder: "attachments",
  duplicates: true,
  duplicateAction: "reuse",
  persistIndex: true,
  autoMarkers: true,
  quickTools: true,
};
