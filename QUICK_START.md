# 🚀 Quick Start - Connect Real Images

## What You Need to Do

### Step 1: Update n8n Workflow (5 minutes)

Add **ONE node** to your n8n workflow to generate image URLs.

#### Easiest Method: Add a Code Node

After your "Download a file" node, add a **Code** node with this:

```javascript
// Get AWS SDK (built into n8n)
const AWS = require('aws-sdk');

// Configure S3 with your credentials
const s3 = new AWS.S3({
  region: 'eu-central-1'  // Change to your bucket's region
});

// Process all items
const items = $input.all();

const output = items.map(item => {
  // Generate a presigned URL (temporary download link)
  const presignedUrl = s3.getSignedUrl('getObject', {
    Bucket: 'andierni-images-112622707427',
    Key: item.json.Key,
    Expires: 3600  // URL valid for 1 hour
  });
  
  // Add ImageUrl to the JSON
  return {
    json: {
      ...item.json,
      ImageUrl: presignedUrl
    }
  };
});

return output;
```

**Important:** Make sure your n8n instance has AWS credentials configured!

#### Test It

Execute the workflow and check the output. You should see:

```json
{
  "Key": "942e0471-243c-464a-a066-4f21230bd87c",
  "LastModified": "2025-12-14T13:46:46.000Z",
  "Size": "98571",
  "ImageUrl": "https://andierni-images-112622707427.s3.eu-central-1.amazonaws.com/942e0471-243c-464a-a066-4f21230bd87c?X-Amz-Algorithm=..."
}
```

Copy one ImageUrl and paste it in your browser - you should see the image! ✅

---

### Step 2: Update Gallery Settings (1 minute)

Edit `app.js` line 9:

```javascript
useDemoData: false,  // Change from true to false
```

**That's it!** The rest is already configured. ✅

---

## Test Your Gallery

### Option 1: Upload to Your PHP Server

Upload these 5 files:
- `index.html`
- `styles.css`
- `app.js` (with `useDemoData: false`)
- `api.php`
- `.htaccess`

Visit: `https://yourdomain.com/`

### Option 2: Test Locally

```bash
cd /Users/andi/projekte/imageshistory
php -S localhost:8080
```

Visit: `http://localhost:8080`

---

## Visual Flow

```
┌─────────────────────────────────────────────────────┐
│                    n8n Workflow                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. Webhook receives request                        │
│  2. Get many files (list S3 objects)               │
│  3. Download file metadata                          │
│  4. ⭐ NEW: Generate presigned URLs ⭐            │
│  5. Return JSON with ImageUrl fields                │
│                                                     │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ Returns JSON with ImageUrl:
                   │ {
                   │   "Key": "...",
                   │   "ImageUrl": "https://s3.../..."
                   │ }
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│              PHP Server (api.php)                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. Receives request from browser                   │
│  2. Adds CORS headers                              │
│  3. Forwards to n8n webhook with API key           │
│  4. Returns response to browser                     │
│                                                     │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│          Gallery (app.js in Browser)                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. Fetches JSON from /api/images                  │
│  2. Reads ImageUrl from each item                  │
│  3. Displays images using ImageUrl                 │
│  4. Grid, Carousel, Lightbox all work! 🎉         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Expected Result

### Before (Demo Mode)
```javascript
useDemoData: true
```
- ✅ Gallery works
- ❌ Shows placeholder images from Picsum Photos
- ❌ Not your real S3 images

### After (Real Images)
```javascript
useDemoData: false
```
- ✅ Gallery works
- ✅ Shows YOUR real S3 images!
- ✅ Images load directly from S3 with presigned URLs
- ✅ Grid, Carousel, Lightbox all display your photos

---

## Troubleshooting

### "AWS is not defined" in n8n

**Problem:** AWS SDK not available

**Solution:** Use n8n's built-in AWS S3 node instead:
1. Add "AWS S3" node
2. Operation: "Get Presigned URL"
3. Configure bucket and key
4. Connect to response

### ImageUrl not in webhook response

**Problem:** Code node not added or not working

**Solution:**
1. Check code node is connected to webhook response
2. Test the node execution
3. Verify AWS credentials in n8n settings

### Images still show placeholders

**Problem:** `useDemoData` still set to `true`

**Solution:** Edit `app.js` line 9, set to `false`, and re-upload

### "Access Denied" on image URLs

**Problem:** S3 permissions issue

**Solution:** 
1. Verify your AWS IAM user has `s3:GetObject` permission
2. Check presigned URL hasn't expired
3. Verify bucket name is correct

---

## Summary

1. ✅ **Add Code node** in n8n to generate presigned URLs
2. ✅ **Set `useDemoData: false`** in `app.js`
3. ✅ **Upload to your server** or test locally
4. 🎉 **Enjoy your beautiful gallery with real images!**

---

Need more help? Check:
- `N8N_SETUP_GUIDE.md` - Detailed n8n instructions
- `DEPLOYMENT.md` - Server deployment guide
- `README.md` - Complete documentation

