# Webhook Signature Verification

All webhooks sent from APIPoints include an HMAC-SHA256 signature that allows you to verify the authenticity and integrity of the payload.

## Headers

Each webhook request includes:

- `X-MyAPI-Signature`: HMAC-SHA256 signature in hex format
- `X-MyAPI-Timestamp`: Unix timestamp in milliseconds (optional, for replay protection)

## Signature Generation

The signature is generated as follows:

```
signature = HMAC-SHA256(secret, timestamp + "." + raw_body)
```

Where:
- `secret`: The webhook secret (unique per webhook)
- `timestamp`: Unix timestamp in milliseconds (from `X-MyAPI-Timestamp` header)
- `raw_body`: The raw JSON payload as a string

If timestamp is not used, the signature is simply `HMAC-SHA256(secret, raw_body)`.

## JavaScript Verification

```javascript
const crypto = require('crypto');

function verifySignature(secret, payload, signature, timestamp) {
  const message = timestamp ? `${timestamp}.${payload}` : payload;
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');
  
  // Use timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSig, 'hex')
  );
}

// Express.js example
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-myapi-signature'];
  const timestamp = req.headers['x-myapi-timestamp'];
  const rawBody = JSON.stringify(req.body);
  const secret = 'your-webhook-secret'; // Store this securely
  
  if (!verifySignature(secret, rawBody, signature, timestamp)) {
    return res.status(401).send('Invalid signature');
  }
    
  // Process webhook...
  res.status(200).send('OK');
});
```

## Python Verification

```python
import hmac
import hashlib
from flask import Flask, request

def verify_signature(secret, payload, signature, timestamp=None):
    if timestamp:
        message = f"{timestamp}.{payload}"
    else:
        message = payload
    
    expected_sig = hmac.new(
        secret.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    # Use constant-time comparison
    return hmac.compare_digest(signature, expected_sig)

app = Flask(__name__)

@app.route('/webhook', methods=['POST'])
def webhook():
    signature = request.headers.get('X-MyAPI-Signature')
    timestamp = request.headers.get('X-MyAPI-Timestamp')
    raw_body = request.get_data(as_text=True)
    secret = 'your-webhook-secret'  # Store this securely
    
    if not verify_signature(secret, raw_body, signature, timestamp):
        return 'Invalid signature', 401
    
    # Process webhook...
    return 'OK', 200
```

## PHP Verification

```php
<?php
function verifySignature($secret, $payload, $signature, $timestamp = null) {
    if ($timestamp) {
        $message = $timestamp . '.' . $payload;
    } else {
        $message = $payload;
    }
    
    $expectedSig = hash_hmac('sha256', $message, $secret);
    
    // Use constant-time comparison
    return hash_equals($signature, $expectedSig);
}

// Example with vanilla PHP
$signature = $_SERVER['HTTP_X_MYAPI_SIGNATURE'] ?? '';
$timestamp = $_SERVER['HTTP_X_MYAPI_TIMESTAMP'] ?? '';
$secret = 'your-webhook-secret'; // Store this securely

// Get raw body
$payload = file_get_contents('php://input');

if (!verifySignature($secret, $payload, $signature, $timestamp)) {
    http_response_code(401);
    echo 'Invalid signature';
    exit;
}

// Process webhook...
echo 'OK';
?>
```

## Go Verification

```go
package main

import (
    "crypto/hmac"
    "crypto/sha256"
    "encoding/hex"
    "net/http"
    "strings"
)

func verifySignature(secret, payload, signature, timestamp string) bool {
    var message string
    if timestamp != "" {
        message = timestamp + "." + payload
    } else {
        message = payload
    }
    
    mac := hmac.New(sha256.New, []byte(secret))
    mac.Write([]byte(message))
    expectedSig := hex.EncodeToString(mac.Sum(nil))
    
    return hmac.Equal([]byte(signature), []byte(expectedSig))
}

func webhookHandler(w http.ResponseWriter, r *http.Request) {
    signature := r.Header.Get("X-MyAPI-Signature")
    timestamp := r.Header.Get("X-MyAPI-Timestamp")
    secret := "your-webhook-secret" // Store this securely
    
    // Read raw body
    body, _ := io.ReadAll(r.Body)
    payload := string(body)
    
    if !verifySignature(secret, payload, signature, timestamp) {
        http.Error(w, "Invalid signature", http.StatusUnauthorized)
        return
    }
    
    // Process webhook...
    w.Write([]byte("OK"))
}
```

## Getting Your Webhook Secret

1. Go to your API settings page
2. Navigate to Webhooks section
3. Create a new webhook or view an existing one
4. The secret will be displayed (masked by default)
5. Use the "Regenerate" button to create a new secret if needed

## Security Notes

- Store your webhook secret securely (environment variable, secret manager, etc.)
- Always use the raw request body for signature verification (not parsed/modified)
- Use timing-safe comparison to prevent timing attacks
- Consider validating the timestamp to prevent replay attacks (reject requests older than X minutes)
- The signature is case-sensitive
