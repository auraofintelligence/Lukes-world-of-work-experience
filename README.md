# Luke's world of work

A small 3D harbour built from Luke Hayes' work and education history. Visit eight places to discover 15 work roles and 13 education or training entries. The world is fictional; its facts come from the two supplied resume PDFs.

Live: https://auraofintelligence.github.io/Lukes-world-of-work-experience/

## Run it locally

Install Node.js 22.12+ (or 24), then in this folder:

```text
npm ci
npm run dev
```

Open the local address shown. Drag the world to orbit, scroll or use buttons to zoom, and select a building, map label or chapter button. Arrow keys pan when the scene is focused. The guided route has previous/next buttons. Escape closes a chapter. Discovery progress lasts for this visit only.

## Build and check

```text
npm run build
npm run check
npm run preview
```

The build creates `dist/`, generates a complete readable no-JavaScript history in index.html and an object-to-fact content map. A GitHub Actions Pages workflow builds and publishes on pushes to main. Set repository Settings > Pages > Source to GitHub Actions. No backend, account, runtime API or CDN is needed.

The fallback works without WebGL or JavaScript. Mobile has numbered scene buttons matching the chapter strip. Reduced-motion preferences pause ambient animation. All factual data is escaped before rendering.

## Content

Edit [public/content/resume.json](public/content/resume.json). [Update instructions](docs/updates.md) explain adding or replacing facts. [Content map](public/content-map.md) maps every object to its records. [Source notes](public/sources.md) preserve conflicting dates, unconfirmed qualification levels and historical current wording. Original PDFs are kept locally and are not published.

Startups and volunteering are deferred. A mixed mostly-volunteer web design entry is also deferred rather than presented as confirmed paid employment.

## Design and assets

The harbour groups practical roles by what visitors can recognise: shop, workshop, stage, railway, airport, warehouse, building site and learning pavilion. The original AI-generated holding-page artwork is in public/assets/harbour-concept.png. Its prompt and generation method are in docs/artwork.md. The interactive world uses original procedural geometry and a code-drawn SVG favicon.

## Maintenance

Updates happen through conversation with Luke, incorporating the details he approves and pushing reviewed changes. There are no scheduled reviews or background maintenance jobs. See [maintenance instructions](docs/maintenance.md). Changes to current employment status or qualification completion require source confirmation.

## Licence

Original work uses the [Strange But True Public Source Licence](LICENSE.md), with commercial rights reserved to Luke Nathan Hayes. This is public source, not an open-source licence. Third-party components retain their own licences; see [notices](THIRD_PARTY_NOTICES.md).
