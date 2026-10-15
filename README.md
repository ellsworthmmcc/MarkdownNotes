# Notes in Markdown

Small quality-of-life improvements for writing Markdown in VS Code.

## Features

**Smart Enter for bullet lists**

- Press Enter on a bullet (`-`, `*`, or `+`) to start the next bullet automatically. Indentation and marker style are preserved.
- Press Enter in the middle of a bullet to split it into two bullets.
- Press Enter on an empty bullet to remove it and end the list.

**Smart Tab for bullet lists**

- Press Tab anywhere inside a bullet to indent the whole line using your editor's indent settings (`editor.tabSize`, `editor.insertSpaces`), instead of inserting a tab in place.

**Smart Shift+Tab for bullet lists**

- Press Shift+Tab on an indented bullet to outdent it as usual.
- Press Shift+Tab on a bullet with no indentation to remove the bullet marker and keep the text (`- hello` becomes `hello`).

Each behavior can be turned off individually in the settings below.

## Settings

Open Settings (`Ctrl+,`), search for `Notes in Markdown`, or add these to your `settings.json`. All are enabled by default.

| Setting | Description |
| --- | --- |
| `notesInMarkdown.bullets.continueOnEnter` | Pressing Enter at the end of a bullet starts the next bullet. |
| `notesInMarkdown.bullets.splitOnEnter` | Pressing Enter in the middle of a bullet splits it into two bullets. |
| `notesInMarkdown.bullets.removeEmptyOnEnter` | Pressing Enter on an empty bullet removes it and ends the list. |
| `notesInMarkdown.bullets.indentOnTab` | Pressing Tab inside a bullet indents the whole line using your editor's indent settings. |
| `notesInMarkdown.bullets.removeOnShiftTab` | Pressing Shift+Tab on a bullet that has no indentation removes the bullet marker and keeps the text. |

When a behavior is turned off, the key does what it normally does. For example, with `splitOnEnter` off, pressing Enter mid-bullet leaves the remaining text on the new line without a bullet marker, and with `indentOnTab` off, Tab inserts a tab at the cursor.

If a setting has an invalid value (anything other than `true` or `false`), you get a warning and that setting uses its default. The other settings are not affected.

Changes take effect immediately, with no reload needed.

## Requirements

VS Code 1.85.0 or newer.

## Known limitations

- Bullets inside fenced code blocks are continued like any other bullet.
- Numbered lists and checkboxes are not yet supported.

## License

[MIT](LICENSE)