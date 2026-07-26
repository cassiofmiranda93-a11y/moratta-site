# PROMPTS

This file contains official prompts for AI coding agents.

Always instruct the agent to read the entire `.ai` folder before starting.

---

# Start a New Session

Read the entire `.ai` folder before writing any code.

Understand:

- BUSINESS.md
- ARCHITECTURE.md
- CODING_STANDARDS.md
- DECISIONS.md
- UI_GUIDE.md
- ROADMAP.md
- TASKS.md

Follow every documented rule.

Only after understanding the project, begin implementing the current sprint.

---

# Execute Current Sprint

Read the `.ai` folder.

Execute every task described in TASKS.md.

Respect all architectural decisions.

Do not skip tasks.

Do not change business rules.

At the end provide:

- Summary
- Files created
- Files modified
- Pending improvements
- Suggested next sprint

---

# Continue Development

Read the `.ai` folder.

Continue exactly where the previous session stopped.

Do not recreate existing code.

Do not change architecture unless required.

Preserve consistency with the current project.

---

# Refactor

Read the `.ai` folder.

Refactor the project without changing behavior.

Objectives:

- Improve readability
- Remove duplication
- Improve performance
- Improve maintainability

Do not change business logic.

---

# Bug Fix

Read the `.ai` folder.

Identify the root cause of the reported issue.

Fix only what is necessary.

Avoid introducing unrelated changes.

Explain:

- Cause
- Solution
- Files modified

---

# Code Review

Read the `.ai` folder.

Review the entire implementation.

Analyze:

- Architecture
- Readability
- Maintainability
- Performance
- Accessibility
- SEO
- Type safety

List:

Critical issues

Important issues

Minor improvements

Recommendations

---

# UI Review

Read the `.ai` folder.

Review the interface according to UI_GUIDE.md.

Verify:

Consistency

Spacing

Typography

Hierarchy

Responsiveness

Accessibility

Component reuse

Suggest improvements.

---

# Performance Review

Read the `.ai` folder.

Analyze:

Bundle size

Rendering

Images

Lazy loading

Code splitting

Caching opportunities

List improvements ordered by impact.

---

# SEO Review

Read the `.ai` folder.

Analyze:

Metadata

Semantic HTML

Headings

Structured Data

Open Graph

Twitter Cards

Accessibility impact on SEO

Return an improvement plan.

---

# Accessibility Review

Read the `.ai` folder.

Review according to WCAG principles.

Analyze:

Keyboard navigation

ARIA

Focus states

Contrast

Semantic HTML

Forms

Images

Return prioritized improvements.

---

# Before Every Delivery

Before considering the task complete:

Run lint.

Run type checking.

Run production build.

Fix every error.

Update documentation when necessary.

Only then deliver the final result.