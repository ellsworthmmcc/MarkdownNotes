# Change Log

All notable changes to the "Notes for Markdown" extension will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/).

## [Unreleased]

## [1.0.0] - 2026-10-11

### Added

- Smart Enter for bullet lists (`-`, `*`, `+`): pressing Enter on a bullet starts the next bullet, preserving indentation and marker style.
- Pressing Enter in the middle of a bullet splits it into two bullets.
- Pressing Enter on an empty bullet removes it and starts a new line.

### Known limitations

- Bullets inside fenced code blocks are continued like any other bullet.
- Numbered lists and checkboxes are not yet supported.