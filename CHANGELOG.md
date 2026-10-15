# Change Log

All notable changes to the "notes-in-markdown" extension will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/).

## [Unreleased]

### Changed

- An invalid value for one setting now only affects that setting, which falls back to its default. Previously it disabled all Smart Enter and Smart Tab behavior.

### Added

- Pressing Tab inside a bullet indents the whole line using the editor's indent settings. Can be turned off with `notesInMarkdown.bullets.indentOnTab`.

## [1.1.0] - 2026-10-12

### Added

- Settings to turn each Smart Enter behavior on or off individually:
  - `notesInMarkdown.bullets.continueOnEnter`
  - `notesInMarkdown.bullets.splitOnEnter`
  - `notesInMarkdown.bullets.removeEmptyOnEnter`

### Changed

- If a setting has an invalid value, Smart Enter falls back to a normal Enter instead of failing.

## [1.0.0] - 2026-10-11

### Added

- Smart Enter for bullet lists (`-`, `*`, `+`): pressing Enter on a bullet starts the next bullet, preserving indentation and marker style.
- Pressing Enter in the middle of a bullet splits it into two bullets.
- Pressing Enter on an empty bullet removes it and starts a new line.

### Known limitations

- Bullets inside fenced code blocks are continued like any other bullet.
- Numbered lists and checkboxes are not yet supported.