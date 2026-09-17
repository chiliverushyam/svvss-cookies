SVVSS Cookies — Complete Professional Starter

Files:
index.html
styles.css
app.js
config.js
supabase-client.js
customer-live.js

Before publishing:
1. Put your Supabase Project URL and Publishable/Anon key in config.js.
2. Never put the Supabase Secret/service-role key in a public site.
3. Razorpay link is the previously provided SVVSS payment link.
4. Upload all files to GitHub repository root.
5. Settings → Pages → Deploy from branch → main → /(root).

Expected Supabase tables:
products: id, name, category, price, weight, image_url, active, created_at
settings: id, ...
serviceable_pincodes: pincode, active
