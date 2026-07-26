# Moratta AI Documentation

Welcome.

This project is designed to be developed collaboratively with AI coding agents.

Before writing or modifying any code, you MUST read the documentation inside the `.ai` directory.

---

# Reading Order

Always read the files in the following order:

1. BUSINESS.md
2. ARCHITECTURE.md
3. CODING_STANDARDS.md
4. DECISIONS.md
5. UI_GUIDE.md
6. ROADMAP.md
7. TASKS.md

PROMPTS.md is a reference library and may be consulted whenever useful.

---

# Project Goal

The current objective is to build the Moratta website.

This website is the foundation of a larger platform that will later include:

- CMS
- CRM
- Customer Portal
- Analytics
- Atlas AI
- WhatsApp integrations

Every implementation should preserve this long-term vision.

---

# Core Principles

Always prioritize:

- Clean architecture
- Readable code
- Maintainability
- Type safety
- Accessibility
- SEO
- Performance
- Reusability

---

# Business Rules

Business rules are defined exclusively in:

BUSINESS.md

Do not invent or modify business rules.

---

# Architecture

Project architecture is defined in:

ARCHITECTURE.md

Respect the existing structure.

Avoid unnecessary changes.

---

# Coding Rules

All code must follow:

CODING_STANDARDS.md

These standards are mandatory.

---

# Approved Decisions

All architectural and product decisions are documented in:

DECISIONS.md

Never override them without explicit authorization.

---

# UI

Visual consistency is defined in:

UI_GUIDE.md

Reuse existing components whenever possible.

Avoid creating duplicate UI patterns.

---

# Roadmap

The development roadmap is defined in:

ROADMAP.md

Follow the approved sprint sequence.

Do not anticipate future phases.

---

# Current Sprint

The active sprint is defined in:

TASKS.md

Always execute the current sprint before moving forward.

---

# Documentation Updates

Whenever a significant architectural or business decision is made:

Update the appropriate document.

Never let documentation become outdated.

---

# Deliverables

Every completed task must include:

- Summary of work performed
- Files created
- Files modified
- Validation performed
- Remaining work
- Suggested next step

---

# Quality Checklist

Before finishing any task:

- TypeScript passes
- Lint passes
- Production build passes
- Responsive layout verified
- Accessibility maintained
- No duplicated code introduced
- Documentation updated when necessary

---

# What Not To Do

Do NOT:

- Change business rules
- Break the architecture
- Rewrite working code without reason
- Duplicate components
- Introduce unnecessary dependencies
- Ignore documentation
- Skip validation steps

---

# Golden Rule

When in doubt:

Read the documentation again.

Preserve consistency.

Prefer simplicity over cleverness.

Build software that will still be maintainable years from now.