---
id: 15
title: E-Rechnungen als UX-Hürde für kleine Unternehmen
subtitle: Nativer Rechnungsworkflow für iOS
slug: e-rechnung-ux-case-study
category: [Case Study,UX/UI Design, Product Strategy]
collaboration: []
excerpts: >-
  Rechnungen+ transformiert einen fehleranfälligen mobilen Rechnungsprozess in einen
  geführten End-to-End-Workflow: vom Kontakt bis zum ZUGFeRD-PDF mit
  eingebetteter XML.
published: '2026-02-25'
description: Mobile UX-Case-Study für sichere, schnelle E-Rechnungsprozesse im B2B-Kontext
bgColor: '#0F4C81'
image: assets/einvoice/hero.jpg
hasAnimation: false
featured: false
type: [UX/UI, Developement]
---

Rechnungserstellung auf dem Smartphone ist selten nur Dateneingabe. In der Praxis ist es ein **Risikoworkflow**: unter Zeitdruck, zwischen Terminen, mit regulatorischen Anforderungen und direktem Einfluss auf Cashflow und Vertrauen.

**Rechnungen+** wurde genau für diese Realität gestaltet: nicht als Formular-App, sondern als geführter Arbeitsfluss, der fachliche Korrektheit, Geschwindigkeit und Nachvollziehbarkeit zusammenbringt.

## Projekt in einem Satz

**Rechnungen+ ist eine mobile App (iOS/Android), die einen fragmentierten Rechnungsprozess in einen validierten End-to-End-Workflow überführt - von Kontakt und Positionen bis zum ZUGFeRD-PDF mit eingebetteter XML.**

```insight title="Senior UX Fokus"
Das Ziel war nicht, Komplexität zu verstecken, sondern sie in klare, sichere Entscheidungsräume zu übersetzen: weniger Unsicherheit, weniger Korrekturschleifen, mehr verlässliche Outcomes.
```

## Kontext

Kleine Teams und Solo-Selbstständige arbeiten mobil und oft unter Zeitdruck. Gleichzeitig steigen im B2B-Umfeld die formalen Anforderungen:

- Pflichtangaben müssen vollständig und korrekt sein
- Statuslogiken müssen nachvollziehbar bleiben
- E-Rechnungsformate müssen exportierbar und kompatibel sein

Ein "PDF per Mail" reicht in vielen Fällen nicht mehr aus. Die zentrale UX-Frage war deshalb: **Wie schaffen wir Geschwindigkeit ohne Kontrollverlust - und Korrektheit ohne Fachjargon?**

## Meine Rolle (Senior UX/UI)

Ich habe den Produktkern von Problem Framing bis Interaktionslogik gestaltet:

- Product Strategy und Problem Framing
- Informationsarchitektur und End-to-End-Flow-Design
- UX/UI für mobile Kernflows
- Content Design und Fehler-Microcopy
- Interaktionsmodell für Status, Historie und Export
- Übergabe in states- und validierungsfähige UI-Struktur (Design x Logik)

## Das Kernproblem

Nutzer:innen hatten selten ein "UI-Problem", sondern vor allem **Unsicherheit**:

- Ist die Rechnung formal korrekt?
- Fehlt etwas Relevantes?
- Warum wurde ein Dokument abgelehnt?
- Wie komme ich ohne Umwege von Leistung zu versendbarer Rechnung?

Daraus entstand ein klarer Produktfokus: **Unsicherheit früh abbauen statt Fehler spät korrigieren.**

## Research-Synthese (komprimiert)

Ich habe die Domäne entlang dreier Segmente strukturiert:

- Freelancer:innen und Kreative
- handwerksnahe Kleinbetriebe
- Backoffice in kleinen Teams

Wiederkehrende Muster:

- Pflichtangaben und Statuslogik sind unklar
- Stammdatenpflege wird als Reibung erlebt
- Formatbegriffe erzeugen kognitive Last
- Vertrauen entsteht über sichtbares PDF, nicht über abstrakte Datenmodelle
- Fehler werden zu spät entdeckt, wenn Korrekturen bereits teuer sind

## Produktstrategie

Ich habe Rechnungen+ bewusst als **sicheren Arbeitsfluss** aufgebaut, nicht als klassische Formularstrecke.

### 1) Task-first statt Format-first
Nutzer:innen starten mit dem Ziel "Rechnung erstellen" - nicht mit technischen Formatentscheidungen.

### 2) Progressive Disclosure
Komplexe Eingaben wurden in fokussierte Subflows aufgeteilt (Details, Textbausteine, Positionen, Anhänge, PDF-Design), statt alles auf einer Fläche zu bündeln.

### 3) Safety by Design
Validierung passiert während der Eingabe, nicht nur beim Export: Pflichtfelder, Duplikate, ungültige Positionen, Statuskonsistenz.

### 4) Speed by Reuse
Stammdaten, Vorlagen, Barcode-Scan und Assist reduzieren manuelle Arbeit in wiederkehrenden Schritten.

### 5) Vertrauen durch Transparenz
PDF-Vorschau, Historie und Status-Verlauf machen Änderungen nachvollziehbar.

## IA und Produktstruktur

Die Navigation wurde als produktiver Arbeitsraum aufgebaut:

- Suche
- Rechnungen
- Vorlagen
- Produkte
- Kontakte
- Assist
- Statistik
- Scanner
- Konto

Der Rechnungsworkflow ist modular und durchgängig:

1. Empfänger wählen oder anlegen
2. Positionen aus Produkten übernehmen oder manuell hinzufügen
3. Details setzen (Datum, Fälligkeit, Währung, Rechnungsnummer)
4. Textbausteine und Anhänge ergänzen
5. Status und Prozessstufe steuern (Angebot, Rechnung, Mahnung, Storno)
6. PDF erzeugen, prüfen, teilen und in der Historie versionieren

## Entscheidende UX-Entscheidungen

- **Hero + Detail-Sheets im Editor**: Kernstatus und Kontext bleiben sichtbar, tiefe Eingaben passieren fokussiert in Sheets
- **Status als aktive Steuerung** statt statischem Label (Offen, Überfällig, Bezahlt, Storniert) inklusive Verlauf
- **Vorlagen als inhaltliche Defaults** für Einleitung, Zahlungshinweise und Zusatztexte
- **PDF-Design als First-Class-Feature** (Layout, Farbwelt, Typografie, Custom Font, Vorschau)
- **Assist als eingebettete Hilfe**: Entwürfe aus Freitext, passende Datensätze vorschlagen, Unsicherheit reduzieren
- **Scanner-Flow** mit Mengenmultiplikator und direkter Übergabe in den Rechnungsvorbefüllungszustand
- **Import von E-Rechnungen** aus XML oder PDF mit eingebetteter XML für eingehende Dokumente

## Validation, Edge Cases und UX-Logik

Wesentliche Schutzmechaniken im Flow:

- Verhinderung doppelter Rechnungsnummern
- Abfangen leerer oder ungültiger Positionen
- Duplikaterkennung bei Kontakten und Produkten (inklusive Barcode)
- Schutz vor Datenverlust bei ungespeicherten Änderungen (Verwerfen vs. Entwurf)
- Exportprüfung auf Existenz und Validität vor dem Teilen
- Historie trennt klar zwischen Statusänderungen und PDF-Versionen

## Outcome

Rechnungen+ liefert einen durchgehenden mobilen Workflow von Datenerfassung bis exportierbarer E-Rechnung mit einem klaren Fokus auf:

- **Klarheit** in fachlich komplexen Schritten
- **Sicherheit** durch frühzeitige Validierung
- **Tempo** durch Wiederverwendung und geführte Flows

Senior-relevante Wirkung des Projekts:

- Komplexität wurde nicht "wegdesignt", sondern sinnvoll segmentiert
- Fachlogik, UI-States und Datenmodell wurden konsistent verzahnt
- Vertrauenskritische Bereiche (Status, Historie, Export) wurden explizit gestaltet
- Scope wurde bewusst geführt: EN16931/ZUGFeRD im Fokus, komplexere Steuerfälle als definierte nächste Stufe

## KPI-Framework für die Produktphase nach Launch

- Time-to-First-Invoice
- Completion Rate im Editor
- Fehlerquote vor Export
- Erfolgreiche Export-/Share-Rate
- Supportfälle pro 100 Rechnungen
- Korrekturschleifen pro Rechnungsvorgang

## Nächste Ausbaustufen

1. Erweiterte Steuerfälle (mehrere Steuersätze, Reverse Charge, EU-Fälle) mit verständlicher UX-Abstraktion
2. Sichtbarer Readiness Score mit priorisierten To-dos vor dem Export
3. In-App-Analytics pro Schritt zur Reduktion von Abbrüchen und Fehlermustern
4. Geführtes Onboarding für Erstnutzer:innen mit domänenspezifischen Presets

Mit Rechnungen+ wurde aus einem fehleranfälligen Formularprozess ein verlässlicher mobiler Arbeitsfluss - exportbereit in wenigen Minuten.
