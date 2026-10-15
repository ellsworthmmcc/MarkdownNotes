# Notes in Markdown

Small quality-of-life improvements for writing Markdown in VS Code.

## Features

**Smart Enter for bullet lists**

- Press Enter on a bullet (`-`, `*`, or `+`) to start the next bullet automatically. Indentation and marker style are preserved.
- Press Enter in the middle of a bullet to split it into two bullets.
- Press Enter on an empty bullet to remove it and end the list.

Each behavior can be turned off individually in the settings below.

**Smart Tab for bullet lists**

- Press Tab anywhere inside a bullet to indent the whole line using your editor's indent settings (`editor.tabSize`, `editor.insertSpaces`), instead of inserting a tab in place.

## Settings

Open Settings (`Ctrl+,`), search for `Notes in Markdown`, or add these to your `settings.json`. All are enabled by default.

| Setting | Description |
| --- | --- |
| `notesInMarkdown.bullets.continueOnEnter` | Pressing Enter at the end of a bullet starts the next bullet. |
| `notesInMarkdown.bullets.splitOnEnter` | Pressing Enter in the middle of a bullet splits it into two bullets. |
| `notesInMarkdown.bullets.removeEmptyOnEnter` | Pressing Enter on an empty bullet removes it and ends the list. |
| `notesInMarkdown.bullets.indentOnTab` | Pressing Tab inside a bullet indents the whole line using your editor's indent settings. |

When a behavior is turned off, Enter inserts a plain newline instead. For example, with `splitOnEnter` off, pressing Enter mid-bullet leaves the remaining text on the new line without a bullet marker.

Changes take effect immediately, with no reload needed.

## Requirements

VS Code 1.85.0 or newer.

## Known limitations

- Bullets inside fenced code blocks are continued like any other bullet.
- Numbered lists and checkboxes are not yet supported.

## License

[MIT](LICENSE)