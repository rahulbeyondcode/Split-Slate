
# 📄 Expense Sharing App — Requirement Specification (MVP → V3)

---

# 🧭 1. PRODUCT SUMMARY

A **privacy-first, offline-first expense sharing app** inspired by Splitwise.

### Core Principles

* No login (initially)
* No personal identity required
* Works fully offline
* Fast (<5 sec to add expense)
* Zero confusion in “who owes whom”

---

# 🧱 2. ARCHITECTURE

### Platform

* PWA (can be wrapped for Play Store using TWA)

### Storage

* Local DB: IndexedDB
* Optional wrapper: Dexie.js

### Data Nature

* Fully local (MVP, V2)
* Sync introduced only in V3

---

# 🧭 3. VERSION ROADMAP

## ✅ MVP (Core)

Features:

* Create group
* Add members (name only)
* Add expenses
* Split types:

  * Equal
  * Exact
  * Percentage
* Show net balances (who owes whom)
* Categories (group-level)
* CSV export/import

NO:

* Sync
* Accounts
* Ads
* Automation

---

## 🚀 V2 (Enhancement)

* Recurring expenses
* Reminders (unsettled)
* Analytics
* Category summaries
* Date filtering
* 🔔 Periodic CSV backup reminders

---

## 💰 V3 (Premium)

* Cloud sync (paid)
* Invite-link based joining
* Privacy-preserving identity (device-based)
* Future:

  * Receipt scanning
  * Automation

---

# 👤 4. USER MODEL

### Important Decision

❗ No global user in MVP/V2

Users exist **only inside groups**

---

## Local User (Device Owner)

```ts
{
  id: UUID,
  name: string,
  icon: string
}
```

---

## Member (Group Scoped)

```ts
{
  id: UUID,
  groupId: UUID,
  name: string,
  icon: string
}
```

👉 Same person can have different IDs in different groups (by design)

---

# 👥 5. GROUP MODEL

```ts
{
  id: UUID,
  name: string,
  icon: string,
  createdAt: number
}
```

---

# 🗂️ 6. CATEGORY MODEL

* Categories are **group-specific**

```ts
{
  id: UUID,
  groupId: UUID,
  name: string,
  isActive: boolean
}
```

### Rules

* Default categories auto-created
* Cannot delete categories
* Only:

  * Rename
  * Activate/Deactivate

---

# 💸 7. EXPENSE MODEL (CRITICAL)

```ts
{
  expenseId: UUID,
  groupId: UUID,
  expenseName: string,
  createdBy: memberId,
  categoryId: UUID,
  createdAt: number,

  transactions: {
    paid: [
      { memberId: UUID, amount: number }
    ],
    owes: [
      { memberId: UUID, amount: number }
    ]
  }
}
```

---

## 💡 Key Decisions

* Supports **multiple payers**
* Supports **complex splits**
* Stores both:

  * who paid
  * who owes

👉 This avoids recomputation complexity

---

# 🧮 8. BALANCE SYSTEM

## Definition

“Balance” ≠ bank balance
It means:

> Net amount each member owes or is owed within a group

---

## Calculation Logic

For each member:

```ts
net = totalPaid - totalOwed
```

### Result

* Positive → others owe them
* Negative → they owe others

---

## Output

System derives:

> “Who owes whom”

---

# 🔁 9. CORE FLOW

1. Create group
2. Add members (min 2 required)
3. Add expense
4. Store paid + owes
5. Calculate balances
6. Show “who owes whom”

---

# 📱 10. USER FLOW (ONBOARDING → APP)

## Onboarding

1. App open → intro screens
2. Enter name + icon
3. Create group
4. User auto-added to group
5. Add at least 1 more member
6. Enter main app

---

## Main Screen

### Top

* Group name

### Body

* Expense list

Each item:

* Name
* Amount
* Paid by
* Date

### CTA

* ➕ Add Expense (primary button)

---

## Navigation (Tabs)

* Expenses (default)
* Balances (who owes whom)
* (Future) Settlements

---

## Menu (optional)

* Export CSV
* Import CSV
* Settings
* Help

---

# 📤 11. DATA SHARING (MVP)

## Export

* CSV file

Includes:

* members
* expenses
* splits

---

## Import

* Recreates full group

---

## Limitation

* Snapshot only
* No identity merging

---

# 🔄 12. SYNC WORKAROUND (V1/V2)

Manual shared file approach:

* User exports CSV
* Uploads to shared drive
* Others import manually

❗ No real-time updates
❗ No conflict resolution

---

# 🔐 13. ID STRATEGY

All IDs = UUID v4

Used for:

* groups
* members
* expenses

👉 Collision probability ≈ negligible

---

# 🔐 14. FUTURE IDENTITY (V3)

* Device generates identity
* Linked via invite link
* No email/login required

---

## ⚠️ Known Tradeoff

* If device lost → identity lost
* Recovery = re-invite

---

# 💳 15. MONETIZATION

## Model

Primary:

* Subscription (monthly/yearly)

Reason:

* Cloud sync has ongoing cost

---

## Optional (Experimental)

### 🎥 Rewarded Ads

* User watches ad → earns credits
* Credits → unlock premium

Constraints:

* Fully optional
* No coercion
* Transparent rewards

---

# 🎨 16. UI DESIGN

### Theme

* Soft blue / green (trust)
* Light background (white/grey)
* Minimal UI

### Accent

* Teal / orange for actions

### Principle

> Clarity > beauty

---

# ⚠️ 17. RISKS

### 1. No Sync (MVP)

* Users may expect it

### 2. Data Loss

* Must push CSV backups

### 3. Identity Confusion

* Same person = multiple IDs

### 4. Manual Sync Friction

---

# 🚫 18. EXPLICIT NON-GOALS

* No login (MVP/V2)
* No real-time sync (MVP/V2)
* No payments inside app
* No ads in core flow

---

# 🧠 FINAL PRINCIPLE

This app wins ONLY if:

* Add expense < 5 sec
* No confusion ever
* UI is frictionless

If users hesitate → product fails

---

# 🚀 NEXT STEP (FOR DEV)

Implement in order:

1. IndexedDB schema
2. Create group
3. Add members
4. Add expense (critical)
5. Balance calculation
6. UI rendering
