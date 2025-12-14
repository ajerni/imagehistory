# 📦 Upload Checklist for PHP Server

## Files to Upload

Upload these files to your web server:

```
✅ index.html       - Main gallery page
✅ styles.css       - Styling
✅ app.js           - JavaScript functionality
✅ api.php          - API proxy handler
✅ .htaccess        - Apache configuration (if using Apache)
```

## Optional Files (Don't Upload)

```
❌ proxy-server.py       - Python alternative (not needed)
❌ n8n_example_output.json - Demo data (optional)
❌ README.md              - Documentation (optional)
❌ SETUP_INSTRUCTIONS.md  - Documentation (optional)
❌ DEPLOYMENT.md          - Documentation (optional)
```

## Before Upload

### 1. Configure API Settings

Edit `api.php` lines 8-9:
```php
define('API_URL', 'https://n8n.ernilabs.com/webhook/YOUR-WEBHOOK-ID');
define('API_KEY', 'your-api-key');
```

### 2. Set Demo Mode

Edit `app.js` line 9:
```javascript
useDemoData: false,  // Set to false for production
```

## After Upload

### Test Checklist

1. ✅ Gallery loads: `https://yourdomain.com/`
2. ✅ API works: `https://yourdomain.com/api/images`
3. ✅ Images display correctly
4. ✅ Filters work
5. ✅ Carousel works
6. ✅ No console errors (F12)

## Quick Test Commands

```bash
# Test API endpoint
curl https://yourdomain.com/api/images

# Expected: JSON array with image data

# Test with API key (should work)
curl -H "x-api-key: andi-secret-chats" https://yourdomain.com/api/images
```

## Common Issues

### Issue: .htaccess not working
**Solution:** Enable mod_rewrite
```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

### Issue: API returns 500 error
**Solution:** Check PHP error log
```bash
tail -f /var/log/apache2/error.log
```

### Issue: Images not loading
**Solution:** 
1. Check `useDemoData` setting in `app.js`
2. Verify n8n webhook is active
3. Test API endpoint directly

## Directory Structure on Server

```
/public_html/              (or /var/www/html/)
  ├── index.html
  ├── styles.css
  ├── app.js
  ├── api.php
  └── .htaccess
```

## File Permissions

```bash
chmod 644 index.html styles.css app.js api.php .htaccess
chmod 755 .
```

## Security Notes

- ✅ API key is in `api.php` (server-side, secure)
- ✅ Not exposed to browser/JavaScript
- ✅ CORS headers properly configured
- ❌ Don't commit sensitive keys to Git

## FTP Upload Settings

- **Transfer Mode:** ASCII for `.html`, `.css`, `.js`, `.php`, `.htaccess`
- **OR:** Binary (works for all files)
- **Preserve file structure**

---

🚀 You're ready to deploy!

