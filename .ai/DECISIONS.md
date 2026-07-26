# DECISIONS

This document records architectural and business decisions.

These decisions are considered approved.

The AI must never change them without explicit authorization.

---

# Project Philosophy

The project is being built as a long-term software platform.

The current website is only the first module.

Future modules will include:

- CRM
- CMS
- Customer Portal
- Atlas AI
- Internal Dashboard
- Analytics

Every decision must support this future.

---

# MVP First

Current priority:

Deliver a high-quality website.

Do not implement unnecessary complexity.

Future integrations should be anticipated but not implemented prematurely.

---

# Data Architecture

Business data must never be hardcoded inside UI components.

Always separate:

Data

↓

UI

---

# Domain Model

Relationship:

Developer

↓

Development

↓

Property

Definitions:

Developer

A construction company.

Examples:

- VascoCivitas
- Baliza
- MRV
- Tenda

Development

A project.

Examples:

- Parque Mirante
- Campo Belo
- Parque Itália

Property

An individual unit marketed by Moratta.

Examples:

- House 12
- Apartment 304
- Lot 08

---

# Availability

Developments do NOT control unit availability.

Properties do.

If a property is sold:

Hide or deactivate the property.

Never modify the development.

---

# Future CMS

Current data lives inside:

src/data

Future data will come from:

CMS

The UI should require minimal changes during migration.

---

# Website Goal

Primary goal:

Generate qualified leads.

Everything else is secondary.

---

# Home Structure

Approved order:

1. Navbar

2. Hero

3. How We Help

4. Developments

5. Buying Process

6. Required Documents

7. Why Choose Moratta

8. FAQ

9. Final CTA

10. Footer

Do not reorder without approval.

---

# Removed Features

The MVP will NOT contain:

Testimonials

Statistics

Property availability counters

Online financing simulator

These features may return in future versions.

---

# Images

All images stay inside:

public/images

Use:

kebab-case

Never use spaces.

Never use uppercase.

---

# Design

The visual identity must remain consistent.

Avoid redesigning existing sections without authorization.

---

# Components

Always reuse existing components.

Avoid duplication.

---

# Code

Prefer:

Simple code.

Readable code.

Reusable code.

Maintainable code.

---

# Future Integrations

Planned:

Firebase

Firestore

WhatsApp

Google Analytics

Meta Pixel

CRM

Atlas

CMS

Design today's code so these integrations are easy tomorrow.

---

# Build Quality

Every completed task must finish with:

TypeScript passing

Lint passing

Build passing

No new warnings

---

# Decision Authority

The AI may decide:

Folder organization

Internal refactoring

Performance improvements

Accessibility improvements

SEO improvements

Component extraction

The AI must NOT decide:

Business rules

Visual identity

Website structure

Brand positioning

Marketing copy

Without explicit authorization.

---

# Permanent Rule

When uncertain:

Preserve existing architecture.

Do not invent new patterns.

Consistency is more important than novelty.