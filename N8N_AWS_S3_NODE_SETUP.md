# 🔧 n8n Setup - AWS S3 Node Method

## Your n8n Workflow Configuration

Since `aws-sdk` module is disallowed in your n8n instance, use the built-in AWS S3 node instead.

---

## 📋 Step-by-Step Setup

### Step 1: Add AWS S3 Node

After your **"Download a file"** node:

1. Click the **+** button
2. Search for **"AWS S3"**
3. Select the **AWS S3** node

### Step 2: Configure AWS S3 Node

**Node Settings:**

| Setting | Value |
|---------|-------|
| **Credential** | Select/Create your AWS IAM credential |
| **Resource** | S3 |
| **Operation** | **Get Presigned URL** ⭐ |
| **Bucket Name** | `andierni-images-112622707427` |
| **File Key** | `{{ $json.Key }}` |
| **Expires** | `3600` (1 hour) |

**Important:** Make sure you select **"Get Presigned URL"** as the operation!

### Step 3: Configure AWS Credential

If you haven't set up AWS credentials yet:

1. Click **"Select Credential"** → **"Create New"**
2. Choose **"AWS"**
3. Fill in:
   - **Access Key ID**: Your AWS access key
   - **Secret Access Key**: Your AWS secret key
   - **Region**: `eu-central-1` (or your bucket's region)

### Step 4: Connect to Webhook Response

Connect the AWS S3 node output directly to your **Webhook Response** node.

---

## 🎯 Expected Output

After adding the S3 node, your webhook will return JSON like this:

```json
[
  {
    "Key": "942e0471-243c-464a-a066-4f21230bd87c",
    "LastModified": "2025-12-14T13:46:46.000Z",
    "Size": "98571",
    "StorageClass": "STANDARD",
    "presignedUrl": "https://andierni-images-112622707427.s3.eu-central-1.amazonaws.com/942e0471-243c-464a-a066-4f21230bd87c?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=..."
  }
]
```

The gallery code automatically looks for the `presignedUrl` field! ✅

---

## 🧪 Testing Your Setup

### Test 1: Execute the Workflow in n8n

1. Click **"Execute Workflow"** in n8n
2. Check the output of the AWS S3 node
3. Look for the `presignedUrl` field
4. Copy one URL and paste it in your browser
5. You should see the image! ✅

### Test 2: Test the Webhook

```bash
curl -H "x-api-key: andi-secret-chats" \
  https://n8n.ernilabs.com/webhook/8dae343b-3828-4970-b696-61ec762a8833
```

Expected response should include `presignedUrl` for each image.

### Test 3: Test in Gallery

1. Make sure `useDemoData: false` in `app.js`
2. Upload updated `app.js` to your server
3. Upload `api-images.php` to your server
4. Visit your gallery: `https://aetest.andierni.ch/`
5. Images should load! 🎉

---

## 📊 Workflow Diagram

```
┌─────────────────────┐
│  Webhook Trigger    │
│  (GET request)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Get Many Files     │
│  (List S3 objects)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Download a File    │
│  (Get metadata)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  AWS S3 Node        │  ⭐ ADD THIS
│  Get Presigned URL  │
└──────────┬──────────┘
           │
           │ Adds: presignedUrl
           │
           ▼
┌─────────────────────┐
│  Webhook Response   │
└─────────────────────┘
```

---

## 🔍 Troubleshooting

### "Credential is not defined"

**Problem:** AWS credentials not set up

**Solution:**
1. Go to **Credentials** in n8n sidebar
2. Create new **AWS** credential
3. Fill in Access Key ID and Secret Access Key
4. Select this credential in the S3 node

### "Access Denied" Error

**Problem:** IAM permissions insufficient

**Solution:** Your AWS IAM user needs these permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::andierni-images-112622707427",
        "arn:aws:s3:::andierni-images-112622707427/*"
      ]
    }
  ]
}
```

### "presignedUrl is undefined"

**Problem:** File Key not mapped correctly

**Solution:** In the AWS S3 node, make sure **File Key** is set to:
```
{{ $json.Key }}
```

This pulls the Key field from the previous node's output.

### Wrong Region

**Problem:** Images in different region

**Solution:** Check your bucket region:
1. Go to AWS S3 Console
2. Find your bucket: `andierni-images-112622707427`
3. Check the region (e.g., `eu-central-1`)
4. Update the credential region in n8n

---

## ✅ Checklist

- [ ] AWS S3 node added after "Download a file"
- [ ] Operation set to "Get Presigned URL"
- [ ] Bucket name: `andierni-images-112622707427`
- [ ] File Key: `{{ $json.Key }}`
- [ ] Expires: `3600`
- [ ] AWS credentials configured with correct region
- [ ] Connected to Webhook Response
- [ ] Workflow activated
- [ ] Test execution shows `presignedUrl` in output
- [ ] Copied one URL and it shows image in browser
- [ ] Updated `app.js` with `useDemoData: false`
- [ ] Uploaded `app.js` and `api-images.php` to server
- [ ] Gallery shows real images!

---

## 🎉 Success Criteria

Your webhook should now return:
```json
{
  "Key": "...",
  "LastModified": "...",
  "presignedUrl": "https://bucket.s3.region.amazonaws.com/key?signature..."
}
```

The gallery will automatically use the `presignedUrl` field to display your images!

---

## 💡 URL Expiration

Presigned URLs expire after 3600 seconds (1 hour). This is a security feature.

**Implications:**
- ✅ Users viewing the gallery get fresh URLs
- ✅ Old URLs can't be reused after expiration
- ⚠️ If someone bookmarks an image URL, it will expire after 1 hour

**To change expiration time:**
In the AWS S3 node, change the **Expires** field:
- `3600` = 1 hour (recommended)
- `86400` = 24 hours
- `604800` = 7 days

---

Need help? Check:
- n8n execution log for errors
- AWS IAM permissions
- Bucket region matches credential region
- Test the presigned URL in your browser

