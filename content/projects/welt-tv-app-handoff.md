---
title: Dev-Ready UX/UI for a Streaming App
subtitle: 'Design System, Component Library and Implementation-Ready Handoff for External Development Teams'
date: '2026-03-09'
description: Designing a streaming news app is not only about the interface — it is about building a system that developers can implement reliably. This case study shows how a mobile and tablet streaming product was translated into a documented design system, component library and dev-ready handoff.
tags:
  - ux-ui
  - mobile-app-design
  - design-system
  - design-handoff
  - streaming
  - ios
  - android
  - tablet
  - figma
slug: welt-tv-app-handoff
recommendedFilename: welt-tv-app-handoff.md
canonical: '[BILD: canonical-url nicht angegeben]'
og:image: '[BILD: welt-tv-og.jpg nicht angegeben]'
image: /assets/vr/app-hero.png
category:
  - UX
  - UI
type:
  - UX/UI
id: 40
published: '2021-10-10'
excerpts: How I designed the UX/UI for a streaming news app and translated it into a developer-ready design system with 100+ components, documented states and screen-level specifications — enabling external teams to implement the product quickly and consistently.
featured: true
hasAnimation: true
video: assets/welt-brand/LoopLogo.mp4
---

Designing the **WELT TV mobile app** meant structuring a complex streaming product rather than simply designing screens. The app combines documentaries, series, news clips and live broadcasts within a single platform, while also integrating editorial logic, brand requirements and monetization features such as Plus access and paywall elements.

```small
From the beginning, the focus of the project was to create a system that external development teams could implement without ambiguity. Instead of treating each screen as a standalone layout, the product was designed as a **structured UX architecture** that defines how content, components and navigation behave across devices.
```

![assets/upload/components-1-mmin00li-ea4d09.webp]

```insight title="Design must survive implementation"
A polished interface is only successful if it can be implemented reliably. Clear rules, documented behavior and defined edge cases turn design from visuals into a buildable product.
```

The foundation of the project was a documented **design system** that structured the visual language and interaction patterns of the app. Rather than designing isolated layouts, UI elements were organized into reusable components and states that could scale across the entire product.

```palette
name="Blartz" hex="#171B2D" rgb="23,27,45" rank="1"
name="Orange" hex="#F18825" rgb="241,136,37" rank="1"
name="Background" hex="#0E101B" rgb="14,16,27" rank="3"
```

- Brand-aligned color, typography and spacing systems
- Navigation patterns adapted to both iOS and Android conventions
- Defined component states such as loading, empty and error conditions
- Responsive rules for phone and tablet layouts, portrait and landscape
- Consistent media teaser and thumbnail hierarchies for editorial content

![assets/upload/group-165-mmjfesd9-ee81dc.webp|assets/upload/group-178-mmjfilo9-887a59.webp] {shadow="false" radius="false"}

# Screens alone don’t explain how a product behaves.

Beyond the visual system, the project included a detailed screen-by-screen specification describing how the interface behaves in real scenarios. These notes document logic that cannot be derived from static UI layouts.

- Home screen with editorial highlights and program navigation 
- Video detail pages for shows, series and news segments
- Streaming player with live and on-demand video
- Live broadcast section including EPG integration
- Authentication, account and profile flows
- Settings, notifications and platform-specific variations

```mockup type="iphone" bgColor="#F5F5F7" image="assets/upload/iphone-11-pro-mmjg1xbs-6cdb26.webp"
```

```mockup type="iphone" bgColor="#F5F5F7" image="assets/upload/serie-mmjgcv2c-72ea61.webp"
```

```small
Together with a component library containing more than one hundred component states and a device matrix covering phones and tablets across both platforms, the product became a coherent UI system rather than a collection of layouts.

Stakeholders from marketing, editorial, brand and management were involved throughout the process. User flows were mapped and reviewed iteratively to ensure that not only the visuals but also the structure and navigation of the product worked reliably.
```

## The outcome: a dev-ready design handoff.

The final deliverable was a structured package of components, rules and screen specifications that allowed the external development team to start implementation quickly and with minimal ambiguity.

```small
Instead of handing over design files, the project translated the product into a system developers could build with confidence.
```

![]

![assets/vr/epg.png] {shadow="false" radius="false"}
