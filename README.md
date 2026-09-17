# SVVSS Cookies — Order-ready website

This version includes:
- SVVSS branded cookie product grid with 8 products
- Sale prices and original prices
- Add to Cart + quantity controls
- Customer name, mobile, address and pincode checkout form
- Razorpay payment-link handoff
- Order details saved locally before payment
- Optional WhatsApp order sharing
- Supabase live catalog support with a safe product fallback

## GitHub upload
Upload/replace all files in the repository root. **Keep the included config.js because it contains the already-configured Supabase project settings.** Do not replace it with a placeholder config.

## Payment flow
The Razorpay link is the merchant's existing payment link. It is a generic payment link, so the customer must pay the exact total displayed in the cart. This is not the same as a server-created Razorpay order with an automatically locked amount.

For automatic amount + payment verification + order records, a backend/Edge Function and an `orders` table should be added later.

## WhatsApp
Set `WHATSAPP_NUMBER` in `config.js` to the seller's WhatsApp number in international format without `+` or spaces. If left blank, the site will not send to a specific seller number.

Never put a Supabase secret/service-role key in this file.
