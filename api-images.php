<?php
/**
 * Direct API endpoint - simpler alternative to api.php with URL rewriting
 * Use this URL in app.js: /api-images.php
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
?>

