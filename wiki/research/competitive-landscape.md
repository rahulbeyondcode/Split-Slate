# Competitive Landscape

A dated competitor snapshot used to preserve the evidence and hypotheses behind product strategy.

Last updated: 2026-08-20
Research snapshot: May 2026; volatile facts were rechecked on 2026-08-20.
Source: `app-featureset-context/expense-splitting-apps-feature-tables.md.pdf` + `app-featureset-context/Expense-Splitting Apps_ Market Opportunity Analysis for a Splitwise Alternative.pdf`

This is research evidence, not the implementation roadmap. Current product status lives in
[[index]]. Official rechecks: [Splitwise Pro limits](https://kb.splitwise.com/pro/what-is-splitwise-pro),
[Splid on Google Play](https://play.google.com/store/apps/details?id=splid.teamturtle.com.splid),
[PeerSplit repository](https://github.com/tanayvk/peersplit), and [Spliit](https://spliit.app/).

---

## Major Players & Fatal Flaws

| App | Model | Strongest Region | Fatal Flaw |
|-----|-------|-----------------|------------|
| Splitwise | Freemium; regional subscription pricing | US, India, Europe | Paywall backlash; current official limit is 4 expenses/day on the free tier |
| Tricount (bunq) | Free + ads | France, Europe | Post-bunq redesign hated; no UPI; CSV export removed in v8 |
| Settle Up | Freemium; regional subscription pricing | Czech Republic, Europe | Sync failures and ads were prominent complaints in the source snapshot |
| Splid | Free + one-time IAP | Germany, US (travelers) | No web version; Android was updated in August 2025 |
| SplitMyExpenses | Freemium subscription | US | Web-primary; native apps were new in the source snapshot |
| Splitkaro | Freemium subscription | India | India-focused; source snapshot reported group-delete and back-date bugs |
| Spliit | Free, open-source/self-hosted | Self-hosted niche | No native mobile app; niche audience |
| SplitPro | Free, open-source/self-hosted | Self-hosted niche | No native mobile app; niche audience |
| PeerSplit | Fair-source, local-first P2P | Privacy/P2P niche | No native mobile app; niche audience |

---

## Feature Monopolies Reported in the May 2026 Snapshot

- **Ultrasound device-to-device group join** — Settle Up
- **Voice assistant integration** — Settle Up
- **Auto-fetch from Swiggy/Zomato/BlinkIt** — Splitkaro
- **SMS expense auto-detect** — Splitkaro
- **P2P sync, no central server** — PeerSplit
- **Group Premium splittable among members** — Settle Up
- **Charge review share-link** — SplitMyExpenses

---

## Research-Identified Table Stakes

These are market recommendations from the source snapshot, not a statement that split-slate has
implemented them.

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
- **Free/ad-supported in the source snapshot**: Tricount v8+
- **One-time/lifetime purchase**: Splid, splitty
- **Open-source/self-hosted**: Spliit, SplitPro
- **Fair-source/local-first P2P**: PeerSplit

---

## Related

- [[market-opportunity]] — the gap Splitwise's paywall created
- [[user-pain-points]] — top complaints per app
- [[monetization-model]] — recommended pricing for split-slate
