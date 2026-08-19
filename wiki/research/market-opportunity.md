# Market Opportunity

A dated market thesis that records the acquisition hypotheses and recommendations from the research.

Last updated: 2026-08-20
Research snapshot: May 2026; not the committed implementation roadmap.
Source: `app-featureset-context/Expense-Splitting Apps_ Market Opportunity Analysis for a Splitwise Alternative.pdf`

---

## The Opening

The source research identified Splitwise's 2023–2024 paywall tightening and cooldown as a major
market opening, based on complaints across Reddit, Hacker News, Trustpilot, Google Play, DesiDime,
and IndianPersonalFinance. Splitwise's current official documentation lists a four-expenses-per-day
free limit; exact limits and pricing are volatile. See [[competitive-landscape]].

The May 2026 research found no competitor combining:
- Polished cross-platform experience
- True India layer (UPI deep-links + Swiggy/Zomato import)
- Privacy-first, local-first architecture
- Sub-groups
- Item-level receipt OCR
- Unlimited free expense-adding

---

## Target Positioning

India-first launch. Primary wedge: Splitwise CSV import + "free forever for the core" promise.

The displaced Splitwise user is the primary acquisition target — they already understand the product category and are actively looking for an alternative.

---

## Research Recommendations for an Entrant

The source recommended the following launch scope. This is not the split-slate roadmap; several
items are pending or only captured as ideas in [[index]].

1. Unlimited expenses — no daily cap, no cooldown
2. Equal / unequal / percentage / share / itemized / adjustment splits
3. Multi-payer per expense
4. Multi-currency + in-app currency conversion (free)
5. Debt simplification (with toggle to disable)
6. Offline mode
7. CSV + PDF export (free)
8. Push notifications + activity feed
9. No-account group joining via link
10. Dark mode + PWA / cross-platform
11. Splitwise CSV import (converts users directly)

---

## Differentiators Where split-slate Can Win

**India layer** (no competitor does all of these):
- UPI deep-links to GPay/PhonePe/Paytm/CRED/Amazon Pay
- Copy-UPI-ID fallback (UPI protocol prevents true third-party direct links)
- Auto-fetch from Swiggy/Zomato/BlinkIt/BigBasket/Instamart/Zepto with item-level split
- SMS expense auto-detect

**Structural gaps in the market:**
- Sub-groups — Splitwise explicitly refused; no one else has it
- Group admin / read-only members — prevents "drunk friend deletes all expenses"
- Hostel/PG monthly cycle mode — Splitkaro partially has, no one does it well
- Family/wedding mode — multi-event sub-tabs (mehndi/sangeet/reception)

**Privacy advantage:**
- Local-first architecture (already our design) — only PeerSplit matches this; PeerSplit lacks native mobile

---

## GTM Summary

- Launch India-first on Reddit (r/Splitwise, r/IndianPersonalFinance, r/india) + DesiDime
- SEO: "Splitwise alternative", "Splitwise India alternative", "free bill splitting app India"
- Viral mechanic: share-group-via-link (no signup for invitee) + Splitwise import wizard
- Use a lower-priced India-first offer than the incumbent pricing observed in the source snapshot;
  see the unimplemented proposal in [[monetization-model]].

---

## Related

- [[competitive-landscape]] — detailed competitor breakdown
- [[user-pain-points]] — what users are actively complaining about
- [[monetization-model]] — pricing strategy
