# 📸 n8n Setup Guide - Add Image URLs to Webhook Response

## Current Situation

Your n8n workflow returns this JSON:
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

But we need to add `ImageUrl` fields so the gallery can display the images.

## 🎯 Goal

Make the webhook return:
```json
[
  {
    "Key": "942e0471-243c-464a-a066-4f21230bd87c",
    "LastModified": "2025-12-14T13:46:46.000Z",
    "Size": "98571",
    "ImageUrl": "https://s3.amazonaws.com/your-bucket/942e0471-243c-464a-a066-4f21230bd87c?X-Amz-Algorithm=..."
  }
]
```

## 🔧 Step-by-Step Setup in n8n

### Option A: Generate S3 Presigned URLs (Recommended)

#### Step 1: Add "AWS S3" Node After "Download a file"

1. **Click the + button** after your "Download a file" node
2. **Search for** "AWS S3"
3. **Select** the AWS S3 node
4. **Operation:** Select "Get Presigned URL"

#### Step 2: Configure the S3 Presigned URL Node

```
Node Settings:
- Credential: [Select your AWS IAM credential]
- Resource: S3
- Operation: Get Presigned URL
- Bucket Name: andierni-images-112622707427
- File Key: {{ $json.Key }}
- Expires: 3600 (1 hour, adjust as needed)
```

#### Step 3: Add "Code" Node to Merge Data

1. **Click the + button** after the S3 node
2. **Search for** "Code"
3. **Select** the Code node
4. **Mode:** Run Once for All Items

Paste this code:
```javascript
// Get the items
const items = $input.all();

// Transform each item
const output = items.map(item => {
  return {
    json: {
      Key: item.json.Key,
      LastModified: item.json.LastModified,
      ETag: item.json.ETag,
      Size: item.json.Size,
      StorageClass: item.json.StorageClass,
      ChecksumAlgorithm: item.json.ChecksumAlgorithm,
      ChecksumType: item.json.ChecksumType,
      ImageUrl: item.json.presignedUrl  // This comes from the S3 node
    }
  };
});

return output;
```

#### Step 4: Connect to Webhook Response

1. **Connect** the Code node to your "Webhook" Response node
2. **Test** the workflow

---

### Option B: Simple Code-Only Approach (Using AWS SDK)

If you prefer to do it all in one node:

#### Add "Code" Node After "Get many files"

Replace your webhook response with this Code node:

```javascript
// Import AWS SDK (available in n8n)
const AWS = require('aws-sdk');

// Configure S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'eu-central-1'  // Change to your region
});

// Get all items
const items = $input.all();

// Generate presigned URLs
const output = items.map(item => {
  const params = {
    Bucket: 'andierni-images-112622707427',
    Key: item.json.Key,
    Expires: 3600 // URL valid for 1 hour
  };
  
  const presignedUrl = s3.getSignedUrl('getObject', params);
  
  return {
    json: {
      ...item.json,
      ImageUrl: presignedUrl
    }
  };
});

return output;
```

#### Set Environment Variables

In n8n settings, add:
- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key

---

### Option C: Make Images Publicly Accessible (Easiest but Less Secure)

If you can make your S3 bucket public for these images:

#### Step 1: Make S3 Objects Public

1. Go to AWS S3 Console
2. Select your bucket: `andierni-images-112622707427`
3. Go to **Permissions** tab
4. Edit **Bucket Policy** and add:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::andierni-images-112622707427/*"
    }
  ]
}
```

#### Step 2: Add Code Node in n8n

```javascript
const items = $input.all();

const output = items.map(item => {
  // Construct public URL
  const imageUrl = `https://andierni-images-112622707427.s3.eu-central-1.amazonaws.com/${item.json.Key}`;
  
  return {
    json: {
      ...item.json,
      ImageUrl: imageUrl
    }
  };
});

return output;
```

⚠️ **Warning:** This makes all images in your bucket publicly accessible!

---

## 🧪 Testing Your Setup

### Test the Webhook

```bash
curl -H "x-api-key: andi-secret-chats" \
  https://n8n.ernilabs.com/webhook/8dae343b-3828-4970-b696-61ec762a8833
```

Expected response with ImageUrl:
```json
[
  {
    "Key": "942e0471-243c-464a-a066-4f21230bd87c",
    "LastModified": "2025-12-14T13:46:46.000Z",
    "Size": "98571",
    "ImageUrl": "https://andierni-images-112622707427.s3.eu-central-1.amazonaws.com/942e0471-243c-464a-a066-4f21230bd87c?..."
  }
]
```

### Test an Image URL

Copy one of the ImageUrl values and paste it in your browser. You should see the image!

---

## 🎨 Update the Gallery Code

Once your webhook returns ImageUrl fields, update `app.js`:

### Change 1: Update API Config (Line ~9)
```javascript
const API_CONFIG = {
    url: '/api/images',
    headers: {},
    useDemoData: false,  // ✅ Set to false now!
    imageBaseUrl: 'https://n8n.ernilabs.com/webhook/8dae343b-3828-4970-b696-61ec762a8833'
};
```

### Change 2: Update getImageUrl Function (Line ~126)
```javascript
function getImageUrl(imageKey, imageUrl) {
    if (API_CONFIG.useDemoData) {
        const seed = imageKey.substring(0, 8);
        return `https://picsum.photos/seed/${seed}/800/800`;
    }
    
    // Use the ImageUrl from the API response
    return imageUrl || `/api/image/${imageKey}`;
}
```

### Change 3: Update renderGalleryGrid Function (Line ~230)

Find this line:
```javascript
<img src="${getImageUrl(image.Key)}"
```

Change it to:
```javascript
<img src="${getImageUrl(image.Key, image.ImageUrl)}"
```

### Change 4: Update renderCarousel Function (Line ~270)

Find:
```javascript
elements.carouselImage.src = getImageUrl(image.Key);
```

Change to:
```javascript
elements.carouselImage.src = getImageUrl(image.Key, image.ImageUrl);
```

### Change 5: Update updateLightboxImage Function (Line ~330)

Find:
```javascript
elements.lightboxImage.src = getImageUrl(image.Key);
```

Change to:
```javascript
elements.lightboxImage.src = getImageUrl(image.Key, image.ImageUrl);
```

### Change 6: Update renderCarouselThumbnails Function (Line ~365)

Find:
```javascript
<img src="${getImageUrl(image.Key)}"
```

Change to:
```javascript
<img src="${getImageUrl(image.Key, image.ImageUrl)}"
```

---

## 📊 Workflow Diagram

```
┌──────────────────┐
│  Webhook Trigger │
│  (GET request)   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Get Many Files  │
│  (List S3 files) │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Download Files  │
│  (Get metadata)  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Generate URLs   │  ⬅️ ADD THIS!
│  (S3 presigned)  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Format JSON     │  ⬅️ ADD THIS!
│  (Add ImageUrl)  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Webhook Response │
└──────────────────┘
```

---

## 🐛 Troubleshooting

### "presignedUrl is undefined"

**Problem:** The S3 node isn't generating URLs correctly

**Solution:** 
- Check your AWS credentials
- Verify bucket name is correct
- Ensure the Key field is properly mapped

### "Access Denied" in Image URLs

**Problem:** S3 permissions issue

**Solution:**
- Verify your IAM user has `s3:GetObject` permission
- Check the bucket policy allows access
- If using presigned URLs, ensure they haven't expired

### Images Still Show Placeholders

**Problem:** Gallery not receiving ImageUrl field

**Solution:**
1. Test webhook directly: `curl -H "x-api-key: andi-secret-chats" https://your-webhook-url`
2. Verify ImageUrl is in the response
3. Check browser console for errors
4. Verify `useDemoData: false` in app.js

---

## 🎉 Success Checklist

- [ ] Webhook returns JSON with ImageUrl fields
- [ ] Image URLs work when pasted in browser
- [ ] Updated `useDemoData: false` in app.js
- [ ] Updated `getImageUrl()` to use ImageUrl parameter
- [ ] Gallery displays real images!

---

## 💡 Best Practices

1. **Presigned URL Expiration**: Set to 3600 seconds (1 hour) - balance between security and usability
2. **Caching**: Consider adding CloudFront in front of your S3 bucket for better performance
3. **Security**: Keep bucket private, use presigned URLs instead of public access
4. **Monitoring**: Set up CloudWatch to monitor S3 access patterns

---

Need help with a specific step? Let me know which option you chose (A, B, or C) and where you're stuck!

