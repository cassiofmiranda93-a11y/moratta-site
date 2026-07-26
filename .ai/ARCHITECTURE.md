# ARCHITECTURE

# Project Stack

Framework

- Next.js (App Router)

Language

- TypeScript

Styling

- Tailwind CSS

Icons

- Lucide React

Deployment

- Vercel

Future Backend

- Firebase

Future Database

- Firestore

---

# Architecture Principles

The project follows a modular architecture.

Each module must have a single responsibility.

Avoid coupling.

Prefer composition over duplication.

---

# Folder Structure

src/

components/

features/

data/

types/

hooks/

lib/

utils/

services/

---

public/

images/

logos/

projects/

icons/

documents/

---

.ai/

Development documentation.

Never import files from this folder into the application.

---

# Data Layer

Business data must remain separated from UI.

Correct

UI
↓

Data

Incorrect

UI
↓

Hardcoded values

---

# Domain Model

Developer

↓

Development

↓

Property

Every property belongs to a development.

A development belongs to one developer.

---

# UI Layer

Pages should only orchestrate components.

Business logic should stay outside pages.

---

# Components

Small.

Reusable.

Independent.

Avoid components larger than 300 lines whenever possible.

---

# State

Prefer local state.

Introduce global state only when necessary.

Avoid unnecessary Context providers.

---

# Data Flow

Data

↓

Hooks

↓

Components

↓

Pages

Never invert this flow.

---

# Styling

Tailwind only.

No inline styles unless absolutely necessary.

Avoid duplicated utility classes.

Create reusable UI components.

---

# Images

All static assets must be placed inside

public/images

Use descriptive names.

Example

campo-belo-hero.webp

Never use spaces in filenames.

Prefer:

kebab-case

---

# Types

Every business entity must have its own TypeScript type.

Never use any.

---

# Services

External integrations must stay inside

services/

Examples

Firebase

WhatsApp

Analytics

CMS

---

# Future CMS

The website will eventually consume data from an administrative panel.

Current architecture must make this migration simple.

The UI should not depend on hardcoded data.

---

# Error Handling

Fail gracefully.

Never crash the UI because of missing optional data.

---

# Performance

Lazy load when appropriate.

Optimize images.

Avoid unnecessary re-renders.

Keep bundles small.

---

# Accessibility

Semantic HTML.

Keyboard navigation.

Alt text for images.

Visible focus states.

---

# SEO

Each page must contain:

Title

Description

Open Graph

Twitter metadata

Structured data whenever applicable.

---

# Testing Philosophy

The project should remain testable.

Avoid tightly coupled components.

Prefer pure functions.

---

# Golden Rule

Every architectural decision must improve one or more of these:

Maintainability

Scalability

Readability

Developer Experience

Performance