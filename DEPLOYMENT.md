# 🚀 Deployment Guide

## Deploying to a PHP Server

### Prerequisites

- PHP 7.0 or higher
- Apache web server with mod_rewrite enabled
- cURL PHP extension enabled

### Step-by-Step Deployment

#### 1. **Upload Files**

Upload these files to your web server:
```
/your-web-root/
  ├── index.html
  ├── styles.css
  ├── app.js
  ├── api.php
  └── .htaccess
```

#### 2. **Verify PHP Requirements**

Create a test file `phpinfo.php`:
```php
<?php phpinfo(); ?>
```

Upload it and check:
- ✅ PHP version >= 7.0
- ✅ cURL extension enabled
- ✅ mod_rewrite enabled (Apache)

Delete `phpinfo.php` after verification.

#### 3. **Configure API Credentials**

Edit `api.php` lines 8-9 with your n8n webhook details:
```php
define('API_URL', 'https://n8n.ernilabs.com/webhook/8dae343b-3828-4970-b696-61ec762a8833');
define('API_KEY', 'andi-secret-chats');
```

#### 4. **Set File Permissions**

```bash
chmod 644 index.html styles.css app.js api.php .htaccess
chmod 755 .  # Current directory
```

#### 5. **Test the Installation**

Visit your site:
```
https://yourdomain.com/
```

Check the browser console (F12) for any errors.

## Testing API Endpoints

### Test Image List Endpoint
```bash
curl https://yourdomain.com/api/images
```

Expected response: JSON array with image metadata

### Test Individual Image Endpoint (when configured)
```bash
curl https://yourdomain.com/api/image/YOUR-IMAGE-KEY
```

## Common Hosting Providers

### Shared Hosting (cPanel, Plesk)

1. Use File Manager or FTP to upload files
2. Ensure `.htaccess` is visible (show hidden files)
3. PHP and cURL are usually enabled by default
4. mod_rewrite is typically enabled

### DigitalOcean / Linode / AWS

1. Install LAMP/LEMP stack
2. Upload files to `/var/www/html/`
3. Enable Apache mod_rewrite:
   ```bash
   sudo a2enmod rewrite
   sudo systemctl restart apache2
   ```

### Nginx Configuration

If using Nginx instead of Apache, add to your server block:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/html;
    index index.html index.php;

    # Static files
    location / {
        try_files $uri $uri/ =404;
    }

    # API proxy
    location /api/ {
        try_files $uri /api.php$is_args$args;
        
        # CORS headers
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
        add_header Access-Control-Allow-Headers 'Content-Type, x-api-key';
        
        # Handle OPTIONS
        if ($request_method = OPTIONS) {
            return 200;
        }
    }

    # PHP processing
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
}
```

## SSL/HTTPS Setup

### Free SSL with Let's Encrypt

```bash
sudo apt update
sudo apt install certbot python3-certbot-apache
sudo certbot --apache -d yourdomain.com
```

### Force HTTPS

Add to `.htaccess` (before other rules):
```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

## Troubleshooting Deployment

### .htaccess Not Working

**Check AllowOverride:**
Edit Apache config:
```apache
<Directory /var/www/html>
    AllowOverride All
</Directory>
```

Then restart Apache:
```bash
sudo systemctl restart apache2
```

### API Returns 500 Error

**Check PHP error logs:**
```bash
tail -f /var/log/apache2/error.log
# or
tail -f /var/log/php7.4-fpm.log
```

**Enable PHP error display (dev only):**
Add to `api.php` top:
```php
<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
```

### cURL Not Available

**Install PHP cURL:**
```bash
# Ubuntu/Debian
sudo apt install php-curl
sudo systemctl restart apache2

# CentOS/RHEL
sudo yum install php-curl
sudo systemctl restart httpd
```

### Images Not Loading

1. Check browser console for API errors
2. Test API endpoint directly: `https://yourdomain.com/api/images`
3. Verify n8n webhook is active
4. Check `useDemoData` setting in `app.js`

## Performance Optimization

### Enable Gzip Compression

Already configured in `.htaccess`. Verify:
```bash
curl -H "Accept-Encoding: gzip" -I https://yourdomain.com/styles.css
```

Look for: `Content-Encoding: gzip`

### Enable Browser Caching

Already configured in `.htaccess` for static files.

### Use CDN (Optional)

For high traffic, consider:
- Cloudflare (free plan available)
- AWS CloudFront
- BunnyCDN

### PHP OpCache

Enable in `php.ini`:
```ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=4000
```

## Security Best Practices

### 1. Hide Sensitive Files

Add to `.htaccess`:
```apache
<FilesMatch "^\.">
    Order allow,deny
    Deny from all
</FilesMatch>
```

### 2. Disable Directory Listing

```apache
Options -Indexes
```

### 3. Protect API Credentials

Consider using environment variables:
```php
define('API_KEY', getenv('N8N_API_KEY'));
```

### 4. Add Rate Limiting

For production, consider adding rate limiting to `api.php`:
```php
// Simple rate limiting example
session_start();
$maxRequests = 100;
$timeWindow = 3600; // 1 hour

if (!isset($_SESSION['api_requests'])) {
    $_SESSION['api_requests'] = [];
}

$now = time();
$_SESSION['api_requests'] = array_filter(
    $_SESSION['api_requests'],
    fn($t) => $now - $t < $timeWindow
);

if (count($_SESSION['api_requests']) >= $maxRequests) {
    http_response_code(429);
    exit('Rate limit exceeded');
}

$_SESSION['api_requests'][] = $now;
```

## Monitoring

### Set Up Basic Monitoring

Create `health.php`:
```php
<?php
header('Content-Type: application/json');

$health = [
    'status' => 'ok',
    'php_version' => PHP_VERSION,
    'curl_available' => function_exists('curl_init'),
    'timestamp' => date('Y-m-d H:i:s')
];

echo json_encode($health, JSON_PRETTY_PRINT);
```

### Log API Requests

Add to `api.php`:
```php
// Add after line 20
file_put_contents(
    'api.log',
    date('Y-m-d H:i:s') . ' ' . $_SERVER['REQUEST_URI'] . PHP_EOL,
    FILE_APPEND
);
```

---

🎉 Your image gallery is now deployed and ready for production use!

