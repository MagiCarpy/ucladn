# Payments, Escrow, & Fraud Prevention

This document outlines the architectural blueprints for implementing payments, escrow, delivery guarantees, and fraud prevention in the UCLA Delivery Network app.

---

## 1. Escrow & Payment Processing (Stripe Connect)

When handling user funds in a peer-to-peer (P2P) marketplace, **liability, security, and PCI-DSS compliance** are the most critical factors. 

**Rule:** Never build a custom escrow system or hold user funds in a generic business bank account. Doing so assumes massive legal liability and PCI compliance overhead.

### The Solution: Stripe Connect
Stripe Connect is the industry standard for multi-party marketplaces (like Uber, DoorDash). It is specifically designed to handle the exact flow needed: **User A pays User B, and the Platform takes a cut.**

- **The Flow:**
  1. The Requester enters their credit card (securely vaulted by Stripe).
  2. The Helper (courier) sets up a "Stripe Express" account to receive payouts directly to their bank account.
  3. When a request is accepted, a **Pre-Authorization Hold** is placed on the Requester's card. The funds are frozen, but no money moves yet.
  4. Once delivery is confirmed, the backend instructs Stripe to **Capture** the charge.
  5. Stripe automatically routes the base delivery fee to the Helper and routes the platform fee (our cut) to the app's business account.

### Alternative Option: Monero (XMR) Multisig Escrow
For users prioritizing anonymity, a cryptocurrency transaction system utilizing Monero (XMR) can be implemented. Monero natively supports **2-of-3 Multisignature (Multisig) Wallets**, which acts as a mathematically enforced escrow system without relying on a centralized bank.

- **How 2-of-3 Multisig Escrow Works:**
  1. A temporary wallet is created that requires 2 out of 3 participants to sign off on any transaction. The 3 key holders are: **The Requester**, **The Helper**, and **The Platform (You/Admin)**.
  2. The Requester deposits the Monero into this wallet. The funds are now locked (in escrow).
  3. **Happy Path:** Once the delivery is complete, the Requester and the Helper both sign the transaction, releasing the funds to the Helper's personal wallet.
  4. **Dispute Path:** If there is a dispute (e.g., missing food), the Requester and Helper will disagree and refuse to sign. The Platform (Admin) reviews the case (using chat logs or photo proof). The Platform then uses their 3rd key to sign a transaction with either the Requester (to refund them) or the Helper (to force the payout), achieving the 2 signatures needed to resolve the escrow.
- **Pros:** Completely anonymous, mathematically secure, zero chargeback risk from credit card companies, and circumvents traditional payment processor fees.
- **Cons:** Significantly higher technical barrier to entry for the average college student. Requires running a Monero node or relying on a remote RPC node for wallet synchronization.

---

## 2. Guaranteeing Delivery (Handoff Mechanics)

Because this is a P2P app involving college students, disputes over missing food will inevitably happen. We offer two modes of delivery to balance security with convenience:

### Option A: In-Person Handoff (The Delivery PIN)
For maximum security, the Requester must meet the Helper in person.
- The app generates a random 4-digit PIN for the **Requester**.
- To complete the delivery and get paid, the **Helper** must ask the Requester for the PIN and enter it into their app.
- **Pros:** 100% foolproof. Zero liability for the platform.
- **Cons:** Requires the Requester to be present and responsive at the time of handoff.

### Option B: Contactless Drop-off (Photo Proof)
The Requester opts for the food to be left at their dorm door. 
- The Helper takes a photo of the food at the door through the app to complete the delivery.
- **Pros:** High convenience for Requesters who are in class or asleep.
- **Cons:** Opens up the possibility of theft (either the Helper stealing the food after the photo, or dorm thieves). This requires the "Honor System" outlined below.

---

## 3. Fraud Prevention & Dispute Mitigation

To protect both the platform and the users, we implement systemic friction against bad actors.

### 1. The "Double-Blind" Suspicious Points System
When a Requester claims a "Contactless Drop-off" order is missing after a photo was taken, we face a "he-said-she-said" scenario. 
- **The Subsidy:** The app subsidizes the loss by refunding the Requester (using accumulated platform fees) to guarantee a good user experience for innocent victims.
- **The Tracking:** Under the hood, **BOTH** the Requester and the Helper are assigned a hidden "Suspicious Point" in the database.
- **The Math:** Over a large sample size, a chronic scammer (a buyer lying for free food, or a deliverer stealing it) will accumulate points far faster than an honest user who just occasionally suffers from dorm thieves. 
- **The Penalty:** If a user crosses a hidden threshold (e.g., 3 suspicious points), the algorithm automatically and permanently bans their `@ucla.edu` account.

### 2. The "Secret Shopper" Trap (The Panopticon Effect)
To deter Helpers from taking a photo and then stealing the food, we leverage the threat of surveillance.
- **The Trap:** We employ verified users (unknown to others) to occasionally use the drop-off function and physically watch from a distance to see if the deliverer steals the food after taking the picture.
- **The Deterrent:** A bold warning will be placed in the app: *"To ensure community safety, UCLA Delivery Network employs random Secret Shoppers who monitor drop-off zones. Stealing food will result in an immediate permanent ban."* The mere threat of being watched will deter the vast majority of opportunistic theft.

### 3. UCLA Email Exclusivity
Restrict account creation strictly to `@ucla.edu` or `@g.ucla.edu` email addresses. Students are far less likely to commit fraud if their real identity and university email are tied to the account.

### 4. Maximum Order Values
Limit the maximum cost of requested items (e.g., $30 max) during the initial launch phase to limit liability in edge-case disputes.
