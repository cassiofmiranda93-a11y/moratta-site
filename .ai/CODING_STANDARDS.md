# CODING STANDARDS

## General Philosophy

Write code for humans first.

Optimize for readability, maintainability and scalability.

Every implementation should leave the project in a better state than before.

---

# Language

Mandatory:

- TypeScript

Never use JavaScript unless explicitly required.

---

# Type Safety

Never use:

- any

Prefer:

- interfaces
- type aliases
- enums only when appropriate
- generics when they improve readability

Every function must have explicit types whenever they are not obvious.

---

# Components

Components should:

- Have a single responsibility
- Be reusable
- Be independent
- Receive data through props
- Avoid hidden side effects

Split components before they become too large.

Target:

150–250 lines.

Avoid components over 300 lines.

---

# Functions

Prefer:

Small functions.

Pure functions.

Descriptive names.

Avoid deeply nested conditions.

Prefer early returns.

---

# Naming

Use English for:

Variables

Functions

Files

Folders

Types

Interfaces

Examples:

PropertyCard

DevelopmentSection

calculateMonthlyPayment

createLead

Never mix Portuguese and English in code.

Website content may remain in Portuguese.

---

# File Naming

Use:

kebab-case

Examples:

property-card.tsx

hero-section.tsx

contact-form.tsx

Never use:

Spaces

Accents

Uppercase filenames

---

# Folder Naming

Use:

lowercase

Examples:

components

services

hooks

utils

---

# Imports

Order imports:

1. React / Next

2. External libraries

3. Internal aliases

4. Relative imports

Separate groups with one blank line.

---

# Styling

Use Tailwind CSS only.

Prefer reusable utility patterns.

Avoid duplicated class strings.

When repeated many times, create reusable UI components.

---

# Comments

Do not comment obvious code.

Comment only:

Business rules

Complex logic

Important architectural decisions

Avoid redundant comments.

---

# Constants

Magic numbers are prohibited.

Create constants with descriptive names.

---

# Strings

Avoid hardcoded repeated strings.

Create constants whenever appropriate.

---

# Error Handling

Never ignore errors.

Fail gracefully.

Provide useful messages.

Never expose internal implementation details to users.

---

# Performance

Avoid:

Unnecessary renders

Large components

Heavy dependencies

Repeated calculations

Prefer memoization only when justified.

---

# Accessibility

Every interactive element must:

Be keyboard accessible.

Have semantic HTML.

Use aria attributes when necessary.

Images must contain alt text.

---

# Responsive Design

Mobile-first.

Support:

Mobile

Tablet

Desktop

Never break responsiveness.

---

# Git

Commits should be:

Small

Focused

Descriptive

One logical change per commit.

---

# Before Finishing

Always:

Run lint

Run TypeScript checks

Run build

Fix every error before considering the task complete.

---

# Refactoring Rule

Whenever touching existing code:

Improve it if possible.

Never leave duplicated code behind.

---

# Golden Rule

Every line of code should make the project:

Cleaner

Safer

Simpler

More reusable

More maintainable