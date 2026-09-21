# Luke's world of work

A richly illustrated world built from Luke Hayes' work, education and volunteering. Every identified job has a separate building or vehicle; each named educator has a separate building. The current inventory contains 28 work records, 14 education/training records and 7 volunteering records across 45 places in five scenes. It remains an expanding history, not a complete lifetime count. The settings are fictional; the facts come from supplied resumes, Luke's journal and his direct corrections.

Live: https://auraofintelligence.github.io/Lukes-world-of-work-experience/

## Run it locally

Install Node.js 22.12+ (or 24), then in this folder:

```text
npm ci
npm run dev
```

Open the local address shown. Switch between Work harbour, UK working holiday, Australian trades, Learning village and Volunteering. Drag to pan, use buttons or pinch to zoom, and select a building, numbered marker or place button. When the scene is focused, the wheel zooms, arrow keys pan, +/- zoom and Home resets the view. The guided route has previous/next buttons. Escape closes a record. Discovery progress lasts for this visit only.

## Build and check

```text
npm run build
npm run check
npm run preview
```

The build creates `dist/`, generates a complete readable no-JavaScript history in index.html and an object-to-fact content map. A GitHub Actions Pages workflow builds and publishes on pushes to main. Set repository Settings > Pages > Source to GitHub Actions. No backend, account, runtime API or CDN is needed.

The fallback works without WebGL or JavaScript. Mobile has numbered scene buttons matching the scrollable place strip. Reduced-motion preferences pause ambient animation and camera easing. All factual data is escaped before rendering.

## Content

Edit [public/content/resume.json](public/content/resume.json). [Update instructions](docs/updates.md) explain adding or replacing facts. [Content map](public/content-map.md) maps every object to its records. [Source notes](public/sources.md) preserve conflicting dates, unconfirmed qualification levels and historical current wording. Original PDFs are kept locally and are not published.

Luke approved including volunteering on 21 September 2026. Intermittent community web design is described as mostly volunteer, exactly as the source qualifies it. Startup ventures remain deferred. Unknown dates and employer names are left explicit; `sort` is a display-order key, not an asserted calendar year. Unclassified source items are retained in the `unresolved` array until their dates and category can be confirmed.

## Design and assets

The generated artwork is the actual visual surface of the experience, with individually mapped buildings and vehicles. Three.js projects each illustration onto a shallow relief mesh. Restrained parallax, open-water movement, camera pan and zoom preserve the detailed illustration. This is an illustrated 2.5D world, not a reconstructed town with unseen sides or unrestricted walking. The application remains client-side and static.

The original concept is public/assets/harbour-concept.png. Scene art is stored beside it: harbour-world.png, uk-working-holiday.png, australian-trades.png, learning-village.png and community-volunteering.png. Prompts and the built-in generation method are in docs/artwork.md. The SVG favicon is code-drawn. Online learning platforms, personal study and workplace tickets with unnamed issuers are distinguished from named educators.

## Maintenance

Updates happen through conversation with Luke, incorporating the details he approves and pushing reviewed changes. There are no scheduled reviews or background maintenance jobs. See [maintenance instructions](docs/maintenance.md). Changes to current employment status or qualification completion require source confirmation.

## Licence

Original work uses the [Strange But True Public Source Licence](LICENSE.md), with commercial rights reserved to Luke Nathan Hayes. This is public source, not an open-source licence. Third-party components retain their own licences; see [notices](THIRD_PARTY_NOTICES.md).
