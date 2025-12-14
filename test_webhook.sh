#!/bin/bash
# Test script to check n8n webhook response

echo "🧪 Testing n8n webhook..."
echo ""

WEBHOOK_URL="https://n8n.ernilabs.com/webhook/8dae343b-3828-4970-b696-61ec762a8833"
API_KEY="andi-secret-chats"

echo "📡 Fetching from: $WEBHOOK_URL"
echo ""

# Make request and save response
response=$(curl -s -H "x-api-key: $API_KEY" "$WEBHOOK_URL")

# Pretty print JSON
echo "📄 Response:"
echo "$response" | python3 -m json.tool

echo ""
echo "---"
echo ""

# Check for ImageUrl field
if echo "$response" | grep -q "ImageUrl"; then
    echo "✅ ImageUrl field found!"
    
    # Extract first ImageUrl
    first_url=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0].get('ImageUrl', 'Not found'))" 2>/dev/null)
    
    if [ "$first_url" != "Not found" ]; then
        echo "📸 First image URL:"
        echo "$first_url"
        echo ""
        echo "🧪 Testing if image is accessible..."
        
        # Test if URL returns an image
        status=$(curl -s -o /dev/null -w "%{http_code}" "$first_url")
        
        if [ "$status" = "200" ]; then
            echo "✅ Image is accessible! (HTTP $status)"
        else
            echo "❌ Image not accessible (HTTP $status)"
            if [ "$status" = "403" ]; then
                echo "💡 This is 'Access Denied' - you need to make S3 objects public"
            fi
        fi
    fi
else
    echo "❌ ImageUrl field NOT found"
    echo "💡 You need to add a Code node in n8n to add the ImageUrl field"
fi

echo ""
echo "---"
echo "📋 Summary:"
echo "  - Check if response has 'ImageUrl' field"
echo "  - If yes, test one URL in browser"
echo "  - If it shows image → Ready for gallery!"
echo "  - If Access Denied → Make S3 objects public"

