# Live GitHub Pages E2E Test Summary

**Deployment URL:** [https://lenin1050.github.io/PDD-trackyo/](https://lenin1050.github.io/PDD-trackyo/)

| Metric | Value |
| --- | --- |
| **Total Tests** | 300 |
| **Passed** | 294 |
| **Failed** | 6 |
| **Skipped** | 0 |
| **Pass Percentage** | 98.0% |

### Failed Tests:
- **test_register_duplicate_email_error** (Authentication & Session)
  *Reason:* TimeoutError: Waiting for element to be located By(xpath, //button[text()='Sign In'])
- **test_sms_empty_parse_error** (SMS Parser Simulator)
  *Reason:* Error: Expected warning toast for empty SMS alert but got: SMS Alert parsed successfully!
- **test_ledger_edit_transaction_details** (Transactions Ledger)
  *Reason:* Error: Failed to edit and save transaction: CSV ledger downloaded successfully!
- **test_wishlist_progress_bar_updates** (Wishlist Goals)
  *Reason:* TimeoutError: Wait timed out after 5037ms
- **test_wishlist_deposit_completion_flow** (Wishlist Goals)
  *Reason:* Error: Completion congrats modal/toast did not trigger: Successfully deposited ₹72000!
- **test_wishlist_delete_goal_action** (Wishlist Goals)
  *Reason:* TimeoutError: Wait timed out after 5193ms

