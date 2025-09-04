# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Adobe Illustrator CEP (Common Extensibility Platform) extension built with Bolt CEP, featuring React, TypeScript, and Vite. The extension appears to be focused on auto-save functionality for Illustrator documents.

## Development Commands

- `yarn dev` - Start development server with Hot Module Replacement (HMR) at localhost:3000
- `yarn build` - Build the extension for development (creates symlink to extensions folder)
- `yarn watch` - Build and watch for changes
- `yarn zxp` - Package extension as ZXP for distribution
- `yarn zip` - Package ZXP and assets into zip archive
- `yarn serve` - Preview built extension
- `yarn symlink` - Create symlink to Adobe extensions folder
- `yarn delsymlink` - Remove symlink

## Linting and Formatting

- Uses Biome for both linting and formatting
- Configuration in `biome.json` with recommended rules enabled
- No specific lint/format commands defined in package.json

## Architecture

### Directory Structure
- `src/js/` - React frontend code (CEP JavaScript layer)
  - `main/` - Main panel implementation with React components
  - `lib/` - Utility functions and CEP interfaces
- `src/jsx/` - ExtendScript code (Adobe application scripting layer)
  - `ilst/` - Illustrator-specific ExtendScript functions
- `src/shared/` - Shared types and utilities between JS and JSX layers

### Key Components
- **CEP Panel**: React-based UI built with `src/js/main/main.tsx`
- **ExtendScript Bridge**: Type-safe communication between React and Illustrator via `evalTS()` function
- **Host Integration**: Configured for Adobe Illustrator (ILST) in `cep.config.ts`

### Communication Pattern
- Use `evalTS()` for type-safe ExtendScript calls from React
- ExtendScript functions exported from `src/jsx/ilst/ilst.ts`
- Events can be dispatched using `dispatchTS()` and listened to with `listenTS()`

## Build System

- **Vite** for frontend bundling with React and TailwindCSS
- **TypeScript** compilation with strict settings
- **ExtendScript** bundled separately to ES3 compatibility
- Source maps enabled for development builds

## Configuration Files

- `cep.config.ts` - CEP extension configuration (panels, host apps, icons)
- `vite.config.ts` - Main Vite configuration for React build
- `vite.es.config.ts` - ExtendScript build configuration
- `biome.json` - Linting and formatting rules
- `tsconfig.json` - TypeScript compiler options

## Development Notes

- CEP extensions require PlayerDebugMode enabled in Adobe apps for development
- Extension targets Adobe Illustrator with manifest version 6.0
- Uses modern React patterns with hooks and TypeScript
- TailwindCSS for styling with adaptive background color support