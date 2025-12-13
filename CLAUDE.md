# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16 application named **realtimescribe** built with TypeScript, React 19, and Tailwind CSS v4. The project uses the ElevenLabs React SDK (`@elevenlabs/react`) for real-time audio/transcription functionality.

## Development Commands

- **Dev server**: `npm run dev` - Starts development server at http://localhost:3000
- **Build**: `npm run build` - Creates production build
- **Production server**: `npm start` - Runs production build
- **Linting**: `npm run lint` - Runs ESLint

## Architecture

### Framework & Routing
- Uses Next.js App Router (app directory structure)
- TypeScript with strict mode enabled
- JSX transform: `react-jsx` (no React import needed)

### Styling
- Tailwind CSS v4 with PostCSS integration (`@tailwindcss/postcss`)
- Custom CSS variables in `app/globals.css` for theming (`--background`, `--foreground`)
- Dark mode support via `prefers-color-scheme` media query
- Geist Sans and Geist Mono fonts loaded via `next/font/google`

### TypeScript Configuration
- Path alias: `@/*` maps to root directory
- Target: ES2017
- Module resolution: bundler
- Strict mode enabled

### Project Structure
- `app/` - Next.js App Router pages and layouts
  - `layout.tsx` - Root layout with font configuration
  - `page.tsx` - Home page component
  - `globals.css` - Global styles and Tailwind imports
- `public/` - Static assets (SVG icons)
- `next.config.ts` - Next.js configuration (minimal, TypeScript-based)
- `eslint.config.mjs` - ESLint flat config using Next.js presets
- `postcss.config.mjs` - PostCSS with Tailwind plugin

## Key Dependencies

- **@elevenlabs/react**: Real-time audio/voice integration (primary feature dependency)
- **next**: v16.0.10
- **react**: v19.2.1
- **tailwindcss**: v4 (latest major version)

## Environment

- `.env.local` exists but is gitignored (likely contains ElevenLabs API keys)
- Windows development environment (using PyCharm directory structure)
