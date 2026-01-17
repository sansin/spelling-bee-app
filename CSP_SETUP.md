<!-- 
Content Security Policy (CSP) Configuration
Prevents XSS, injection, and unauthorized resource loading

IMPORTANT: This meta tag must be added to index.html <head> section
Current value is ready-to-use but may need adjustment based on your needs
-->

<!-- 
Recommended CSP Header (to be added to server response headers):
Content-Security-Policy: 
  default-src 'self'; 
  script-src 'self' https://www.gstatic.com https://cdn.jsdelivr.net; 
  style-src 'self' https://cdnjs.cloudflare.com 'unsafe-inline'; 
  img-src 'self' data: https:; 
  font-src 'self' https://cdnjs.cloudflare.com; 
  connect-src 'self' https://spelling-bee-app-c1e76.firebaseio.com https://api.dictionaryapi.dev; 
  frame-ancestors 'none'; 
  form-action 'self'; 
  base-uri 'self'; 
  upgrade-insecure-requests;
-->

<!-- Meta tag for HTML (add to <head> section of index.html): -->
<meta 
  http-equiv="Content-Security-Policy" 
  content="
    default-src 'self';
    script-src 'self' https://www.gstatic.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com;
    style-src 'self' https://cdnjs.cloudflare.com 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self' https://cdnjs.cloudflare.com;
    connect-src 'self' https://spelling-bee-app-c1e76.firebaseio.com https://api.dictionaryapi.dev https://www.gstatic.com;
    frame-ancestors 'none';
    form-action 'self';
    base-uri 'self';
    media-src 'self';
  "
>

<!-- 
CSP Breakdown:

1. default-src 'self'
   - Only allow resources from same origin
   - Fallback for all directives not explicitly set

2. script-src 'self' https://www.gstatic.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com
   - Allow own scripts
   - Allow Firebase SDK from gstatic.com
   - Allow Chart.js from CDN
   - Allow Font Awesome from CDN
   - Prevents inline scripts and external script injection

3. style-src 'self' https://cdnjs.cloudflare.com 'unsafe-inline'
   - Allow own stylesheets
   - Allow Font Awesome CSS from CDN
   - unsafe-inline needed for styles.css (consider extracting inline styles)

4. img-src 'self' data: https:
   - Allow own images
   - Allow data: URIs (base64 images)
   - Allow HTTPS images

5. font-src 'self' https://cdnjs.cloudflare.com
   - Only allow fonts from own origin and CDN

6. connect-src 'self' https://spelling-bee-app-c1e76.firebaseio.com https://api.dictionaryapi.dev https://www.gstatic.com
   - Allow AJAX/fetch to own origin
   - Allow Firebase Realtime Database
   - Allow Dictionary API
   - Allow Firebase SDK connections

7. frame-ancestors 'none'
   - Prevent embedding in iframes (clickjacking protection)

8. form-action 'self'
   - Only allow form submissions to own origin

9. base-uri 'self'
   - Prevent <base> tag injection

10. upgrade-insecure-requests (optional)
    - Auto-upgrade HTTP to HTTPS (for production only)

Issues to address:
- 'unsafe-inline' for styles is currently needed but not ideal
  Solution: Extract all inline styles to separate CSS file
  
- Firebase SDK requires multiple domains
  Solution: Consider using Firebase Hosting to serve from same domain

- Dictionary API allows external domain
  Solution: Consider proxying through backend to reduce CSP scope
-->

<!-- 
Implementation Steps:

1. IMMEDIATE: Add meta tag to index.html <head> section
   - Copy the meta tag above
   - Paste it after the <title> tag

2. PHASE 2: Remove 'unsafe-inline' from style-src
   - Extract all inline styles from index.html
   - Move to styles.css
   - Test thoroughly to ensure styles load correctly

3. PHASE 3: Add CSP header to server
   - Configure Express server (server.js) to send CSP header
   - Use helmet.js middleware for Express
   - Set Report-Only mode first to test

4. PHASE 4: Set up violation reporting
   - Configure report-uri to log CSP violations
   - Monitor for blocked resources
   - Adjust CSP rules as needed

Testing CSP:
- Open browser DevTools Console
- Look for CSP violations
- Each violation will show:
  - Resource that was blocked
  - Policy that blocked it
  - Suggested fix

Example violation message:
"Refused to load the stylesheet from 'https://example.com/style.css' 
because it violates the following Content Security Policy directive: 
"style-src 'self' https://cdnjs.cloudflare.com"."

This tells us we need to add https://example.com to style-src directive.
-->

<!-- 
Common CSP Mistakes to Avoid:

1. ❌ Using * (wildcard)
   - Allow-all approach defeats CSP purpose
   - Use specific domains instead

2. ❌ Using 'unsafe-eval'
   - Allows eval() and similar dynamic code execution
   - Enables many XSS attacks
   - Avoid unless absolutely necessary

3. ❌ Using 'unsafe-inline'
   - Allows inline styles and scripts
   - Reduces XSS protection
   - Extract to files instead

4. ❌ Overly permissive
   - Adding too many exceptions
   - Defeats security purpose
   - Keep CSP as strict as possible

5. ❌ Not testing thoroughly
   - CSP violations can break functionality
   - Test in all browsers
   - Use Report-Only mode first
-->
