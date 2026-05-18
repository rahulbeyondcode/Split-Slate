# Competitive Landscape

Last updated: 2026-05-17
Source: `Requirement Docs/expense-splitting-apps-feature-tables.md.pdf` + `Requirement Docs/Expense-Splitting Apps_ Market Opportunity Analysis for a Splitwise Alternative.pdf`

---

## Major Players & Fatal Flaws

| App | Model | Strongest Region | Fatal Flaw |
|-----|-------|-----------------|------------|
| Splitwise | Freemium ($4.99/mo) | US, India, Europe | Paywall backlash — 3 expenses/day + 10-sec cooldown on free tier |
| Tricount (bunq) | Free + ads | France, Europe | Post-bunq redesign hated; no UPI; CSV export removed in v8 |
| Settle Up | Freemium (~$1.99/mo) | Czech Republic, Europe | Sync failures; ads on free; India ad-free at ₹3,999 considered too expensive |
| Splid | Free + one-time IAP | Germany, US (travelers) | No web version; last Android update Mar 2023 — abandonment risk |
| SplitMyExpenses | Free + $3-9/mo | US | Web-primary; native iOS/Android only launched Nov 2025 |
| Splitkaro | Freemium (~₹49/mo) | India | India-only; ~6-person team; group-delete bug; back-date bug |
| Spilit / SplitPro / PeerSplit | Free, FOSS | Self-hosted niche | No native mobile app; niche audience only |

---

## Feature Monopolies (only one app has this)

- **Ultrasound device-to-device group join** — Settle Up
- **Voice assistant integration** — Settle Up
- **Auto-fetch from Swiggy/Zomato/BlinkIt** — Splitkaro
- **SMS expense auto-detect** — Splitkaro
- **P2P sync, no central server** — PeerSplit
- **End-to-end encryption** — PeerSplit
- **Group Premium splittable among members** — Settle Up
- **Charge review share-link** — SplitMyExpenses

---

## Features Every Serious App Has (Table Stakes)

- Equal / unequal / percentage / share splits
- Multi-payer per expense
- Debt simplification
- Multi-currency entry
- Offline use
- No-account / link-based joining
- CSV export
- Dark mode
- Push notifications

---

## Features Still Gated or Missing Across Most Apps

- Receipt OCR with item-level assignment — only SplitMyExpenses + Splitkaro do this well
- Sub-groups — explicitly refused by Splitwise; no one else has it either
- True UPI deep-links (India) — only Splitkaro; UPI protocol prevents direct third-party links
- Search expense history — Splitwise gates behind Pro; most others free
- Group admin / read-only members — Settle Up (free read-only), Splitkaro (Paid), SplitPro

---

## Business Model Groupings

- **Freemium subscription**: Splitwise, Settle Up, Splitkaro, SplitMyExpenses
- **Free + ads (no paid tier)**: Tricount v8+, Splid
- **One-time / lifetime IAP**: Splid (~$4.99), splitty ($24.99)
- **Open-source / self-hosted**: Spilit, SplitPro, PeerSplit

---

## Related

- [[market-opportunity]] — the gap Splitwise's paywall created
- [[user-pain-points]] — top complaints per app
- [[monetization-model]] — recommended pricing for owe-it
