# File Upload Security Recommendations

This document outlines key security risks associated with file uploads and details recommendations and actionable steps to secure the file upload endpoints in the UCLA Delivery Network application.

---

## 1. Security Risks in File Uploads

### A. Unauthenticated / Unauthorized Uploads
* **Risk:** Anonymous users uploading files, or authenticated users uploading files to resources they do not own (e.g., uploading a delivery photo for someone else's order).
* **Mitigation:** Enforce strict session validation and check authorization policies before saving any file.

### B. Malicious File Execution (Remote Code Execution)
* **Risk:** An attacker uploads a script (e.g., a `.php`, `.js`, `.sh`, or `.html` file) to the public folder. If the web server is configured to execute scripts in that folder, or if Nginx serves it directly, the attacker could execute arbitrary code on your server or conduct Cross-Site Scripting (XSS) attacks.
* **Mitigation:**
  * Use a strict allowlist of file extensions and MIME types.
  * Disable script execution inside the upload folder (in Nginx or Apache).
  * Do not serve the upload folder as a public static directory if it contains sensitive files.

### C. File Extension Spoofing (MIME Sniffing)
* **Risk:** An attacker changes the file extension of a script (e.g., renaming `malicious.js` to `photo.jpg`) but sends a script MIME type, or the browser sniffs the contents of the file and runs it as JS/HTML anyway.
* **Mitigation:** 
  * Parse and validate the file's "magic numbers" (file signature) on the backend using libraries like `file-type` to verify that a JPG is actually a JPG.
  * Set `X-Content-Type-Options: nosniff` in HTTP response headers.

### D. Path Traversal (Arbitrary File Write)
* **Risk:** The filename provided by the client (e.g., `../../etc/passwd` or `../../server.js`) is used directly in `path.join()`, allowing the attacker to overwrite critical system or application files.
* **Mitigation:** Never use the client-provided filename (`req.file.originalname`) directly. Generate a secure, randomized filename (e.g., using UUIDs or cryptographically secure hashes) and strip original paths.

### E. Denial of Service (DoS) via Disk Exhaustion
* **Risk:** Attackers upload extremely large files (e.g., 10GB files) to fill up the server's disk space, crashing the server.
* **Mitigation:** Set a strict limit on maximum file sizes in your middleware (e.g., Multer's `limits.fileSize`).

### F. Sensitive Data Exposure / Public Access
* **Risk:** Storing delivery confirmation photos in the `/public` folder allows anyone with the URL to view them. These photos may contain private home addresses, packages, or faces.
* **Mitigation:** Storing files in a private directory (outside the web root) and serving them through an authenticated route that verifies the user's role before sending the file.

---

## 2. Action Plan for `ucladn`

### Step 1: Implement Secure Storage (Private Folder)
1. Move the upload path for delivery photos and chat attachments from `PUBLIC_PATH` (`frontend/public`) to a private directory on the backend, such as `backend/uploads/` (already defined as `UPLOADS_PATH` in `paths.js`).
2. Add the private folder to `.gitignore` so uploaded files are never committed to git.

### Step 2: Create an Authenticated Retrieval Route
Create a new controller method and endpoint to serve the secure files:
* **Route:** `GET /api/requests/:id/photo`
* **Logic:**
  1. Verify the user is authenticated.
  2. Verify the user is either the requester, helper, or admin.
  3. Serve the file using `res.sendFile(filePath)` or `res.download(filePath)`.

### Step 3: Implement Frontend Image Preview and Delayed Submission
Modify `InfoPanel.jsx`:
1. Add a state variable `const [selectedFile, setSelectedFile] = useState(null)` and `const [previewUrl, setPreviewUrl] = useState(null)`.
2. When the user selects a file:
   * Do **not** call the upload API immediately.
   * Generate a local object URL (`URL.createObjectURL(file)`) and set it to `previewUrl` for display.
3. Show a "Submit Delivery Confirmation" or "Complete Delivery" button when a local file is selected.
4. When clicked:
   * Upload the file to the secure upload endpoint first.
   * Then call the backend to complete the delivery.
