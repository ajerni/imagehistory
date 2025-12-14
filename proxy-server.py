#!/usr/bin/env python3
"""
Simple proxy server to handle CORS issues when fetching images from the n8n webhook
"""

from http.server import HTTPServer, SimpleHTTPRequestHandler
import urllib.request
import json
import sys

API_URL = 'https://n8n.ernilabs.com/webhook/8dae343b-3828-4970-b696-61ec762a8833'
API_KEY = 'andi-secret-chats'

class ProxyHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, x-api-key')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()
    
    def do_GET(self):
        if self.path.startswith('/api/images'):
            # Handle API proxy request for image list
            try:
                # Parse query parameters
                query_params = ''
                if '?' in self.path:
                    query_params = self.path.split('?', 1)[1]
                
                # Build the full URL
                full_url = API_URL
                if query_params:
                    full_url += '?' + query_params
                
                # Create request with API key header
                req = urllib.request.Request(full_url)
                req.add_header('x-api-key', API_KEY)
                
                # Make the request
                with urllib.request.urlopen(req) as response:
                    content_type = response.headers.get('Content-Type', 'application/json')
                    data = response.read()
                    
                    # Send response
                    self.send_response(200)
                    self.send_header('Content-Type', content_type)
                    self.end_headers()
                    self.wfile.write(data)
                    
            except Exception as e:
                error_msg = json.dumps({'error': str(e)})
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(error_msg.encode())
        
        elif self.path.startswith('/api/image/'):
            # Handle individual image fetch
            try:
                # Extract the image key from the path
                image_key = self.path.split('/api/image/', 1)[1]
                
                # Try to fetch the image from the webhook with the key
                # First attempt: append key to URL path
                image_url = f"{API_URL}/{image_key}"
                
                req = urllib.request.Request(image_url)
                req.add_header('x-api-key', API_KEY)
                
                try:
                    with urllib.request.urlopen(req) as response:
                        content_type = response.headers.get('Content-Type', 'image/jpeg')
                        data = response.read()
                        
                        self.send_response(200)
                        self.send_header('Content-Type', content_type)
                        self.end_headers()
                        self.wfile.write(data)
                        return
                except:
                    # If that didn't work, try with query parameter
                    image_url = f"{API_URL}?key={image_key}"
                    req = urllib.request.Request(image_url)
                    req.add_header('x-api-key', API_KEY)
                    
                    with urllib.request.urlopen(req) as response:
                        content_type = response.headers.get('Content-Type', 'image/jpeg')
                        data = response.read()
                        
                        self.send_response(200)
                        self.send_header('Content-Type', content_type)
                        self.end_headers()
                        self.wfile.write(data)
                    
            except Exception as e:
                print(f"Error fetching image {image_key}: {e}")
                # Return a placeholder error image
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                error_msg = json.dumps({'error': f'Image not found: {str(e)}'})
                self.wfile.write(error_msg.encode())
        
        else:
            # Handle normal file serving
            super().do_GET()

def run_server(port=8080):
    server_address = ('', port)
    httpd = HTTPServer(server_address, ProxyHandler)
    print(f'🚀 Proxy server running on http://localhost:{port}')
    print(f'📸 Image Gallery available at http://localhost:{port}')
    print(f'🔗 API proxied through http://localhost:{port}/api/images')
    print('Press Ctrl+C to stop...\n')
    httpd.serve_forever()

if __name__ == '__main__':
    try:
        run_server(8080)
    except KeyboardInterrupt:
        print('\n\n👋 Server stopped')
        sys.exit(0)

