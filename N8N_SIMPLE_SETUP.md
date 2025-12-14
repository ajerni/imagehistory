# 🚀 n8n Simple Setup - No AWS SDK Required!

Since your n8n doesn't have "Get Presigned URL" operation, let's use simpler approaches.

---

## ✅ Option 1: Public S3 URLs (Easiest - Recommended)

### Step 1: Add Code Node After "Download a file"

Add a **Code** node with this simple code:

```javascript
// Get all items from previous node
const items = $input.all();

// Add direct S3 URL to each item
const output = items.map(item => {
  // Construct public S3 URL
  const region = 'eu-central-1';  // Change if your bucket is in different region
  const bucket = 'andierni-images-112622707427';
  const key = item.json.Key;
  
  // Direct S3 URL format
  const imageUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  
  return {
    json: {
      ...item.json,
      ImageUrl: imageUrl
    }
  };
});

return output;
```

### Step 2: Make S3 Objects Public

**Option A: Make Specific Objects Public (Safer)**

When uploading images to S3, set ACL to public-read.

**Option B: Bucket Policy (All Objects Public)**

In AWS S3 Console:
1. Go to your bucket: `andierni-images-112622707427`
2. **Permissions** tab
3. **Bucket Policy** → Edit
4. Add this policy:

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

5. Save changes

### Step 3: Test

Execute your workflow and check the output:
```json
{
  "Key": "942e0471-243c-464a-a066-4f21230bd87c",
  "ImageUrl": "https://andierni-images-112622707427.s3.eu-central-1.amazonaws.com/942e0471-243c-464a-a066-4f21230bd87c"
}
```

Copy the ImageUrl and paste in browser - should show the image!

---

## ✅ Option 2: Serve Images Through n8n Webhook

Since your n8n already downloads the binary data, serve it directly!

### Create a Second Webhook for Images

#### Workflow 1: List Images (Current)
```
Webhook GET /8dae343b-3828-4970-b696-61ec762a8833
  ↓
Get Many Files
  ↓
Code: Add image URLs pointing to Workflow 2
  ↓
Return JSON
```

#### Workflow 2: Get Single Image (New)
```
Webhook GET /8dae343b-3828-4970-b696-61ec762a8833/image/:key
  ↓
Download File from S3 (using key from URL)
  ↓
Return Binary Data
```

### Setup Workflow 2:

1. **New Webhook Node**
   - Method: GET
   - Path: `/8dae343b-3828-4970-b696-61ec762a8833/image/:key`
   - Response Mode: Last Node

2. **AWS S3 Node**
   - Operation: Download
   - Bucket: `andierni-images-112622707427`
   - File Key: `{{ $json.query.key }}`
   - Put Output in Field: `data`

3. **Respond to Webhook Node**
   - Response Body: `{{ $binary.data }}`
   - Options → Response Headers:
     ```
     Content-Type: image/jpeg
     ```

### Update Workflow 1 Code Node:

```javascript
const items = $input.all();
const webhookBase = 'https://n8n.ernilabs.com/webhook/8dae343b-3828-4970-b696-61ec762a8833';

const output = items.map(item => {
  return {
    json: {
      ...item.json,
      ImageUrl: `${webhookBase}/image/${item.json.Key}`
    }
  };
});

return output;
```

---

## ✅ Option 3: Return Everything as Base64 (Simple but Large)

If you have few images, encode them in the JSON response:

```javascript
const items = $input.all();

const output = items.map(item => {
  // Get binary data
  const binaryData = item.binary.data;
  
  // Convert to base64
  const base64 = binaryData.toString('base64');
  
  return {
    json: {
      ...item.json,
      ImageUrl: `data:image/jpeg;base64,${base64}`
    }
  };
});

return output;
```

⚠️ **Warning:** This makes the JSON response very large!

---

## 📊 Comparison

| Option | Pros | Cons |
|--------|------|------|
| **Option 1: Public S3** | ✅ Simple<br>✅ Fast<br>✅ CDN available | ⚠️ Images are public |
| **Option 2: n8n Proxy** | ✅ Secure<br>✅ Access control | ⚠️ More complex<br>⚠️ n8n bandwidth |
| **Option 3: Base64** | ✅ Very simple | ❌ Large response<br>❌ No caching |

---

## 🎯 My Recommendation: Option 1 (Public S3)

**Why?**
- ✅ Simplest to set up (just one Code node)
- ✅ Fast loading
- ✅ Can add CloudFront CDN later
- ✅ Standard approach for image galleries

**Is it secure?**
- Images are identified by UUID (hard to guess)
- You can still control who sees the gallery (the main page)
- Common for image galleries to have public images

---

## 🧪 Testing Option 1

### Step 1: Add Code Node
Paste the code from Option 1 above.

### Step 2: Test Without Making Public First
Execute workflow and copy one ImageUrl. Try it in browser.
- If it works → Great, your objects are already public!
- If you get "Access Denied" → Follow Step 3

### Step 3: Make Bucket/Objects Public
Follow the bucket policy instructions above.

### Step 4: Test Again
The ImageUrl should now work in your browser!

---

## 🎨 Gallery Code (Already Updated!)

Your `app.js` is already configured to look for `ImageUrl` field!

Just make sure:
- ✅ `useDemoData: false` in app.js
- ✅ Upload updated `app.js` to server
- ✅ Upload `api-images.php` to server
- ✅ n8n returns `ImageUrl` in JSON

---

## 🐛 Troubleshooting

### "Access Denied" when visiting ImageUrl

**Solution:** Make objects public using bucket policy above.

### Images don't load in gallery

1. Test `api-images.php` directly: `https://aetest.andierni.ch/api-images.php`
2. Check if ImageUrl is in the response
3. Copy one ImageUrl and test in browser
4. Check browser console for errors

### S3 Region is Different

Check your bucket region:
```
https://s3.console.aws.amazon.com/s3/buckets/andierni-images-112622707427
```

Update the region in the Code node:
```javascript
const region = 'us-east-1';  // or eu-west-1, etc.
```

---

## ✅ Quick Start Checklist

- [ ] Add Code node after "Download a file" in n8n
- [ ] Paste the simple code (Option 1)
- [ ] Connect to Webhook Response
- [ ] Execute workflow and test
- [ ] If "Access Denied", add bucket policy
- [ ] Test ImageUrl in browser - should show image
- [ ] Upload updated files to server
- [ ] Test gallery at https://aetest.andierni.ch/

---

Let me know which option you prefer and I'll help you set it up!

