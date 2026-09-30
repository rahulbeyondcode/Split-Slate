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

Netlify serves these PNGs with a seven-day browser cache lifetime via `public/_headers`. A normal
reload reuses images already downloaded during that period; this does not precache the entire
gallery or guarantee offline access. Icon URLs are not content-versioned, so changed images at the
same path may remain stale until the browser cache expires. Do not use `immutable` for these URLs.
Vite's development server does not use Netlify's response headers.

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
