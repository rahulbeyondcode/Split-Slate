# Iconography

Purpose: keep interface actions and navigation legible and aligned across devices without replacing user-selected identities.

Last updated: 2026-09-29

## Decision

Interface navigation, controls, status affordances, and empty states use Lucide SVG icons through
the shared `Icon` component. Standard control icons are 18–20px, navigation icons 20–22px, and
empty-state icons 30px in a consistent 64px badge. Decorative icons are hidden from assistive
technology; the accompanying control text or accessible label supplies the action name.

User-selected person, group, and category emoji remain visible as data, as do the onboarding
illustrations and their emoji fallbacks. Currency symbols and mathematical direction signs remain
text where they convey monetary or balance information rather than acting as interface icons.

The previous mixture of font glyphs, emoji, and one-off SVGs had inconsistent metrics and could
render very small or disappear with font differences. Vector interface icons avoid dependence on
font glyph coverage and can be sized consistently in both sidebar and mobile navigation.

## Related

- [[layout-architecture]] — responsive navigation where the shared icon sizing is used
- [[domain-models]] — group, person, and category icons remain user-selected data
