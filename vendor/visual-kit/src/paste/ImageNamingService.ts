export function safeName(name: string): string {
  return (
    name
      .split("")
      .map((character) =>
        character.charCodeAt(0) < 32 || '<>:"/\\|?*[]#^'.includes(character)
          ? "-"
          : character,
      )
      .join("")
      .replace(/[. ]+$/g, "")
      .slice(0, 120) || "image"
  );
}
export function imageName(
  template: string,
  note: string,
  counter: number,
  extension: string,
  now = new Date(),
): string {
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return (
    safeName(
      template
        .replaceAll("{note}", safeName(note))
        .replaceAll("{date}", date)
        .replaceAll("{counter}", String(counter).padStart(2, "0")),
    ) +
    "." +
    extension
  );
}
export function imageFolder(
  template: string,
  note: string,
  parent: string,
): string {
  const folder =
    template === "same-folder"
      ? parent
      : template.replaceAll("{note}", safeName(note));
  if (/^[/\\]|^[A-Za-z]:|(?:^|[/\\])\.\.(?:[/\\]|$)/.test(folder))
    throw new Error("Image folder must be relative to the vault.");
  return folder.replaceAll("\\", "/").replace(/^\/+|\/+$/g, "");
}
