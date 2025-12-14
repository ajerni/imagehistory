# 🚀 Quick Setup Instructions

## Current Status

✅ Gallery is fully functional with demo data
⚠️ Webhook is active but needs configuration to return image URLs

## To Run the Gallery

### For Production (PHP Server)

1. **Upload files to your PHP web server**
   - Upload: `index.html`, `styles.css`, `app.js`, `api.php`, `.htaccess`
   - Ensure `.htaccess` is enabled (Apache with mod_rewrite)

2. **Open in browser:**
   ```
   https://yourdomain.com/
   ```

### For Local Development

**Option 1: PHP Built-in Server**
```bash
cd /Users/andi/projekte/imageshistory
php -S localhost:8080
```

**Option 2: Python Server (Alternative)**
```bash
cd /Users/andi/projekte/imageshistory
python3 proxy-server.py
```

Then open: `http://localhost:8080`

## What's Working

✅ **Grid View** - Beautiful responsive thumbnail grid
✅ **Carousel View** - Full-screen slideshow with navigation  
✅ **Date Filtering** - Filter by date ranges
✅ **Sorting** - Sort by newest/oldest
✅ **View Toggle** - Switch between grid and carousel
✅ **Image Counter** - Shows total images
✅ **Responsive Design** - Works on all screen sizes
✅ **Keyboard Navigation** - Arrow keys work in carousel
✅ **Smooth Animations** - Beautiful transitions

## To Use Real Images from n8n Webhook

The webhook at `https://n8n.ernilabs.com/webhook/8dae343b-3828-4970-b696-61ec762a8833` currently returns:

```json
[
  {
    "Key": "942e0471-243c-464a-a066-4f21230bd87c",
    "LastModified": "2025-12-14T13:46:46.000Z",
    "Size": "98571",
    ...
  }
]
```

### Option A: Add ImageUrl field (Recommended)

Modify your n8n workflow to include a direct image URL:

```json
[
  {
    "Key": "942e0471-243c-464a-a066-4f21230bd87c",
    "LastModified": "2025-12-14T13:46:46.000Z",
    "Size": "98571",
    "ImageUrl": "https://your-cdn.com/images/942e0471-243c-464a-a066-4f21230bd87c.jpg"
  }
]
```

Then update `app.js` line 113-127:

```javascript
function getImageUrl(image) {
    if (API_CONFIG.useDemoData) {
        const seed = image.Key.substring(0, 8);
        return `https://picsum.photos/seed/${seed}/800/800`;
    }
    
    // Use ImageUrl if available, otherwise construct URL
    return image.ImageUrl || `/api/image/${image.Key}`;
}

// And update the renderGalleryGrid function to pass the full image object
item.innerHTML = `
    <img src="${getImageUrl(image)}" ...>
`;
```

### Option B: S3 Presigned URLs

If images are in S3, generate presigned URLs in your n8n workflow:

```javascript
// In n8n Function node
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
    accessKeyId: 'YOUR_ACCESS_KEY',
    secretAccessKey: 'YOUR_SECRET_KEY',
    region: 'YOUR_REGION'
});

return items.map(item => {
    const params = {
        Bucket: 'your-bucket-name',
        Key: item.json.Key,
        Expires: 3600 // 1 hour
    };
    
    return {
        json: {
            ...item.json,
            ImageUrl: s3.getSignedUrl('getObject', params)
        }
    };
});
```

### Option C: Create Image Endpoint

Add a new webhook in n8n that returns image binary data:
- URL: `https://n8n.ernilabs.com/webhook/8dae343b-3828-4970-b696-61ec762a8833/image`
- Method: GET
- Query param: `key` (the image key)
- Response: Binary image data with `Content-Type: image/jpeg`

Then update `api.php` line 98-109 (or `proxy-server.py` line 72) to use this endpoint format.

## Switching Between Demo and Real Data

In `app.js`, change line 9:

```javascript
useDemoData: true,  // Set to false when using real images
```

## Testing Checklist

- [x] Gallery loads successfully
- [x] Images display in grid view
- [x] Carousel view works
- [x] Carousel navigation (prev/next) works
- [x] Thumbnail navigation in carousel works
- [x] View toggle (grid ↔ carousel) works
- [x] Image counter displays correctly
- [x] Date filtering UI present
- [x] Sort options available
- [x] Responsive design on different screen sizes
- [x] Smooth animations and transitions
- [ ] Lightbox opens on image click (needs manual test)
- [ ] Lightbox navigation works (needs manual test)
- [ ] Date filtering functionality (needs manual test)
- [ ] Real images from webhook (needs webhook configuration)

## Troubleshooting

### Images show "Image unavailable"
- Check that `useDemoData: true` in `app.js`
- Or configure webhook to return ImageUrl fields

### Port 8080 already in use
- Edit `proxy-server.py` and change the port number
- Update browser URL accordingly

### Webhook returns 404
- Ensure the n8n workflow is activated
- Check the webhook URL is correct
- Verify the x-api-key header value

## Next Steps

1. **Configure n8n webhook** to return image URLs (see options above)
2. **Set `useDemoData: false`** in `app.js`
3. **Test with real images**
4. **Customize colors** in `styles.css` if desired

## Support

See `README.md` for full documentation including:
- Feature descriptions
- Customization options
- Keyboard shortcuts
- Future enhancement ideas

---

🎉 Enjoy your beautiful image gallery!

