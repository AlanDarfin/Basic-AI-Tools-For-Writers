import type { Settings } from "./settings";

export const settingDescriptions: Record<keyof Settings, string> = {
  htmlNotes:
    "Create and edit real HTML files. Reload Visual Kit after changing this setting. Markdown editing is unchanged.",
  htmlRegisterExtensions:
    "Register .html and .htm with this editor. Reload after changing. Other plugins' existing handlers are kept; Open in HTML notes remains available from the file menu.",
  htmlDefaultMode:
    "Open in Visual, Source or Preview. Documents with unsupported markup open in Source to prevent silent data loss.",
  htmlFolder:
    "Vault-relative folder for new HTML notes. Empty uses the active file's folder. The file explorer context menu uses the selected folder.",
  htmlImportImages:
    "Save pasted images in the existing image folder, with validation and duplicate detection. Disabled keeps original references and shows warnings.",
  htmlExternalImages:
    "Download public HTTP/HTTPS images only when pasting, importing or copying. Opening a note never contacts image servers. Browser login cookies are not available; paste private image files instead.",
  htmlClipboardCompatibility:
    "Opt in to existing destination typography options and PNG rasterization at displayed dimensions. Off preserves HTML note typography. Destination editors may still filter formatting or images.",
  copyMode:
    "Dedicated: use Copy with images only. Smart: also intercept Ctrl/Cmd+C for selections containing images. Always: intercept every nonempty editor selection.",
  preserveFormatting:
    "Keep emphasis, links, and document structure where supported. Turn off to remove emphasis. Compatibility mode also flattens headings and code typography.",
  preserveResize:
    "Use dimensions written in image embeds. Image-size normalization overrides their width. Without either option, use natural dimensions.",
  movidesk:
    "Use inline text to inherit the destination style and rasterize images as PNG at their copied size. Animation is flattened. The destination must accept embedded images; this does not upload attachments to Movidesk.",
  copyFontFamily:
    "Optional destination font, such as Arial. Leave empty to inherit the style at the paste cursor. Use this if the destination resets pasted text.",
  copyFontSize:
    "Optional destination text size in pixels (8–72). Leave empty to inherit. Example: 12 pt equals 16 px.",
  copyTextColor:
    "Optional destination text color as #RRGGBB. Leave empty to inherit. Set this to match your macro when automatic inheritance is insufficient.",
  color:
    "Starting annotation color. Changing the editor's color picker updates this preference.",
  lineWidth:
    "Starting stroke thickness for annotation tools, in pixels (1–100).",
  fontSize:
    "Starting annotation text size, in pixels (8–300). This does not change ticket text.",
  saveMode:
    "Default for Save & Copy and the editor save shortcut. Replace asks for confirmation; custom copy asks for a filename.",
  annotationFolder:
    "Vault-relative folder for annotated images. Empty saves beside the source. Supports {note}; paths outside the vault are rejected.",
  editable:
    "Save a JSON sidecar so annotations can be reopened and edited. PNG exports remain flattened and usable without the sidecar.",
  width:
    "Width in pixels (1–16384) used by normalization and optional paste sizing. Compatibility copy also enforces a 32 megapixel limit.",
  preserveHeight:
    "Keep explicit embed heights during normalization. This can change the image's aspect ratio; leave off to scale proportionally.",
  normalizeCopy:
    "Apply the default width to copied images without changing the note. Overrides each embed's width.",
  ribbon:
    "Show a ribbon button that opens the image-size normalization dialog.",
  multiPaste:
    "Handle batches of image files and HTML containing images. Remote HTML images may be downloaded; private browser-only images cannot be imported.",
  pasteWidth:
    "Add the default width to newly pasted embeds. Does not resize the stored image bytes.",
  blankLines:
    "Separate file-batch images with a blank line. HTML paste keeps the source text and image order instead.",
  naming:
    "Filename template for pasted images. Supported placeholders: {note}, {date}, {counter}. An extension is added automatically.",
  folder:
    "Vault-relative folder for pasted images. Use attachments, images, attachments/{note}, same-folder, or a custom path.",
  duplicates:
    "Hash pasted image bytes and reuse identical vault images according to the action below. May scan vault image files.",
  duplicateAction:
    "Reuse an existing match, ask which match to use, or always save a separate file. Only applies when duplicate detection is enabled.",
  persistIndex:
    "Save the hash cache between sessions. Disabling removes it from saved plugin data but keeps the current session's cache.",
  autoMarkers:
    "Increment numbered annotation markers after each placement. Off repeats the current marker number.",
  quickTools:
    "Show Mark error, Add arrow, Add rectangle, and Add number in image context menus.",
};
