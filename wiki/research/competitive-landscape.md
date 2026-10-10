# Competitive Landscape

A dated competitor record preserving product research, website-content lessons, and launch-copy constraints.

Last updated: 2026-10-10
Product research snapshot: May 2026; volatile facts were rechecked on 2026-08-20.
Website-content review: 2026-10-10, covering eight user-selected websites.
Source: `app-featureset-context/expense-splitting-apps-feature-tables.md.pdf` + `app-featureset-context/Expense-Splitting Apps_ Market Opportunity Analysis for a Splitwise Alternative.pdf`

This is research evidence, not the implementation roadmap. Current product status lives in
[[index]]. Official rechecks: [Splitwise Pro limits](https://kb.splitwise.com/pro/what-is-splitwise-pro),
[Splid on Google Play](https://play.google.com/store/apps/details?id=splid.teamturtle.com.splid),
[PeerSplit repository](https://github.com/tanayvk/peersplit), and [Spliit](https://spliit.app/).
The product tables below retain their historical research scope; the later website review is
separate evidence about marketing content, not a new verification of competitor functionality.

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

## Website Content Review — 2026-10-10

Purpose: retain the lessons behind the next landing-page content pass without copying competitor
wording or treating their claims as implemented Split Slate features.

### Evidence and Limits

- The review covers the eight sites linked below. The user found them within their first two Google
  results pages; their ranking positions were not independently verified. Page wording alone does
  not establish why a site ranks or how well it converts.
- Six homepages exposed readable content through direct fetching. `splitslate.com` and `spliito.com`
  initially returned JavaScript shells; their published copy was inspected, then the user supplied
  rendered homepage HTML to complete the content evidence. No competitor browser automation ran.
- Marketing statements are observed claims, not feature, pricing, security, or performance audits.
  The supplied HTML was synthesized, not saved as a transcript or copied into our implementation.
- **Spliito** (`spliito.com`) in this review is distinct from **Spliit** (`spliit.app`) in the older
  product-research table.

### Site-by-Site Lessons

| Website | Observed content approach | Lesson for Split Slate |
|---------|---------------------------|------------------------|
| [Splitwise](https://www.splitwise.com/) | Leads with reduced relationship stress and named audiences, then explains tracking balances, organizing expenses, adding bills, and recording repayments. Separates core and Pro capabilities. | Pair emotional positioning with explicit product actions and recognizable use cases. Do not rely on a slogan to explain the category. |
| [Splid](https://splid.app/english/) | Friendship-focused headline followed by travel, offline use, currency, export, and download benefits. | Explain benefits in everyday language: what the user can do and why it helps, rather than leading with technical architecture. |
| [Kittysplit](https://www.kittysplit.com/en) | Walks named friends through a shared-cost example, sharing, and repayment. Links dedicated use-case and alternative pages. | Make the animated expense example teach the complete workflow. Later content can address specific situations instead of repeating the homepage. |
| [SplitSlate](https://splitslate.com/) | Rendered page explicitly describes splitting expenses, groups, balances, and repayments; organizes features, process, use cases, pricing, and FAQs. Free and paid capabilities are distinguished. | Make capabilities and product questions concrete. Use the structure as inspiration, not its pricing, copy, technology, or feature promises. |
| [Splitkaro](https://www.splitkaro.com/) | Presents scattered transactions as the problem and financial contexts as the answer. Uses specific household, travel, personal, couple, and team examples with demonstrative UI. | Build a problem → solution narrative around recognizable expenses such as rent, groceries, hotels, and taxis. Borrow specificity, not unsupported automation or usage statistics. |
| [Spliito](https://spliito.com/) | Focuses on knowing who owes whom, three understandable benefits, browser/no-signup convenience, and a four-step create/share/record/settle tutorial. Names travel and smaller social occasions. | Put the outcome and ease of starting upfront; make steps understandable without prior category knowledge. Sharing mechanics must match our own approved launch design. |
| [ExpenseSplit](https://expensessplit.com/) | Offers calculators, worked explanations, FAQs, and linked guides for trips, rent, meals, fuel, groceries, subscriptions, and other specific problems. | Later SEO content should solve distinct user problems with useful examples or tools, not create repetitive keyword pages. |
| [MoneySplit](https://www.moneysplit.in/) | Uses explicit bill-splitting/category language, spending-to-settlement steps, concrete trip/roommate expenses, and linked product/use-case/guide pages. | Explain the category plainly and connect the homepage to genuinely useful supporting content when the SEO phase begins. |

Additional Kittysplit examples inspected:
[house sharing](https://www.kittysplit.com/en/house-sharing) and
[Splitwise alternative](https://www.kittysplit.com/en/splitwise-alternative).
Their presence demonstrates content organization, not independently verified comparative claims.

### Lessons to Carry Into the Next Content Pass

1. **Keep distinctive design; improve literal clarity.** Retain the editorial layout and coordinated
   animations. The creative headline must be accompanied by an immediate explanation of splitting
   bills, tracking shared expenses, and seeing who owes whom.
2. **Use concrete situations.** Name trips, roommates, rent, utilities, groceries, meals, transport,
   and shared events where relevant. Explain the shared-cost problem, not merely a lifestyle label.
3. **Let the example teach.** Show who paid, which people share the cost, their allocations, and
   suggested repayments. Motion should make that relationship easier to follow, not obscure it.
4. **Give readers a complete workflow.** Describe group creation, participation/sharing, expense
   recording, split selection, balance review, and recording repayments in terms of the approved
   launch experience. Do not import another app's invitation or account model by implication.
5. **Explain useful features individually.** Five split methods, multiple payers, balances, group
   synchronization, offline use, exports, and backups need understandable outcomes and examples.
6. **Answer practical questions.** Cover uneven contributions, multiple payers, currency behavior,
   sharing, installation, data handling, backups, device changes, pricing, and how repayments work.
7. **Do not treat no-signup as a unique differentiator.** Kittysplit and Spliito already emphasize
   it. Describe our combination of benefits and distinguish local use from any future sync identity
   requirements once those are approved.
8. **Preserve low-friction entry.** Keep clear app-entry calls to action and explain installation
   inside the app. The separate marketing site must not enter the installed PWA or its offline cache.
9. **Plan supporting content after the page review.** Use-case guides, calculators, and carefully
   sourced comparisons are candidates for SEO. Do not keyword-stuff, invent testimonials/rankings,
   reuse competitor assets, or copy their analytics/scripts/schema as an implementation template.

### User-Approved Copy Constraints

- **Keep the product name Split Slate.** The existence of `splitslate.com` was discussed; the user
  explicitly chose to keep the name. Do not reopen naming as a prerequisite for this content work.
- **Write for the launch product.** Approved planned features can be described in present tense;
  public copy should not contain development-status or missing-sync disclaimers. The user intends
  to release only after every advertised promise is available.
- **Maintain honest internal status.** Track each exact promise, website location, implementation
  state, remaining work, and required release verification. Marketing copy is not evidence that a
  feature exists in the current source. Future sessions must retain this distinction.
- **Known pending launch promise: live group synchronization.** The user committed to implementing
  it before release. The approved content pass now advertises shared-group updates and access on
  another device, with exact claims/locations and current-source gaps recorded in the canonical
  website launch promise ledger in [[product-roadmap]]. Access model, pricing, detailed sync design,
  implementation, and release evidence remain pending.
  Do not automatically promise free sync, account-free cloud participation, end-to-end encryption,
  mixed-currency conversion, OCR, bank imports, or other competitor capabilities.
- **Public release is gated by advertised capability delivery.** Review all claims, including
  interactions between them (for example, offline behavior plus shared updates), before publishing
  the launch site. This gate does not authorize commands; [[testing-strategy]] still controls runs.
- **SEO remains a later phase.** This approval records lessons and copy direction; it does not
  approve production-domain metadata, new public pages, extra features, or technical implementation.

Application status: the user approved the six-file content pass on 2026-10-10. The landing page now
uses an explicit product description, concrete use cases, practical FAQs, and present-tense sync
copy, while retaining its editorial design and motion. The website launch promise ledger is in
[[product-roadmap]]; it distinguishes launch copy from current implementation. This did not change
app/PWA source, copy competitor assets/scripts, or start the technical SEO phase. The revised copy
has not been formatted or browser-verified; earlier landing checks precede these text changes.

---

## Related

- [[market-opportunity]] — the gap Splitwise's paywall created
- [[user-pain-points]] — top complaints per app
- [[monetization-model]] — recommended pricing for split-slate
- [[product-roadmap]] — independent landing/PWA deployment and implementation planning
- [[testing-strategy]] — explicit approval requirements for verification and execution
