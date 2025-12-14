# 📸 Image Gallery - Beautiful AI images Collection

- **This gallery displays all the AI images created at [image.andierni.ch](https://image.andierni.ch) and is served at [imagegallery.andierni.ch](https://imagegallery.andierni.ch)**

## ✨ Features

- **Grid View**: Responsive thumbnail grid with hover effects
- **Carousel View**: Full-screen image slideshow with navigation
- **Lightbox**: Click any image to view in enlarged mode
- **Date Filtering**: Filter images by today, this week, this month, or custom date range
- **Sorting**: Sort images by newest or oldest first
- **Responsive Design**: Works beautifully on desktop, tablet, and mobile
- **Smooth Animations**: Elegant transitions and hover effects
- **Keyboard Navigation**: Use arrow keys to navigate in lightbox and carousel modes

## 🚀 Getting Started

### Running the Gallery

#### Option 1: PHP Server (Recommended for Production)

1. Upload all files to your PHP web server
2. Ensure `.htaccess` is enabled (Apache with mod_rewrite)
3. Open your browser and navigate to your domain:
```
https://yourdomain.com/imageshistory/
```

#### Option 2: Local PHP Development Server

1. Start PHP's built-in server:
```bash
cd /Users/andi/projekte/imageshistory
php -S localhost:8080
```

2. Open your browser and navigate to:
```
http://localhost:8080
```

#### Option 3: Python Server (Alternative)

If you prefer Python for local development:
```bash
python3 proxy-server.py
```

## ⚙️ Configuration

### Using Demo Data

To test the gallery with placeholder images, set `useDemoData: true` in `app.js`:

```javascript
const API_CONFIG = {
    url: '/api/images',
    headers: {},
    useDemoData: true,  // Set to true for demo mode
    imageBaseUrl: 'https://n8n.ernilabs.com/webhook/8dae343b-3828-4970-b696-61ec762a8833'
};
```

### Using Real n8n Webhook

⚠️ **Important**: The n8n webhook currently returns image metadata but not the actual images or image URLs.

To make the gallery work with real images, your n8n workflow needs to be configured to either:

#### Option 1: Return Image URLs (Recommended)
Modify the workflow to include image URLs in the response:
```json
[
  {
    "Key": "942e0471-243c-464a-a066-4f21230bd87c",
    "LastModified": "2025-12-14T13:46:46.000Z",
    "Size": "98571",
    "ImageUrl": "https://your-s3-bucket.amazonaws.com/path/to/image.jpg"
  }
]
```

Then update `app.js`:
```javascript
function getImageUrl(imageKey, imageUrl) {
    if (API_CONFIG.useDemoData) {
        const seed = imageKey.substring(0, 8);
        return `https://picsum.photos/seed/${seed}/800/800`;
    }
    // Use the URL from the API response
    return imageUrl || `/api/image/${imageKey}`;
}
```

#### Option 2: Create Separate Image Endpoint
Add another webhook endpoint in n8n that accepts an image key and returns the image data:
- URL: `https://n8n.ernilabs.com/webhook/8dae343b-3828-4970-b696-61ec762a8833/image/{key}`
- Returns: Image data with Content-Type: image/jpeg

Update `api.php` (line 98-109) or `proxy-server.py` to use this endpoint format.

#### Option 3: Generate Presigned S3 URLs
If your images are stored in S3, modify the n8n workflow to generate presigned URLs for each image:
```javascript
// In n8n Function node
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

items.map(item => {
  const params = {
    Bucket: 'your-bucket',
    Key: item.json.Key,
    Expires: 3600  // URL valid for 1 hour
  };
  return {
    ...item.json,
    ImageUrl: s3.getSignedUrl('getObject', params)
  };
});
```

## 📁 Project Structure

```
imageshistory/
├── index.html          # Main HTML structure
├── styles.css          # Beautiful, modern styling
├── app.js              # Gallery functionality and API integration
├── api.php             # PHP API proxy for CORS handling
├── .htaccess           # Apache URL rewriting and caching
├── proxy-server.py     # Python proxy server (alternative)
├── n8n_example_output.json  # Sample API response
└── README.md           # This file
```

## 🎨 Customization

### Changing Colors

Edit the CSS variables in `styles.css`:

```css
:root {
    --primary-color: #6366f1;      /* Main accent color */
    --secondary-color: #8b5cf6;    /* Secondary accent */
    --dark-bg: #0f172a;            /* Background color */
    --card-bg: #1e293b;            /* Card background */
}
```

### Adjusting Grid Layout

Modify the grid template in `styles.css`:

```css
.gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
}
```

## 🔧 Troubleshooting

### Images Not Loading

1. **Check the webhook is active**:
   ```bash
   curl -H "x-api-key: andi-secret-chats" https://n8n.ernilabs.com/webhook/8dae343b-3828-4970-b696-61ec762a8833
   ```

2. **Verify proxy server is running**: You should see console output when the gallery loads

3. **Check browser console**: Open Developer Tools (F12) and check for error messages

4. **Use demo mode**: Set `useDemoData: true` in `app.js` to test with placeholder images

### CORS Errors

The proxy handles CORS automatically. If you see CORS errors:
- **PHP**: Ensure `.htaccess` is working and mod_rewrite is enabled
- **Python**: Ensure `proxy-server.py` is running (not the simple Python HTTP server)
- Check that API requests go through `/api/images` and not directly to the webhook

### Port Already in Use

**For PHP built-in server:**
```bash
php -S localhost:8888  # Use any available port
```

**For Python proxy server:**
Edit `proxy-server.py` line 124:
```python
run_server(8888)  # Change to any available port
```

## 🎯 Keyboard Shortcuts

- **Escape**: Close lightbox
- **Left Arrow**: Previous image (in lightbox or carousel)
- **Right Arrow**: Next image (in lightbox or carousel)

## 📝 Future Enhancements

- [ ] Infinite scroll for large galleries
- [ ] Image search functionality
- [ ] Download images option
- [ ] Share images via social media
- [ ] Bulk selection and operations
- [ ] Image metadata display (EXIF data)
- [ ] Slideshow autoplay mode
- [ ] Thumbnail size options
- [ ] Dark/Light theme toggle

## 🙏 Credits

- Icons: SVG inline icons
- Fonts: Inter from Google Fonts
- Demo Images (when in demo mode): Picsum Photos



