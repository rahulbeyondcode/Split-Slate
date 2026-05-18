# User Pain Points

Last updated: 2026-05-17
Source: `Requirement Docs/Expense-Splitting Apps_ Market Opportunity Analysis for a Splitwise Alternative.pdf`

---

## Splitwise — Top Complaints (ranked by forum frequency)

1. Daily 3-expense limit + 10-sec cooldown on free tier
2. Paywall on previously free features: currency conversion, charts, expense search, OCR
3. Annual-only subscription — no monthly or lifetime option
4. Anyone in group can edit/delete any expense — no group admin controls
5. Email/phone required to add a friend — high friction
6. OCR only captures total amount, not line items
7. "Simplify Debts" confuses users when it routes payment through indirect creditors
8. Sub-groups explicitly refused: *"Unfortunately, we think this would overcomplicate Splitwise"*

---

## Competitor Complaints

- **Tricount**: Post-bunq redesign hated — "Triccount was just perfect… Now i hate it. Slow. Errors. Lost data. No filtering. No sorting. No export function." Per-expense friction. Data loss reports.
- **Settle Up**: Sync failures — "Only 1 time out of 50 does it actually sync." Ads on free tier.
- **Splid**: No web version; no receipt attachments; last Android update Mar 2023.
- **Splitkaro**: Group-delete black-screen bug; back-date bug in expense form; weaker PDF export.

---

## Most-Requested Missing Features (ranked by forum frequency)

1. **True UPI integration in India** — requested since 2017, never shipped beyond Paytm. Note: UPI protocol prevents direct third-party deep-links; copy-UPI-ID is the best workaround.
2. **Sub-groups / nested groups** — explicitly refused by Splitwise
3. **Item-level OCR with per-line assignment** — only SplitMyExpenses + Splitkaro do this
4. **Add friends without email/phone**
5. **Recurring expenses** — most apps have it; Splid doesn't
6. **Multi-payer per expense** — top HN comment on Spilit Feb 2024 launch
7. **Bank / SMS auto-import**
8. **Couple / family / personal mode**
9. **Search expense history** — Splitwise Pro-gated
10. **Group admin permissions / read-only mode**
11. **Debt consolidation across groups with one friend**
12. **End-to-end encryption / true privacy**

---

## India-Specific Pain Points

- No real UPI — Splitwise added Paytm in May 2017; top comment was "But why not UPI. You must support that." Never shipped.
- Hostel/PG sharing: monthly rent + utilities + food-delivery cycles — no app handles member churn (new roommate replaces old without breaking history)
- Indian wedding splits: multi-family, multi-event, multi-payer, often cash with reimbursements
- Regional languages: zero Indian app has localised Hindi/Tamil/Telugu/Marathi/Bengali UI yet
- Pricing: ₹999/yr heavily resisted; ₹300–500/yr or one-time ~₹500 is the perceived "fair zone"

---

## Privacy Concerns

- Academic PETS 2020 paper cited Splitwise as motivation for E2EE expense-splitting protocols — Splitwise collects: group names, expense descriptions, amounts, receipt images, notes, memos
- GDPR / US-data-transfer concerns for EU users
- Niche but real demand for self-hosted/privacy-first on HN and r/selfhosted

---

## Related

- [[competitive-landscape]] — per-app feature gaps
- [[market-opportunity]] — how these pain points create the opening
- [[monetization-model]] — pricing constraints from India research
