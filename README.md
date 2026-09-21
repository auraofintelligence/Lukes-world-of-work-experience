# Luke's world of work

One connected illustrated harbour town built from Luke Hayes' work, education and volunteering. Every identified job has a separate building or vehicle; each named educator has a separate building. All 46 places occupy the same continuous map, containing 28 work records, 14 education/training records and 8 volunteering records. It remains an expanding history, not a complete lifetime count. The geography is fictional; the facts come from supplied resumes, Luke's journal and his direct corrections.

Live: https://auraofintelligence.github.io/Lukes-world-of-work-experience/

## Run it locally

Install Node.js 22.12+ (or 24), then in this folder:

```text
npm ci
npm run dev
```

Open the local address shown. The artwork starts at full browser width, with small numbered markers, text behind Menu and a slim rolling jobs ticker. Select any mapped building or vehicle, ticker job or menu place to open its record. Whole building regions respond, with a highlight and name on hover or keyboard focus. Drag to pan and use buttons or pinch to zoom. When the world is focused, the wheel zooms, arrow keys pan, +/- zoom and Home resets the view. Pan vertically to see the waterfront when the full-width artwork extends below the screen. Every selection moves through the same world; no image or scene is swapped. Escape closes a record or menu. Discovery progress lasts for this visit only.

## Build and check

```text
npm run build
npm run check
npm run preview
```

The build creates `dist/`, generates a complete readable no-JavaScript history in index.html and an object-to-fact content map. A GitHub Actions Pages workflow builds and publishes on pushes to main. Set repository Settings > Pages > Source to GitHub Actions. No backend, account, runtime API or CDN is needed.

The fallback works without WebGL or JavaScript. The menu contains all places and a Project Atlas link. It can hide numbered markers or the jobs ticker. Hiding numbers leaves the buildings clickable. The ticker pauses on hover or keyboard focus and has an explicit pause control. Reduced-motion preferences pause movement. All factual data is escaped before rendering.

## Content

Edit [public/content/resume.json](public/content/resume.json). [Update instructions](docs/updates.md) explain adding or replacing facts. [Content map](public/content-map.md) maps every object to its records. [Source notes](public/sources.md) preserve conflicting dates, unconfirmed qualification levels and historical current wording. Original PDFs are kept locally and are not published.

Luke approved including volunteering on 21 September 2026. Intermittent community web design is described as mostly volunteer, exactly as the source qualifies it. Startup ventures remain deferred. Unknown dates and employer names are left explicit; `sort` is a display-order key, not an asserted calendar year. Unclassified source items are retained in the `unresolved` array until their dates and category can be confirmed.

## Design and assets

The generated artwork is the actual visual surface of the experience, with individually mapped buildings and vehicles. Three.js projects the single illustration onto a shallow relief mesh. Camera pan and zoom preserve the detailed illustration. This is an illustrated 2.5D world, not a reconstructed town with unseen sides or unrestricted walking. The application remains client-side and static.

The active artwork is public/assets/connected-world-detail.png. Tower 42 uses an official architectural photograph as reference for its straight sides, vertical ribs and angular crown. The final built-in generation prompt and reference links are in docs/connected-artwork.md. Earlier artwork is retained as design history but is not loaded as alternate worlds. The SVG favicon is code-drawn. Online learning platforms, personal study and workplace tickets with unnamed issuers are distinguished from named educators.

## Maintenance

Updates happen through conversation with Luke, incorporating the details he approves and pushing reviewed changes. There are no scheduled reviews or background maintenance jobs. See [maintenance instructions](docs/maintenance.md). Changes to current employment status or qualification completion require source confirmation.

## Licence

Original work uses the [Strange But True Public Source Licence](LICENSE.md), with commercial rights reserved to Luke Nathan Hayes. This is public source, not an open-source licence. Third-party components retain their own licences; see [notices](THIRD_PARTY_NOTICES.md).
