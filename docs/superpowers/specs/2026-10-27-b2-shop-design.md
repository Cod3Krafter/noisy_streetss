# B2: Shop (design spec)

- **Date:** 27 October 2026
- **Status:** Design approved section by section on 27 October 2026. Written up the same day, waiting for review. Some facts wait on sandbox checks (section 3)
- **Scope source:** the accepted proposal, `refs/NoisyStreetss_Redesign_Breakdown_Updated.pdf`, and the shop decisions of 17, 21 and 27 October 2026
- **Part of:** the backend build: B1 (Payload and content, done), B2 (this spec, the shop) and B3 (members, membership and studio). Each part gets its own spec, plan and build. The frontend comes after the backend.
- **Builds on:** `docs/superpowers/specs/2026-10-18-b1-payload-and-content-design.md` ("the B1 spec")

## 1. Purpose

B2 adds the shop's backend: guest checkout for books and merch, payment through Paystack, delivery through Terminal Africa, and the admin screens staff need to pack, ship and follow orders. B2 is done when an order can go from a cart to Delivered against Paystack's test mode and Terminal's sandbox, driven through the API and the admin, before any public page exists.

### In scope

- A third staff role, Shop staff, and the changes it needs in B1's access rules
- An Orders collection, created only by the site's own server code, never deleted
- Delivery quotes from Terminal at checkout, with a flat price by state when Terminal can't answer
- Checkout, the Paystack payment, and the lookup behind the page the customer returns to
- Marking orders Paid from Paystack's webhook (the notice Paystack sends when a payment succeeds), from the return page and from the expiry job
- Unpaid orders expiring after 30 minutes, and customer details removed from orders that have been Expired for 30 days
- A Book courier panel on the order screen, and Terminal's delivery updates by webhook
- A Stock page for switching In stock on and off without touching drafts
- Sizes (options) for merch
- Two customer emails per order, and staff alert emails
- Changes to Shop settings

### Out of scope

| Item | Where it goes |
|---|---|
| Member accounts, the member discount (20%, books only), its redemption record, customers' order history | B3, with subscriptions (decided 27 October 2026). Pricing leaves a place for the discount (6.4) |
| The manuscript form's server code (`isSpam`, one file per submission, upload straight to storage, progress) | The frontend forms work, built with the form itself (decided 27 October 2026) |
| The shop's public pages (`/shop/[product]`, `/cart`, `/checkout`, the return page) | Frontend phase |
| A refund button. Refunds stay manual in Paystack's dashboard, then the order is marked Refunded | Later, if wanted |
| A cancel-booking button, parcel insurance | Not planned. Bookings are cancelled in Terminal's dashboard (7.2) |
| Delivery outside Nigeria, stock counts, delivered, in-transit, returned or refund emails to customers | Not planned |
| Checking that webhooks are delivered and retried | The sandbox run-through at the end of the build (11.3) |

## 2. Decisions this spec builds on

| Decision | Made |
|---|---|
| The customer pays Paystack's fee, and the fee is never refunded | Client, 21 Oct 2026 |
| Unpaid orders expire after 30 minutes, the life of Paystack's pay-by-transfer account number | 17 Oct 2026 |
| Delivery within Nigeria only | 17 Oct 2026 |
| Stock is an In stock switch staff flip by hand, not a count. Two buyers can both pay for the last copy, and staff refund one | 17 Oct 2026 |
| Refunds are done by hand in Paystack's dashboard, then the order is marked Refunded | 17 Oct 2026 |
| Guest checkout only. Accounts and the discount move to B3 | 27 Oct 2026 |
| The customer picks a courier from live Terminal quotes. If Terminal fails or returns nothing, the flat price for the customer's state is used | 27 Oct 2026 |
| Staff book each courier from the order in the admin, after packing. Noisy Streetss covers any rise since checkout | 27 Oct 2026 |
| A payment confirmed after the order expired still marks it Paid | 27 Oct 2026 |
| Paystack adds its fee at its own checkout, through its "Pass fees to customers" setting, not as a line the site works out | 27 Oct 2026, pending check P1 |
| Built by hand on Payload. Not Payload's ecommerce plugin (Beta in 3.90.2, Stripe only, no shipping), and not Next.js routes and server actions | 27 Oct 2026 |
| Orders are never deleted, by anyone | 27 Oct 2026 |

## 3. Pending sandbox checks

The spike started on 27 October 2026. Paystack's test key works. Terminal refuses the test key it was given ("Invalid token used in request", on both the sandbox and live addresses), and dashboard access to both services has been requested from the client.

**Confirmed in Paystack's test mode (27 October 2026):**

- Paystack's fee on local payments is 1.5% + ₦100, with the ₦100 waived under ₦2,500: a ₦10,000 card payment cost ₦250 and a ₦2,400 transfer cost ₦36. No VAT line appeared.
- Verifying a payment returns `amount`, `requested_amount` and `fees`, all in kobo. With the fee setting off, `requested_amount` equals `amount`.
- After paying, Paystack sends the customer to the return address with `?trxref=<reference>&reference=<reference>` added.
- A transfer's account number lasts 30 minutes.
- After "I've sent the money", Paystack's API reported the transfer as successful within seconds, but its page kept saying it was waiting to confirm for over 30 seconds without sending the customer back. Many transfer payers will not reach the return page, so the webhook and the expiry job's last check (6.7) are not optional.

**Still to check:**

| | Check | What this spec assumes | If it turns out otherwise |
|---|---|---|---|
| P1 | Paystack's "Pass fees to customers" also applies to payments the site starts through the API, with `requested_amount` the pre-fee amount and `amount` what was charged | The site asks for items + delivery, and compares `requested_amount` with the order total | The site adds its own fee line instead: grossed up (the fee is also charged on the fee), from fee figures kept in Shop settings (1.5%, ₦100, waived under ₦2,500, capped at ₦2,000), and the setting stays off |
| P2 | Terminal requires a postcode (`zip`) on an address used for a booking. Most Nigerian customers don't know theirs | Checkout asks for a postcode as optional. Staff can add one to the order before booking, and the panel says when it's missing | Settled from what Terminal accepts: required at checkout, optional as assumed, or not asked at all if Terminal takes a blank one |
| P3 | Quotes and bookings accept Terminal's default box (`PA-PT95DUJGH8FRKSO0`, 20 x 20 x 10 cm, 0.1 kg) by its packaging id | Shop settings hold a Terminal packaging id and the box's weight, starting with Terminal's default | The client's own box is created in Terminal once (`POST /v1/packaging`) and its id stored |
| P4 | The state names Terminal expects ("Lagos" or "Lagos State", "Federal Capital Territory" or "Abuja") | A fixed map from the site's list of 36 states and FCT to Terminal's names | The map changes |
| P5 | The wallet: its unit (naira or kobo), when a booking is charged, what a booking does when the wallet is short, whether a cancellation refunds it | The panel checks the balance before booking, and a refused booking shows Terminal's message | The balance check follows what is found |
| P6 | Quotes without `persist_data` give the same prices as bookable ones | Checkout quotes skip `persist_data`, so no postcode or box id is needed at checkout | Checkout quotes with `persist_data` too, which brings P2 forward to checkout |

When every check is settled, this section is cut down to the facts found, and the sections that depend on them are updated.

## 4. Staff roles and access

### 4.1 Roles

- The `role` field on staff accounts gains a third option, **Shop staff** (`shop`). The default stays Editor. Its description becomes "Admins can also manage staff accounts and shop settings. Shop staff only see orders and the Stock page."
- `isStaffUser` keeps meaning admin or editor: the people who work on content. It guards content changes, reading drafts and version history, jobs, and B1's menu-hiding rules, so shop staff never see content.
- A new `isShopUser` means admin or shop staff. It guards orders, the Stock page and their endpoints.
- A new `isAnyStaffUser` means any of the three roles. It covers opening `/admin` (the `users` collection's admin rule), reading and updating one's own account (`adminOrSelf`), and Payload's edit locks and job stats (`withStaffOnlyInternals`). Without the edit locks, shop staff could not open an order in the admin.
- The plan lists every B1 use of `isStaffUser` and decides each one. Anything not listed in this section stays admin and editor.

### 4.2 Who can do what (adds to the B1 spec's 7.2)

| | Admin | Editor | Shop staff | Visitor |
|---|---|---|---|---|
| Orders | Read, change staff fields | None | Read, change staff fields | None |
| Stock page | Yes | No | Yes | No |
| Book courier | Yes | No | Yes | No |
| Books and merch edit screens | Full | Full | None | Read published only |
| Everything else in B1 | As B1 | As B1 | None | As B1 |
| Staff accounts | Full | Own profile only | Own profile only | None |
| Shop settings | Full | None | None | None |

### 4.3 Orders

- **Create:** nobody. Only the checkout code creates orders, overriding access.
- **Delete:** nobody, whatever the status.
- **Read and update:** admins and shop staff.
- **What staff can change:** the status, by hand, for when a webhook goes missing (each change is written to the order's history with the staff member's name); staff notes; and the customer's phone and address, but only while the order is Paid and no courier is booked, so a phoned-in correction can go out. Every other field is read-only in the admin and refused through the API.
- Orders sit in the "Shop and services" admin group, with the list showing number, status, customer, total and date, newest first, and a status filter. Paid orders are the packing queue.

### 4.4 Stock page

A custom admin page at `/admin/stock`, linked in the menu for admins and shop staff. It lists every book with `sellInShop` ticked and each of its formats, and every merch item with each of its options (or the item itself when it has none), each with its In stock switch. A search box filters by title.

```
Desktop                                      Mobile (staff packing on a phone)
+-------------+----------------------------+ +----------------------+
| Admin menu  | Stock                      | | Stock            [=] |
|  Orders     | [search title........]     | | [search........]     |
|  Stock      | Title          Option   In | | The River Girl       |
|             | The River Girl Paperback[x]| |  Paperback      [x]  |
|             | The River Girl Hardback [ ]| |  Hardback       [ ]  |
|             | NS Tote        -        [x]| | NS T-shirt           |
|             | NS T-shirt     M        [x]| |  M  [x]   L  [ ]     |
+-------------+----------------------------+ +----------------------+
 menu fixed, list scrolls                      menu folds into Payload's menu button
```

- Books and merch use drafts. Flipping stock from their edit screens would either change nothing on the live site or publish an editor's unfinished draft. A switch on the Stock page calls `POST /api/shop/stock` (`collection`, `id`, `option` id when there is one, `inStock`). The server changes the live, published record straight away, and if a newer draft is waiting it sets the same value in the draft too. The editor's draft stays unpublished and can't undo the switch when it's published later. How this is done in Payload is proven by a test before the page is built.
- Shop staff never open the book or merch edit screens.

## 5. Data

### 5.1 Orders (`orders`)

Everything the customer saw at checkout is copied onto the order, so a later change to a price or title never rewrites an old receipt.

| Field | Contents |
|---|---|
| `orderNumber` | `NS-` followed by the record id plus 1000 (the first order is NS-1001). Unique. The title in the admin and in emails |
| `status` | One of the eight statuses in 7.3 |
| `customer` | `name`, `email`, `phone` (stored as `+234...`) |
| `address` | `line1`, `line2`, `city`, `state` (one of 36 states and FCT), `postcode`, `country` (always Nigeria) |
| `items` (array) | `product` (a book or merch item), `option` (format or size name), `title`, `unitPriceNGN`, `weightGrams`, `quantity`, all copied at checkout |
| `delivery` | `method` (courier or flat), `carrierName`, `carrierSlug`, `estimate`, `priceNGN`, `flatArea` (flat price only) |
| `totals` | `itemsNGN`, `deliveryNGN`, `totalNGN` (items + delivery), `paystackFeeNGN` and `chargedNGN` (both from Paystack once paid) |
| `payment` | `reference` (random and unguessable, unique), `channel`, `paidAt`, `paidLate` |
| `shipment` | `terminalShipmentId`, `trackingNumber`, `trackingUrl`, `labelUrl`, `courierCostNGN`, `bookedAt`, `bookedBy`, `bookingStartedAt` (the claim in 7.1) |
| `expiresAt` | 30 minutes after checkout (from Shop settings) |
| `detailsRemovedAt` | When customer details were removed (6.8) |
| `staffNotes` | Free text for staff |
| `history` (array) | `at`, `from` status, `to` status, `by` (payment, Terminal, the expiry job, or a staff member's name), `note`. Append-only and read-only |

- Product prices stay whole naira (B1's rule). An order's money fields allow kobo, because Paystack's fee and Terminal's prices can have kobo. Every sum is worked out in kobo as whole numbers, so nothing drifts through rounding.
- The customer and address fields are required by the checkout code, not by the collection, so 6.8 can empty them.

### 5.2 Merch options

Merch gets an optional `options` array, built like a book's formats: `name`\* and `inStock` (default on). When an item has options, checkout needs one picked, the item's own In stock box is hidden, and each option's box decides instead. Price and weight stay on the item.

### 5.3 Shop settings

- **Flat delivery prices:** each area becomes `areaName`, `states` (several from the 36 states and FCT) and `priceNGN`. A state can be in only one area. A new required `elsewherePriceNGN` covers every state not listed.
- **Parcel box:** `terminalPackagingId` and `boxWeightGrams`, used for every quote and booking (pending P3).
- **Pickup address:** gains `postcode` (pending P2).
- **`memberDiscountPercent`:** hidden from the admin until B3, and kept, so B3 needs no migration for it.
- `unpaidOrderExpiryMinutes` and `orderAlertEmail` are used as B1 described.

### 5.4 Webhook events (`webhook-events`)

A hidden list of `provider` and `eventId`, unique together, with `receivedAt`. Terminal can send the same event twice, so each Terminal event id is recorded and a repeat is acknowledged and ignored. Paystack's events have no id, so a repeated Paystack notice is made harmless by 6.5 instead.

### 5.5 Deleting products

B1's delete guard refuses to delete anything another record points at. Orders are never deleted, so counting order lines would lock every product ever sold forever. Order lines don't count: a book or merch item that was ordered can still be deleted, the line's product link empties, and its copied title, option and price stay.

## 6. Checkout and payment

### 6.1 The flow

The cart lives in the browser. The server never trusts its prices: everything is checked and priced again from the database at each step.

```
Browser                        Site server (Payload)                  Outside
-------                        ---------------------                  -------
1 address + cart --POST /api/shop/quotes-->
                               parcel weight from the database + the box
                               ------------------- quotes --------->  Terminal
  courier list <--- stamped quotes ---
                    (or the flat price for the state if Terminal fails)

2 courier + details --POST /api/shop/checkout-->
                               items live? in stock? price again; stamp valid?
                               create the order: Awaiting payment, 30 minutes
                               ------------------- initialise ----->  Paystack
  redirect <--- Paystack payment link ---

3 the customer pays on Paystack's page (Paystack adds its fee there)

4                              <------- charge.success webhook ----  Paystack
                               signature ok? verify with Paystack; amount ok?
                               -> Paid (or Paid late); queue the receipt and staff alert

5 back on the site --GET /api/shop/orders/:reference-->
                               still Awaiting? ask Paystack (same code as 4)
  receipt page <--- order summary ---

6 at 30 minutes, the expiry job asks Paystack once more, then Awaiting -> Expired
```

### 6.2 Delivery quotes: `POST /api/shop/quotes`

- **Takes:** the cart (`collection`, `id`, `option`, `quantity` per line) and the delivery `city` and `state`.
- Each line is checked as in 6.4, and a sold-out item is refused by name. The parcel weight is the sum of the copied weights times quantities, plus the box.
- Terminal is asked for quotes without `persist_data` (P6), so neither a postcode nor a box id is needed yet. Terminal gets 8 seconds to answer; after that it counts as a failure.
- **Gives:** each courier's name, price and estimate with its stamp, cheapest first, and `method: "courier"`. If Terminal fails, times out or returns nothing, it gives the single flat price for the state instead, with its stamp and `method: "flat"`.

### 6.3 Quote stamps

Each quote carries a stamp: an HMAC (a tamper-proof signature made with a secret only the server holds, `QUOTE_STAMP_SECRET`) over the method, carrier, price in kobo, estimate, state, parcel weight and the time it was given. A stamp lasts 30 minutes. At checkout the server works the weight and state out again and checks the stamp against them. A changed price, a different state, a changed cart weight or a lapsed stamp is refused, and the customer is asked to refresh delivery prices. The site stores no quotes.

### 6.4 Checkout: `POST /api/shop/checkout`

- **Takes:** the customer (`name`, `email`, `phone`), the address (`line1`, `line2`, `city`, `state`, `postcode`), the cart, the chosen quote's stamp, and the honeypot field.
- **Checks:** every book is published, has `sellInShop` ticked, and the format exists and is in stock. Every merch item is published, and the option exists and is in stock (or the item is, when it has no options). Quantities are 1 to 10 per line, with at most 20 lines. The email passes B1's email check. The phone is a Nigerian number (`0` and 10 digits, or `+234` and 10 digits), stored as `+234...`.
- **Prices** come from the database. Items total + the stamped delivery price = the order total. A single pricing function does this, with a place for B3's member discount on books.
- **Honeypot:** as in B1, a bot that fills the hidden field gets a normal-looking answer with a made-up reference. Nothing is saved, and Paystack is never called.
- The order is created as Awaiting payment, with a random reference, and Paystack is asked to start the payment: the email, the total in kobo, the reference, the return address `<site>/checkout/complete` and the order id in its metadata. The order is only kept if Paystack accepts. Otherwise the customer is told to try again.
- The expiry job is queued for `expiresAt` (6.7).
- **Gives:** Paystack's payment link and the reference.
- Expected "no"s (sold out, stamp lapsed, a bad phone number) use B1's `Refusal`, so the customer gets a readable message and never a server error.

### 6.5 Marking an order Paid

One function, used by the Paystack webhook, the return-page lookup and the expiry job.

- It verifies the payment with Paystack itself. It doesn't trust what it was handed.
- Paystack must say `success`, in NGN, with `requested_amount` equal to the order total in kobo (pending P1).
- An order Awaiting payment becomes Paid. An Expired order becomes Paid with `paidLate` ticked. Any other status is left alone, and the call changes nothing.
- The status change is a single conditional update ("set Paid where the status is still Awaiting or Expired"). When the webhook and the return page arrive together, only the one that made the change goes on to record `paidAt`, `channel`, `chargedNGN` and `paystackFeeNGN`, add the history entry, and queue the receipt and the staff alert.
- An amount that doesn't match never marks the order Paid. It sends staff an alert with both figures instead.

### 6.6 Paystack's webhook: `POST /api/paystack/webhook`

- The `x-paystack-signature` header must be the HMAC-SHA512 of the raw request body, made with the Paystack secret key. Anything else is refused (401) and nothing is done.
- Only `charge.success` is acted on, through 6.5. Other events are acknowledged and ignored.
- A notice for a reference no order has is acknowledged and logged, so Paystack doesn't keep sending it.
- Paystack's webhook address is set in its dashboard by hand, once per mode (test and live).

### 6.7 The return page and expiry

- **`GET /api/shop/orders/:reference`** backs the page the customer comes back to. If the order is still Awaiting payment, it runs 6.5 first, at most once every 10 seconds per order. It gives the order number, status, `paidLate`, items, totals, the courier and estimate, and the city and state. It gives no street address, phone or email, because the reference sits in a web address that can be shared.
- **Expiry:** checkout queues an `expireOrder` job to run at `expiresAt`. The job asks Paystack once through 6.5. If the order still isn't paid, Awaiting payment becomes Expired. If Paystack can't be reached, the job retries, then expires the order anyway; a payment found later still marks it Paid.

### 6.8 Removing customer details from dead orders

A daily job finds orders that have been Expired for more than 30 days and still hold customer details. It empties the name, email, phone and street address lines, keeps the city, state, items and totals, sets `detailsRemovedAt`, and adds a history entry. Nigeria's Data Protection Act 2023 expects personal data to be kept no longer than its purpose needs, and an unpaid order has none left. Paid orders keep everything, as the record of money taken.

## 7. Fulfilment

### 7.1 The Book courier panel

The panel sits in the order screen's sidebar on desktop and below the order on a phone. It is the same for courier and flat-price orders.

```
Desktop: order screen, panel in the sidebar     Mobile: the panel stacks below the order
+--------------------------+--------------------+ +--------------------------+
| NS-1042   Paid           | Courier            | | NS-1042   Paid           |
| Ada Obi, 0803..., Ikeja  | Customer chose:    | | Ada Obi, 0803...         |
| 2 x The River Girl (PB)  |  GIG, paid ₦3,200  | | 2 x The River Girl (PB)  |
| 1 x NS T-shirt (M)       | Wallet: ₦18,500    | | ...                      |
| Totals ...               | (o) GIG    ₦3,350  | +--------------------------+
| History ...              |  +₦150 covered     | | Courier                  |
| Staff notes [........]   | ( ) DHL    ₦7,900  | | Wallet: ₦18,500          |
|                          | ( ) Kwik   ₦2,800  | | (o) GIG  ₦3,350 +₦150    |
|                          | [ Book courier ]   | | ( ) DHL  ₦7,900          |
+--------------------------+--------------------+ | [ Book courier ]         |
 main column scrolls; sidebar fixed width         +--------------------------+
```

- **Opening the panel** calls `GET /api/orders/:id/courier-options`. Terminal doesn't say how long a quote stays bookable, so the panel always fetches today's quotes, bookable ones this time (full addresses, the box id, `persist_data`), together with the wallet balance. The customer's courier is preselected, with the difference from what the customer paid shown ("+₦150 covered"). Noisy Streetss covers any rise. On a flat-price order nothing is preselected.
- If the address has no postcode (P2), the panel says so and points to the address field.
- If the chosen price is more than the wallet holds, the button is disabled and the panel says how much to top up in Terminal's dashboard.
- **Booking** calls `POST /api/orders/:id/book-courier` with the chosen rate. The server claims the order first, with a single conditional update that sets `bookingStartedAt` only while the order is Paid and unclaimed, so a double click or a second staff member can't book twice. It checks the wallet again and books with the carrier's regular collection (`pickup`), from the Shop settings pickup address, with no insurance. On success it saves the shipment id, tracking number and link, label link (when Terminal gives one), the cost and who booked it, moves the order to Courier booked, and queues the customer's tracking email. On failure it releases the claim and shows Terminal's message. A claim left behind by a booking that never finished (a crash or a timeout) lapses after 5 minutes, and the panel then warns staff to check Terminal's dashboard for a booking before trying again.
- Once booked, the panel shows the carrier, tracking number, tracking link and label to print.
- A booking cancelled in Terminal's dashboard comes back by webhook (7.2), so the admin has no cancel button.

### 7.2 Terminal's webhook: `POST /api/terminal/webhook`

- The `X-Terminal-Signature` header must be the HMAC-SHA512 of the raw body, made with the Terminal secret key. Anything else is refused (401).
- A repeated event id is acknowledged and ignored (5.4). The order is found by its shipment id. An event for an unknown shipment is acknowledged and logged.

| Event | Effect |
|---|---|
| `pickup.completed`, `shipment.in-transit` | In transit |
| `shipment.delivered` | Delivered |
| `shipment.returned` | Returned, and a staff alert |
| `shipment.cancelled`, `pickup.cancelled` | Back to Paid. The shipment details move into the history entry and the shipment fields are cleared, so the order can be booked again |
| `pickup.failed`, `transaction.failed` | A staff alert. The status stays |
| `reconciliation.flagged` | A staff alert: the carrier recorded a heavier parcel, and the extra is billed to the wallet in 7 days unless disputed |
| Anything else | Acknowledged and ignored |

- The webhook address is registered once per environment by a small script in the repository (`POST /v1/webhooks`).

### 7.3 Statuses

```
Awaiting payment --30 min--> Expired
       |                       |
       | paid                  | paid late
       v                       |
     Paid  <-------------------+
       |  ^
       |  | booking cancelled in Terminal
       v  |
 Courier booked   (staff press Book courier)
       |
       v  (webhook)
   In transit
       |
       +--> Delivered  (webhook)
       +--> Returned   (webhook)

 Refunded: set by staff, from Paid, Courier booked or Returned
```

- Webhooks only move an order forward. A late or out-of-order event is written to the history but never drags a Delivered order back to In transit. The one way back is a cancellation, from Courier booked to Paid.
- Staff can set any status by hand (4.3). The history records who did it.

## 8. Email

All shop emails go through the job queue, so a failed send is retried and never fails a webhook or a checkout.

| Email | To | When |
|---|---|---|
| Receipt: order number, items, delivery and estimate, totals including Paystack's fee, a contact line | Customer | The order becomes Paid |
| Tracking: courier, tracking number and link | Customer | The courier is booked |
| New paid order, with "came in late" when `paidLate` | `orderAlertEmail` | The order becomes Paid |
| Amount mismatch, with both figures | `orderAlertEmail` | 6.5 |
| Returned parcel, failed pickup, failed booking charge, heavier-parcel claim | `orderAlertEmail` | 7.2 |

If `orderAlertEmail` is empty, the alert is logged as a warning and not sent. Two customer emails per order sit well inside Resend's free limit of 100 a day, which is shared with B1's form alerts.

## 9. Jobs

| Task | Runs | Does |
|---|---|---|
| `expireOrder` | Once per order, at `expiresAt` | 6.7 |
| `removeExpiredDetails` | Daily | 6.8 |
| `sendShopEmail` | Whenever queued | Section 8 |

These join B1's queue (B1 spec 5.7). In production Vercel Cron runs due jobs every minute. Whether the daily task needs Payload's schedule handling called separately is settled in the plan.

## 10. When things go wrong

| Situation | Result |
|---|---|
| Terminal down, slow or empty at checkout | The flat price for the state |
| Terminal down when staff book | "Couldn't reach Terminal, try again". Nothing changes |
| Paystack can't start the payment | No order is kept. The customer is asked to try again |
| A webhook signature is wrong | Refused (401). Nothing done |
| A webhook for an unknown order or shipment | Acknowledged and logged |
| The paid amount doesn't match | Not marked Paid. Staff alert |
| The last copy sold twice | Both orders Paid. Staff refund one in Paystack and mark it Refunded |
| A payment lands after expiry | Paid, with `paidLate` ticked and noted in the staff alert |
| An email fails | Retried by the job queue |

## 11. Testing and verification

### 11.1 Automated (Vitest)

Paystack and Terminal each sit behind a small client module with one interface, and the tests swap in fakes. Webhook tests sign real request bodies.

- **Unit:** pricing in kobo, quote stamps (good, tampered, lapsed), the state map, the flat-area match, the status rules, phone normalising, both signature checks.
- **Integration:**
  - the quote, checkout and return-page endpoints, including sold-out items, a lapsed stamp, the honeypot and a failed Paystack start
  - marking Paid from each of the three routes, twice at once, late, and with a wrong amount
  - every Terminal event, a repeated event, and an out-of-order event
  - the Book courier claim, a short wallet and a failed booking
  - the expiry job and the details-removal job
  - all three roles against content, orders, the Stock page, Book courier and Shop settings
  - the Stock page changing the live record while leaving a waiting draft unpublished
  - an ordered product still deletable, with its order line keeping its copy
  - orders refusing every delete

### 11.2 Looked at

The Stock page and the Book courier panel are viewed with Playwright at desktop and phone widths, with screenshots looked at, not just measured.

### 11.3 Sandbox run-through

Against Paystack's test mode and Terminal's sandbox, through a tunnel (a temporary public address that forwards to the local dev server, so both services can reach its webhooks):

- a card payment and a bank transfer
- a payment completed after its order expired
- a checkout with Terminal switched off, to force the flat price
- a booking, its label, and the webhooks that follow
- a booking cancelled in Terminal's dashboard

This is also where webhook delivery and retries get checked.

### 11.4 Commands

`npm run lint`, `tsc --noEmit` and `npm run build` all pass, and `npm test` passes in full.

### 11.5 B2 is done when

- every check above passes,
- P1 to P6 are settled and this spec says what was found,
- the migration is committed,
- an order has gone from checkout to Delivered in the sandbox run-through.

## 12. Settings and production

### 12.1 New settings

| Setting | Contents |
|---|---|
| `PAYSTACK_SECRET_KEY` | The test key in development, the live key in production. Also checks Paystack's webhook signatures |
| `TERMINAL_SECRET_KEY` | The sandbox key in development, the live key in production. Also checks Terminal's webhook signatures |
| `TERMINAL_BASE_URL` | `https://sandbox.terminal.africa/v1` in development, `https://api.terminal.africa/v1` in production |
| `QUOTE_STAMP_SECRET` | At least 32 random characters |

The spike's `PAYSTACK_SECRET_TEST_KEY` and `TERMINAL_SECRET_TEST_KEY` in `.env` are renamed to these. B1's production settings check (B1 spec section 11) also reports each of these when missing, and reports a Paystack test key (`sk_test_`) or Terminal's sandbox address set in production.

### 12.2 Before launch (added to the B1 spec's section 11)

- [ ] Turn on "Pass fees to customers" in Paystack's live mode, if P1 confirmed it.
- [ ] Set the live Paystack webhook address in Paystack's dashboard.
- [ ] Register the live Terminal webhook with the script.
- [ ] Fund the Terminal wallet.
- [ ] In Shop settings: the pickup address with its postcode, the flat delivery prices, the parcel box, and `orderAlertEmail`.
- [ ] Real weights on every book format and merch item.
- [ ] Rate limits: the shop's public endpoints (`/api/shop/quotes`, `/api/shop/checkout`, `/api/shop/orders/:reference`) join the open rate-limit decision. Each checkout calls Paystack and each quote calls Terminal.
- [ ] One real order for a small amount after the first deploy, booked and then refunded.

## 13. Changes to the B1 spec

Made in the same change as this spec:

- The header's split becomes B2 (shop) and B3 (members, membership and studio).
- The out-of-scope table: member accounts and the member discount move to B3, and the B2 row becomes orders, Paystack, Terminal and unpaid-order expiry.
- 6.7: "the manuscript form in B2" becomes the manuscript form built with the frontend forms.
- 7.1: the member collection arrives in B3, not B2.
