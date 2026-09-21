# Updating the world

1. Edit `public/content/resume.json`. Each record has a stable ID, a work/education type, a place ID, title, organisation, location, date wording, summary and source references. Use a note for uncertainty. Keep approximate dates approximate.
2. Put the record in one of the existing places, or add a place with a unique ID, name, object description, position and model. Available models: shop, workshop, stage, rail, airport, warehouse, construction and learning. New places automatically receive buttons and labels.
3. Run `npm run build` to regenerate the no-JavaScript history, content map and static site. This updates the scene's content without modelling every fact by hand.
4. Run `npm run check`, review the changes, and preview with `npm run preview`. Push reviewed changes to main to deploy through GitHub Actions.

To swap source material, read and verify the new documents, add their title, page count and SHA-256 hash to the sources array, and update affected records. Do not place unredacted PDFs, addresses, phone numbers or referee details in public assets. Source facts can change independently of the 3D scene. A newly awarded qualification must be supported, not inferred from enrolment.
