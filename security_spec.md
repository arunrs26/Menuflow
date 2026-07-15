# Security Specification & Threat Model

## Data Invariants
1. **Menu Item Integrity**: Only verified administrators can add, modify, or delete menu items. Price must be a positive number.
2. **Settings Protection**: Global restaurant settings can only be altered by verified administrators.
3. **Offer Validity**: Promotional offer codes can only be created or modified by administrators.
4. **Order State Security**: Customers can create orders, but only administrators can update order status (e.g., from 'pending' to 'preparing').
5. **Reservation Protection**: Anyone can request a table booking, but only administrators can change its status.

---

## The "Dirty Dozen" Payloads
These payloads attempt to bypass authorization or inject malformed data, and must be rejected.

1. **Payload 1 (Privilege Escalation - Create Menu)**: A non-admin user attempts to create a new menu item.
2. **Payload 2 (Privilege Escalation - Update Price)**: A non-admin user attempts to change a menu item's price.
3. **Payload 3 (State Poisoning - Bulk Discount)**: A non-admin user attempts to create a 100% discount offer code.
4. **Payload 4 (State Bypass - Auto-approve Order)**: A guest customer attempts to create an order pre-marked as `delivered`.
5. **Payload 5 (Identity Theft - Modify Customer Name)**: An unauthorized user attempts to rename a customer's order.
6. **Payload 6 (Reservation Hijacking - Confirm Booking)**: A guest customer attempts to book a table with state `confirmed`.
7. **Payload 7 (Denial of Wallet - Long Item ID)**: Attempting to create a menu item with an ID longer than 128 characters.
8. **Payload 8 (Denial of Wallet - Massive Payload)**: Attempting to update a menu item with an extremely large description.
9. **Payload 9 (Malicious Status Jump)**: A user attempts to update order status to an invalid status string.
10. **Payload 10 (Email Spoofing)**: A user claiming to be the admin but with `email_verified` as `false`.
11. **Payload 11 (Settings Hijacking)**: A non-admin attempting to change the WhatsApp contact number to redirect payments.
12. **Payload 12 (Orphaned Order Creation)**: Placing an order with negative totals or negative item quantities.

---

## Test Cases (Expected: PERMISSION_DENIED)
We draft the rules below to address all 12 threats.
