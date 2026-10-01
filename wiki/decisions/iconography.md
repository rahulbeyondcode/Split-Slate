# Iconography

Purpose: keep interface actions and navigation legible and aligned across devices without replacing user-selected identities.

Last updated: 2026-10-01

## Decision

Interface navigation, controls, status affordances, and empty states use Lucide SVG icons through
the shared `Icon` component. Standard control icons are 18–20px, navigation icons 20–22px, and
empty-state icons 30px in a consistent 64px badge. Decorative icons are hidden from assistive
technology; the accompanying control text or accessible label supplies the action name.

The route error screen uses existing local Fluent-style 3D PNGs as larger illustrations: a
magnifying glass for missing pages and hammer-and-wrench for unexpected errors. Their image alt
text identifies each illustration, while the heading and body explain the failure and recovery.
The action buttons continue to use Lucide icons.

User-selected icons are local 256×256 transparent PNGs from `public/emoji-icons/`. The reusable
image picker shows a short featured set, then a searchable gallery. Profile pictures are exclusively
for the device owner's avatar and people (contacts and group members); the other image folders are
available to groups and categories, never profile pictures. Gallery folders filter non-profile
choices. Every choice is labelled and accessible by keyboard. Assets are loaded as image elements
rather than inline Unicode glyphs; the catalog tracks the current files in `public/emoji-icons/`.

Netlify serves these PNGs with a seven-day browser HTTP cache lifetime via `public/_headers`.
The production service worker precaches only the two default icons with the app shell; after the
worker first controls the page, it downloads the curated library separately while the app is open.
A generated inventory lists every published PNG with its SHA-256 digest. Each online check verifies
cached bytes, keeps matching icons, and fetches missing or changed icons with `cache: "no-store"`.
Only verified responses replace their existing cache entries. Settings offers the same check and
repair on demand. Failed downloads leave healthy entries and IndexedDB data untouched. Images
requested before background download finishes are cached when loaded. The selected collection, not
the entire upstream emoji library, is bundled with the site.

The app does not wait for all icons before opening; an unavailable image renders a neutral fallback.
Browser storage can be evicted, and a background download may stop when the app closes. The worker
retries on the next online app visit; "ready offline" is not a guarantee of permanent storage.
Cache repair never deletes user data. Vite's development server does not exercise the service
worker or use Netlify's response headers. See [[product-roadmap]] for release checks.

The persisted `icon` is a collection-relative path, such as `profile-pic/fox-3d.png` or
`travel-and-places/airplane-3d.png`. The renderer resolves only known paths for the appropriate
collection, with a PNG default for missing or unknown values. No old Unicode avatar is displayed or
migrated: development data is disposable and will be cleared separately. User-supplied icon values
are never interpreted as external image URLs. Group transfer and backup retain these icon strings;
the assets ship with the app. See [[domain-models]].

Previously saved category emoji from the development-era picker are read as matching PNG images
without rewriting their stored values. This prevents existing local categories from all showing the
same default airplane. New picker selections still save PNG keys; unknown icons use the image
default. Profile avatars have no Unicode compatibility display.

Onboarding illustration animations remain WebP artwork; their static placeholders use the PNG
collection. Currency symbols and mathematical direction signs remain text where they convey
monetary or balance information rather than acting as interface icons.

The previous mixture of font glyphs, emoji, and one-off SVGs had inconsistent metrics and could
render very small or disappear with font differences. Vector interface icons avoid dependence on
font glyph coverage and can be sized consistently in both sidebar and mobile navigation.

## Related

- [[layout-architecture]] — responsive navigation where the shared icon sizing is used
- [[domain-models]] — group, person, and category image keys remain user-selected data
