# Echo — Feature: Branding System

## Summary

Echo must keep product naming, browser metadata, installed-app naming, and icon assets consistent across the web app, Safari saved-app mode, and MCP integration surfaces.

## Requirements

- The app name shown in user-facing chrome must be `Echo`.
- Browser metadata must expose:
  - document title based on `Echo`
  - application name `Echo`
  - Apple web app title `Echo`
  - manifest metadata for standalone install
  - Safari mask icon metadata
- The app must provide:
  - favicon `.ico`
  - favicon `.svg`
  - 16x16 and 32x32 PNG favicons
  - a square Apple/install icon generated from the canonical source artwork
  - 192 and 512 install icons
  - Safari pinned tab icon
- The repository may keep a wider source-artwork handoff file for branding reference, but runtime metadata must point to the generated square app/install assets.
- MCP surfaces must identify the product as `Echo`.
- Brand-facing strings should be driven from one central configuration source instead of duplicated ad hoc across the app.

## Non-Goals

- This feature does not redesign the overall product UI.
- This feature does not change scheduling, review, or note behavior.

## Acceptance Criteria

- [ ] `/login` renders the Echo name and mark.
- [ ] Navigation renders the Echo name and mark.
- [ ] HTML metadata includes `Echo` for application and Apple web app naming.
- [ ] Manifest output uses Echo naming and generated install icons.
- [ ] Safari mask icon is present.
- [ ] MCP server name and MCP connection copy use Echo branding.
- [ ] Future brand updates can be performed by editing one central config plus brand mark assets, without hunting duplicated strings through multiple app files.
