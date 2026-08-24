# Hi-calories Admin — Ver 3.2 and 3.3 release notes

## Admin changes

- Moderation workspace for sourced micronutrient drafts.
- Quality overview for pending foods, ingredients missing images and aggregate
  AI correction feedback.
- Ver 3.3 quality metrics show provider/category/confidence bands, active
  barcode misses and image suggestion approval/rejection counts.

The quality view deliberately receives only aggregates. It never receives
meal images, meal details, raw barcodes, owner identifiers or credentials.

## Deployment and verification

Vercel deploys `main`. Configure the backend base URL using the Vercel
environment configuration rather than hardcoding a production host in the
client. Run `npm run verify` before release, then confirm the production
Admin endpoint responds with HTTP 200 and authenticated Admin data comes from
the intended Render backend.
