---
id: 15
title: E-Invoicing as a UX Challenge for Small Businesses
subtitle: Native Invoicing Workflow for iOS
slug: e-rechnung-ux-case-study
category: [Case Study,UX/UI Design, Product Strategy]
collaboration: []
excerpts: >-
  Rechnungen+ transforms an error-prone mobile invoicing process into a guided
  end-to-end workflow, from contact setup to ZUGFeRD PDF export with embedded XML.
published: '2026-02-25'
description: Mobile UX case study for secure, fast B2B e-invoicing workflows
bgColor: '#0F4C81'
image: assets/einvoice/hero.jpg
hasAnimation: false
featured: false
type: [Design, Strategy]
---

Creating invoices on a smartphone is rarely just data entry. In reality, it is a **risk workflow**: done under time pressure, between appointments, with regulatory constraints and direct impact on cash flow and trust.

**Rechnungen+** was designed for exactly this reality. Not as a form app, but as a guided workflow that combines compliance, speed, and traceability.

## The Project in One Sentence

**Rechnungen+ is a mobile app (iOS/Android) that turns a fragmented invoicing process into a validated end-to-end workflow, from contacts and line items to ZUGFeRD PDF export with embedded XML.**

```insight title="Senior UX Focus"
The goal was not to hide complexity, but to translate it into clear, safe decision spaces: less uncertainty, fewer correction loops, and more reliable outcomes.
```
```mockup type="iphone" image="assets/einvoice/03.png" bgColor="#F5F5F7"
```
```mockup type="iphone" image="assets/einvoice/04.png" bgColor="#F5F5F7"
```

## Context

Small teams and solo professionals work on the go, often under time pressure. At the same time, formal requirements in B2B contexts keep rising:

- Mandatory data has to be complete and correct
- Status logic must stay understandable and auditable
- E-invoicing formats must be exportable and compatible

In many cases, "just sending a PDF by email" is no longer enough. The central UX question became: **How do we create speed without losing control, and correctness without domain jargon?**

## My Role (Senior UX/UI)

I shaped the product core from problem framing to interaction logic:

- Product strategy and problem framing
- Information architecture and end-to-end flow design
- UX/UI for core mobile workflows
- Content design and error microcopy
- Interaction model for status, history, and export
- Handover into a state-aware, validation-ready UI structure (design x logic)

## The Core Problem

Users rarely had a pure "UI problem." What they had was **uncertainty**:

- Is this invoice formally correct?
- Am I missing something important?
- Why was this document rejected?
- How do I get from work delivered to send-ready invoice without detours?

This led to a clear product focus: **reduce uncertainty early instead of fixing errors late.**

## Research Synthesis (Condensed)

I structured the domain around three segments:

- Freelancers and creatives
- Trade-adjacent small businesses
- Back-office roles in small teams

Recurring patterns:

- Mandatory fields and status logic are unclear
- Master data maintenance feels like friction
- Format terminology creates cognitive load
- Trust is built through visible PDFs, not abstract data models
- Errors are discovered too late, when corrections are already costly

```mockup type="iphone" image="assets/einvoice/06.png" bgColor="#F5F5F7"
```
```mockup type="iphone" image="assets/einvoice/05.png" bgColor="#F5F5F7"
```
## Product Strategy

I intentionally designed Rechnungen+ as a **safe workflow**, not as a traditional form sequence.

### 1) Task-First Instead of Format-First
Users start with the goal "create invoice," not with technical format decisions.

### 2) Progressive Disclosure
Complex input was split into focused subflows (details, text blocks, line items, attachments, PDF design) instead of forcing everything into one screen.

### 3) Safety by Design
Validation happens during input, not only at export: mandatory fields, duplicates, invalid items, and status consistency.

### 4) Speed by Reuse
Master data, templates, barcode scanning, and Assist reduce manual work in recurring steps.

### 5) Trust Through Transparency
PDF preview, history, and status timeline make changes easy to understand.

## IA and Product Structure

Navigation was structured as a productive workspace:

- Search
- Invoices
- Templates
- Products
- Contacts
- Assist
- Analytics
- Scanner
- Account

The invoicing workflow is modular and continuous:

1. Select or create recipient
2. Pull line items from products or add them manually
3. Set details (date, due date, currency, invoice number)
4. Add text blocks and attachments
5. Control status and process stage (quote, invoice, reminder, cancellation)
6. Generate, review, share, and version the PDF in history

## Key UX Decisions

- **Hero + detail sheets in the editor**: core status and context remain visible, while deeper input happens in focused sheets
- **Status as active control** instead of a static label (Open, Overdue, Paid, Cancelled), including timeline
- **Templates as content defaults** for intros, payment notes, and additional text
- **PDF design as a first-class feature** (layout, color system, typography, custom font, preview)
- **Assist as embedded support**: generate drafts from free text, suggest matching records, reduce uncertainty
- **Scanner flow** with quantity multiplier and direct handoff into invoice prefill state
- **E-invoice import** from XML or PDF with embedded XML for incoming documents

## Validation, Edge Cases, and UX Logic

Core safeguards in the flow:

- Prevention of duplicate invoice numbers
- Handling of empty or invalid line items
- Duplicate detection for contacts and products (including barcode)
- Data-loss protection for unsaved changes (discard vs draft)
- Export checks for existence and validity before sharing
- History clearly separates status changes from PDF versions

## Outcome

Rechnungen+ delivers an end-to-end mobile workflow from data capture to export-ready e-invoice, with a clear focus on:

- **Clarity** in domain-heavy steps
- **Safety** through early validation
- **Speed** through reuse and guided flows

Senior-level impact of the project:

- Complexity was not "designed away," but segmented in a meaningful way
- Domain logic, UI states, and data model were integrated consistently
- Trust-critical areas (status, history, export) were designed explicitly
- Scope was managed deliberately: focus on EN16931/ZUGFeRD, with advanced tax cases defined as the next stage

```mockup type="iphone" image="assets/einvoice/01.png" bgColor="#F5F5F7"
```
```mockup type="iphone" image="assets/einvoice/02.png" bgColor="#F5F5F7"
```


## KPI Framework for the Post-Launch Product Phase

- Time-to-First-Invoice
- Completion rate in the editor
- Error rate before export
- Successful export/share rate
- Support cases per 100 invoices
- Correction loops per invoicing process

## Next Expansion Steps

1. Advanced tax cases (multiple tax rates, reverse charge, EU scenarios) with understandable UX abstraction
2. Visible readiness score with prioritized to-dos before export
3. Step-level in-app analytics to reduce drop-offs and error patterns
4. Guided onboarding for first-time users with domain-specific presets

With Rechnungen+, an error-prone form process became a reliable mobile workflow, ready for export in minutes.
