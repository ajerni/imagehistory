# 🔧 Troubleshooting - Request Not Triggered

## Issue: Page doesn't make HTTP request to n8n webhook

### Quick Fix (Works Immediately)

**Use the direct PHP endpoint instead of URL rewriting:**

1. Upload `api-images.php` to your server
2. Edit `app.js` line 9 to use:
   ```javascript
   url: '/api-images.php',
   ```
3. Re-upload `app.js`

This bypasses the need for `.htaccess` URL rewriting!

---

## Diagnosis Steps

### Step 1: Test API Connection

Upload `api-test.php` and visit:
```
https://yourdomain.com/api-test.php
```

This will show:
- ✅ PHP version
- ✅ cURL availability
- ✅ Connection to n8n webhook
- ✅ Sample response

### Step 2: Check Browser Console

1. Open your gallery page
2. Press F12 (Developer Tools)
3. Go to **Console** tab
4. Look for errors (red text)
5. Go to **Network** tab
6. Refresh the page
7. Look for requests to `/api/images` or `/api-images.php`

### Step 3: Test Direct API Call

Visit directly:
```
https://yourdomain.com/api-images.php
```

You should see JSON with your images!

---

## Common Issues & Solutions

### Issue 1: .htaccess Not Working

**Symptoms:**
- Request to `/api/images` returns 404
- No requests visible in Network tab

**Solution A - Use Direct PHP File (Easiest):**
```javascript
// In app.js
url: '/api-images.php',
```

**Solution B - Enable mod_rewrite:**
```bash
# SSH into your server
sudo a2enmod rewrite
sudo systemctl restart apache2
```

Then edit Apache config:
```apache
<Directory /var/www/html>
    AllowOverride All
</Directory>
```

### Issue 2: CORS Error

**Symptoms:**
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**Solution:**
Both `api.php` and `api-images.php` have CORS headers. If you see this error:
1. Check the file is being executed (not just served as text)
2. Verify PHP is processing the file

### Issue 3: No Request Made at All

**Symptoms:**
- Nothing in Network tab
- No console errors

**Check:**
1. JavaScript errors preventing execution
2. `useDemoData` is set to `false`
3. Page is fully loaded

### Issue 4: 500 Internal Server Error

**Symptoms:**
- Request made but returns 500

**Check PHP Error Log:**
```bash
tail -f /var/log/apache2/error.log
# or
tail -f /var/log/php-fpm/error.log
```

**Common causes:**
- cURL not installed
- Syntax error in PHP file
- File permissions

---

## Two Approaches Comparison

### Approach A: Direct PHP File (Recommended for simplicity)

**Pros:**
- ✅ Works immediately
- ✅ No .htaccess needed
- ✅ Easier to debug

**Cons:**
- ❌ URL looks like `api-images.php` instead of `api/images`

**Use this in app.js:**
```javascript
url: '/api-images.php',
```

### Approach B: URL Rewriting with .htaccess

**Pros:**
- ✅ Clean URLs like `/api/images`
- ✅ More professional

**Cons:**
- ❌ Requires mod_rewrite enabled
- ❌ Requires .htaccess working
- ❌ More complex to debug

**Use this in app.js:**
```javascript
url: '/api/images',
```

---

## Verify Setup Checklist

- [ ] Uploaded `api-images.php` to server
- [ ] Changed `app.js` to use `/api-images.php`
- [ ] Set `useDemoData: false` in `app.js`
- [ ] Tested `api-test.php` - shows successful connection
- [ ] Tested `api-images.php` directly - returns JSON
- [ ] Browser console shows no errors
- [ ] Network tab shows request to api-images.php
- [ ] Gallery displays images!

---

## Testing URLs

Test these URLs in your browser (replace yourdomain.com):

1. **Test API connection:**
   ```
   https://yourdomain.com/api-test.php
   ```
   Expected: JSON with test info and image data

2. **Test API endpoint:**
   ```
   https://yourdomain.com/api-images.php
   ```
   Expected: JSON array with images and ImageUrl fields

3. **Test gallery:**
   ```
   https://yourdomain.com/
   ```
   Expected: Beautiful gallery with your images

---

## Still Not Working?

### Check These:

1. **PHP Version**
   ```bash
   php -v
   ```
   Need: PHP 7.0 or higher

2. **cURL Extension**
   ```bash
   php -m | grep curl
   ```
   Should show: curl

3. **File Permissions**
   ```bash
   chmod 644 api-images.php api-test.php app.js
   ```

4. **n8n Webhook Active**
   ```bash
   curl -H "x-api-key: andi-secret-chats" \
     https://n8n.ernilabs.com/webhook/8dae343b-3828-4970-b696-61ec762a8833
   ```
   Should return JSON with images

---

## Contact Points

If still stuck, check:
- Browser Console (F12) → Console tab → errors?
- Browser Console (F12) → Network tab → which requests?
- `api-test.php` → what does it show?
- PHP error log → any errors?

Include this info when asking for help!

