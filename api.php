<?php
/**
 * API Proxy for n8n Webhook
 * Handles CORS and authentication for the image gallery
 */

// Configuration
define('API_URL', 'https://n8n.ernilabs.com/webhook/8dae343b-3828-4970-b696-61ec762a8833');
define('API_KEY', 'andi-secret-chats');

// Enable CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, x-api-key');

// Handle OPTIONS preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get the request path
$requestUri = $_SERVER['REQUEST_URI'];
$scriptName = dirname($_SERVER['SCRIPT_NAME']);
$path = str_replace($scriptName, '', $requestUri);
$path = parse_url($path, PHP_URL_PATH);

// Route handler
if (strpos($path, '/api/images') === 0) {
    // Handle image list request
    handleImageList();
} elseif (strpos($path, '/api/image/') === 0) {
    // Handle individual image request
    $imageKey = substr($path, strlen('/api/image/'));
    handleImageFetch($imageKey);
} else {
    // Invalid endpoint
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Endpoint not found']);
}

/**
 * Fetch and return the list of images from n8n webhook
 */
function handleImageList() {
    try {
        // Build URL with query parameters if any
        $fullUrl = API_URL;
        if (!empty($_SERVER['QUERY_STRING'])) {
            $fullUrl .= '?' . $_SERVER['QUERY_STRING'];
        }
        
        // Initialize cURL
        $ch = curl_init($fullUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'x-api-key: ' . API_KEY
        ]);
        
        // Execute request
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
        
        if (curl_errno($ch)) {
            throw new Exception(curl_error($ch));
        }
        
        curl_close($ch);
        
        // Send response
        http_response_code($httpCode);
        header('Content-Type: ' . ($contentType ?: 'application/json'));
        echo $response;
        
    } catch (Exception $e) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['error' => $e->getMessage()]);
    }
}

/**
 * Fetch and return an individual image from n8n webhook
 */
function handleImageFetch($imageKey) {
    try {
        // Sanitize the image key
        $imageKey = basename($imageKey);
        
        // First attempt: append key to URL path
        $imageUrl = API_URL . '/' . $imageKey;
        
        $ch = curl_init($imageUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'x-api-key: ' . API_KEY
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
        curl_close($ch);
        
        // If first attempt failed, try with query parameter
        if ($httpCode !== 200) {
            $imageUrl = API_URL . '?key=' . urlencode($imageKey);
            
            $ch = curl_init($imageUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'x-api-key: ' . API_KEY
            ]);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
            curl_close($ch);
        }
        
        if ($httpCode === 200) {
            // Successfully fetched image
            http_response_code(200);
            header('Content-Type: ' . ($contentType ?: 'image/jpeg'));
            echo $response;
        } else {
            // Image not found
            throw new Exception('Image not found');
        }
        
    } catch (Exception $e) {
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Image not found: ' . $e->getMessage()]);
    }
}
?>

