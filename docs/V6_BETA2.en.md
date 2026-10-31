# Basic AI Tool for Writers 6.0.0-beta.2

**Experimental prerelease · Desktop and Android · Not stable 6.0.0.** The main branch and current stable release remain **5.2.0**.

This update fixes mobile cursor scroll restoration and introduces BookNav/Note Chain-inspired hierarchical navigation for Longform projects. The six tool families from beta.1 remain included.

## Remember Cursor Position: improved Android scrolling

On note open, the plugin now waits for the editor, restores the saved caret/selection and sends a **CodeMirror 6 scrollIntoView** effect to center the remembered line. It performs an additional scroll request after mobile layout changes settle. A second restore opportunity occurs when a Markdown leaf becomes active (the Obsidian mobile editor may mount after the file-open event).

The plugin respects an explicit heading/search anchor or a user gesture that moved the caret before restoration. Bookmarks and scroll positions remain stored only in the existing local note history.

Please manually verify on a real Android device: place the cursor near the end of a long note, switch to another note and back, then repeat after switching application tabs.

## Longform navigation: chapters and subchapters

The new implementation follows the **actual order and nesting of the Longform index**. It borrows the navigation ideas of BookNav and Note Chain without copying either plugin's code, compiled bundle or CSS.

Depending on the current scene, a navigation block can show four separate choices: **Previous chapter**, **Next chapter**, **Previous subchapter** and **Next subchapter**. In subchapters, the chapter-back button targets the parent chapter, while subchapter buttons follow siblings of the same hierarchy depth. A main chapter can also link to the first child subchapter or to the previous chapter's last child. Links to missing files are not generated.

Insert the block using the command **Longform: insert chapter navigation**, or add the following fenced Markdown block in an existing scene (and optionally in your Longform scene template):

````markdown
~~~longform-nav
~~~
````

The fenced processor renders the buttons in Obsidian's Reading/Live Preview modes. Settings are grouped under **Longform → Longform navigation**. You can independently disable the whole feature or hide main/subchapter buttons.

### Scope and safety

- Only real Markdown files linked from the Longform project index are eligible.
- No changes to scene order, file names, scene text or plugin database are performed by navigation.
- No automatic insertion into all existing chapters; explicitly place the fenced block or use a scene template.
- Does not claim to synchronize with Note Chain's independent file-explorer ordering if it differs from the Longform index.
- The original BookNav and Note Chain uploads are behavioral references, not code dependencies.

## Translation, verification and installation

All settings, labels, commands and notices are provided in **English and Brazilian Portuguese**. Automated regression tests cover hierarchy traversal, ordering, missing files, module toggles and mobile CodeMirror scrolling; manual verification in Obsidian desktop and Android is still necessary.

Download **Basic-AI-Tool-for-Writers-6.0.0-beta.2.zip**, back up your vault, and replace \`main.js\`, \`manifest.json\` and \`styles.css\` under \`.obsidian/plugins/basic-ai-tool-for-writers/\`. Keep your current \`data.json\` unchanged.

This release uses the prerelease tag **6.0.0-beta.2** (without a \`v\` prefix). Stable **6.0.0 has not been published**.

[Notas em português](V6_BETA2.pt-BR.md) · [Earlier v6 implementation overview](V6-IMPLEMENTATION.en.md).
