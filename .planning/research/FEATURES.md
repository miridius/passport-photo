# Feature Landscape

**Domain:** Passport photo cropping/preparation tool (Australian specifications)
**Researched:** 2026-03-07

## Australian Passport Photo Specifications

This is the core domain knowledge the tool must encode. All measurements below apply to **printed** photos.

### Photo Dimensions

| Parameter | Value | Notes |
|-----------|-------|-------|
| Width | 35-40 mm | Standard target: 35 mm |
| Height | 45-50 mm | Standard target: 45 mm |
| Aspect ratio | ~7:9 (35:45) | Fixed for crop frame |

### Face Size Requirements

| Parameter | Min | Max | Notes |
|-----------|-----|-----|-------|
| Chin to crown height | 32 mm | 36 mm | Crown = top of skull, NOT hairline or top of hair |
| Face as % of photo height | ~71% | ~80% | Derived: 32/45 to 36/45 (aligns with ICAO 70-80%) |

**Critical distinction:** "Crown" means the top of the skull as if the person were bald. For people with voluminous hair, the guide zone must indicate where the skull top would be, not where the hair ends. This is the single most confusing aspect of the specification and the primary source of photo rejections.

### Head Position

| Parameter | Requirement |
|-----------|-------------|
| Horizontal | Centered in frame |
| Vertical | Eyes in upper half of image |
| Tilt | None -- imaginary line between eye centers must be parallel to top edge |
| Rotation | Face directly forward, no angle |

### Derived Measurements for the Crop Tool

For a standard 35x45 mm photo, the guide zones should be:

| Guide | Position from bottom | Derivation |
|-------|---------------------|------------|
| Chin zone (bottom of face) | ~5.5-8.5 mm | Derived: if face is 32-36 mm and centered vertically, chin sits here |
| Crown zone (top of skull) | ~37.5-44.5 mm | Chin position + 32-36 mm face height |
| Top margin (above crown) | ~3 mm minimum | Space between crown and top edge |

Note: The official specs do not prescribe exact vertical positioning of the chin -- only that the face is 32-36 mm and centered with eyes in the upper half. The guides should show the **acceptable range** as bands, not hard lines.

### Age-Specific Rules

| Age Group | Expression | Eyes | Mouth | Other |
|-----------|-----------|------|-------|-------|
| Adults (3+) | Neutral, no smile | Open, fully visible | Closed | Standard rules apply |
| Children 3+ | Neutral, no smile | Open, fully visible | Closed | Same as adults |
| Under 3 | Neutral preferred | Open preferred but some leniency | **May be open** | No toys/bottles/objects in frame |
| Infants (<1) | Best effort | Some leniency if not fully open | May be open | No hands/supports visible, no other people in frame |

**For the target users (ages 1 and 5):**
- The 5-year-old: full adult rules apply (neutral expression, eyes open, mouth closed)
- The 1-year-old: mouth may be open, some leniency on eyes, but face must still be 32-36 mm chin-to-crown and centered

The face size requirement (32-36 mm) is the **same for children and adults**. There is no separate child measurement range.

### Print and Digital Specifications

| Format | Specification |
|--------|--------------|
| Print | High-gloss, heavy-weight photo paper |
| Print resolution | 300 DPI minimum (413x531 px at 35x45 mm) |
| Digital (online submission) | JPEG/PNG, 70 KB - 3.5 MB, preferred 1200x1600 px |
| Digital resolution | 600 DPI recommended (827x1063 px at 35x45 mm) |
| Photo age | Taken within last 6 months |
| Background | Plain white or light grey |

### Print Layout Math

For tiling cropped photos onto standard paper:

| Paper Size | Dimensions | Photos per sheet (35x45 mm) | Layout |
|------------|-----------|----------------------------|--------|
| 4x6 inch | 102x152 mm | 6 (2 cols x 3 rows) | 2x35=70 mm < 102 mm width; 3x45=135 mm < 152 mm height |
| A4 | 210x297 mm | 20 (5 cols x 4 rows) | 5x35=175 mm < 210 mm; 4x45=180 mm < 297 mm (generous margins) |

Add 1-2 mm gutters between photos for cutting guides. With 2 mm gutters:
- 4x6: 2 cols (35+2+35=72 mm) x 3 rows (45+2+45+2+45=139 mm) = 6 photos
- A4: 5 cols (5x35+4x2=183 mm) x 4 rows (4x45+3x2=186 mm) = 20 photos

### Sources

- [Australian Passport Office - Passport Photos](https://www.passports.gov.au/help/passport-photos) -- Official primary source
- [Australian Passport Office - Photo Requirements](https://passports.gov.au/getting-passport-how-it-works/photo-requirements)
- [Australian Passport Office - Camera Operator Guidelines (PDF)](https://www.passports.gov.au/sites/default/files/2024-12/CameraOperatorGuide_A4-2025_1.pdf)
- [Department of Home Affairs - Citizenship Photo Requirements](https://immi.homeaffairs.gov.au/citizenship/photo-requirements-for-citizenship-applications)
- [Australian Passport Office - General Photo Guidelines (PDF)](https://www.passports.gov.au/sites/default/files/2021-04/brochure-photo-guidelines.pdf)

**Confidence: HIGH** -- Specifications sourced from official Australian government websites. The face-size range (32-36 mm), photo dimensions (35-45 mm), and child rules (under 3 mouth open) are consistent across all official sources.

---

## Table Stakes

Features users expect from any passport photo preparation tool. Missing these and the tool feels broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Load photo from device | Can't do anything without it | Low | File picker + drag-and-drop. Mobile: camera roll access |
| Pan and zoom to position face | Core interaction -- user aligns face within guides | Medium | Touch gestures on mobile, mouse/scroll on desktop. Needs smooth, responsive interaction |
| Fixed-ratio crop frame (35:45) | The whole point of the tool | Low | Aspect ratio is fixed; user positions photo within it |
| Visual guide overlay showing acceptable zones | Users need to know if their positioning is correct | Medium | Shaded bands for chin range, crown range, and centering. Must be intuitive at a glance |
| Download cropped photo | Need the output file | Low | Export as JPEG at correct DPI (300 minimum). File naming could include dimensions |
| Works on mobile browsers | Primary use case: take photo on phone, crop on phone | Medium | Touch-friendly controls, responsive layout. Most parents will use their phone |
| Works on desktop browsers | Secondary use case | Low | Standard mouse/keyboard interaction. Easier to fine-tune positioning |
| Correct DPI/resolution output | Photo must print at correct physical size | Low | Scale pixels to match 35x45 mm at 300 DPI = 413x531 px minimum |

## Differentiators

Features that set this tool apart from competitors. Not expected, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Print layout generator (4x6 and A4) | Save money: tile multiple photos on one sheet for home/pharmacy printing | Medium | Generate a composite image with 6 photos (4x6) or 20 photos (A4) with cutting guides |
| "Crown vs hair" visual hint | Address the #1 confusion point: crown = top of skull, not hair | Low | Tooltip or label on the crown guide explaining this distinction |
| Spec reference panel | Show users what the rules are, not just the guides | Low | Collapsible panel showing the actual Australian requirements. Builds trust |
| Real-time measurement readout | Show current chin-to-crown measurement as user adjusts | Medium | Calculate and display the current face height in mm based on zoom level. Shows "32-36 mm required, currently ~34 mm" |
| Child mode toggle | Switch guide labels to note relaxed rules for under-3 | Low | Reminder text like "Mouth may be open for children under 3" |
| Undo/redo for positioning | Recover from accidental pan/zoom | Low | Simple state stack for position + zoom |
| Keyboard shortcuts | Power user efficiency | Low | Arrow keys for fine pan, +/- for zoom |

## Anti-Features

Things to deliberately NOT build. Each would add complexity without serving the core use case.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Face detection / auto-crop | Adds heavy dependency (ML model or API), unreliable for infants, overkill for a simple crop tool | Manual pan/zoom with clear guides is sufficient. The user knows where the face is |
| Background removal / replacement | Scope creep. User should take photo against a white/grey wall | Show a tip: "Take photo against a plain white or light grey background" |
| Photo editing (brightness, contrast, retouching) | Not a photo editor. Passport offices warn against AI-altered photos (US State Dept rejects AI-altered photos as of Jan 2026) | Suggest using phone's built-in editor before loading into tool if adjustments needed |
| Multi-country support | Australia only. Adding country configs adds testing burden and UI complexity | Hard-code Australian specs. If needed later, refactor to config-driven |
| User accounts / cloud storage | Privacy risk, infrastructure cost, unnecessary for a local tool | Everything stays on device. No server-side processing |
| Compliance guarantee / verification | Cannot guarantee acceptance. Legal liability. Even commercial tools disclaim this | Clear statement: "This tool helps you meet specifications but acceptance is at the passport office's discretion" |
| AI-powered anything | Passport offices increasingly reject AI-altered photos. Also violates simplicity constraint | Keep it manual and honest |
| Payment / watermarking | Tool is for personal use, locally hosted | Free, no restrictions on output |
| Webcam capture | Passport photos need proper lighting and background -- webcam selfies rarely work | User takes photo separately, loads the file |

## Feature Dependencies

```
Load photo ──> Pan/zoom positioning ──> Guide overlay (needs crop frame + zoom level)
                                    ──> Download cropped photo
                                    ──> Print layout (needs cropped photo)
                                    ──> Measurement readout (needs zoom level + crop frame)

Guide overlay ──> Child mode toggle (modifies guide labels only)
              ──> Crown/hair hint (annotation on existing overlay)

Download ──> Print layout (tiles the downloaded/cropped image)
```

Core dependency chain: **Load -> Position -> Guides -> Export -> Print Layout**

Each feature in the chain requires the previous one to exist. The differentiators (measurement readout, child mode, crown hint) are decorations on the guide overlay and can be added independently.

## MVP Recommendation

**Prioritize (Phase 1 -- Core Crop Flow):**

1. Load photo from device (file picker, drag-and-drop)
2. Pan and zoom with fixed 35:45 crop frame
3. Semi-transparent guide overlay showing chin/crown acceptable zones
4. Download cropped photo at correct resolution

**Prioritize (Phase 2 -- Print & Polish):**

5. Print layout generator (4x6 and A4 tiling)
6. Mobile-optimized touch controls
7. Crown-vs-hair visual hint
8. Spec reference panel

**Defer:**

- Real-time mm measurement readout: nice but not essential if guides are clear enough. Add if guides prove confusing during testing.
- Child mode toggle: the face size specs are identical for all ages. The only difference is expression rules, which are the photographer's concern, not the cropping tool's. A simple note in the spec panel suffices.
- Undo/redo: low priority if zoom/pan is smooth and easy to adjust.
- Keyboard shortcuts: add after core flow works.

## Competitive Landscape Context

Existing tools fall into three categories:

**1. Full-service AI tools** (Passport Photo Online, PhotoGov, PhotoAiD): Auto-detect face, remove background, resize, offer human review. Overkill for this use case. Often cost money. Privacy concerns (photos uploaded to servers).

**2. Simple DIY croppers** (IDPhoto4You, 123PassportPhoto, IDPhotoDIY): Upload, crop with a frame, download tiled print layout. Free. No face detection. This is the category PassPhoto competes in -- but those tools are generic (multi-country) and web-hosted.

**3. Government tools** (US State Dept photo tool): Buggy, limited, poor UX. Australia doesn't offer one.

PassPhoto's advantage: **purpose-built for Australian specs, runs locally (privacy), and shows specification-aware guides rather than a dumb crop frame.** The guide overlay with acceptable zones is the key differentiator -- no existing tool shows the 32-36 mm range as a visual band.

## Sources

- [Australian Passport Office - Passport Photos](https://www.passports.gov.au/help/passport-photos)
- [Australian Passport Office - Camera Operator Guidelines 2025 (PDF)](https://www.passports.gov.au/sites/default/files/2024-12/CameraOperatorGuide_A4-2025_1.pdf)
- [Department of Home Affairs - Citizenship Photo Requirements](https://immi.homeaffairs.gov.au/citizenship/photo-requirements-for-citizenship-applications)
- [PhotoAiD - Australian Baby Passport Photo](https://photoaid.com/en-au/australian-baby-passport-photo)
- [Snap2Pass - Best Passport Photo Apps 2026](https://www.snap2pass.com/guides/best-passport-photo-apps-2026)
- [Passport Photo Online - Tools Review](https://passport-photo.online/blog/online-passport-photo-maker-tools/)
- [IDPhoto4You](https://www.idphoto4you.com/)
- [VisaFoto - 4x6 Photo Size Guide](https://visafoto.com/photo-4x6)
