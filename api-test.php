<?php
/**
 * Diagnostic script to test API connection
 * Visit: https://yourdomain.com/api-test.php
 */

header('Content-Type: application/json');

// Test configuration
define('API_URL', 'https://n8n.ernilabs.com/webhook/8dae343b-3828-4970-b696-61ec762a8833');
define('API_KEY', 'andi-secret-chats');

echo json_encode([
    'test' => 'API Test Script',
    'php_version' => PHP_VERSION,
    'curl_available' => function_exists('curl_init'),
    'request_uri' => $_SERVER['REQUEST_URI'],
    'script_name' => $_SERVER['SCRIPT_NAME'],
    'path_info' => isset($_SERVER['PATH_INFO']) ? $_SERVER['PATH_INFO'] : 'not set',
], JSON_PRETTY_PRINT);

echo "\n\n--- Testing n8n Webhook Connection ---\n\n";

// Test connection to n8n
try {
    $ch = curl_init(API_URL);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['x-api-key: ' . API_KEY]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    if (curl_errno($ch)) {
        echo json_encode(['error' => curl_error($ch)], JSON_PRETTY_PRINT);
    } else {
        echo "HTTP Code: $httpCode\n";
        echo "Response:\n";
        echo $response;
    }
    
    curl_close($ch);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
}
?>

