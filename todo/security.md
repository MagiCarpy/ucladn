# Security Backlog & Remediation Todo

This document serves as a centralized backlog of security enhancements and defenses to protect the UCLA Delivery Network (ucladn) application. It spans WebSocket isolation, REST API rate-limiting, DDoS mitigation, and location privacy controls.

---

## 1. WebSocket Security Backlog

### [ ] **Enforce Handshake Authentication on Sockets**

- **Vulnerability:** Socket.io currently accepts connections from any client without validating their identity. This allows unauthenticated users to listen to active event streams and system logs.
- **Remediation:**
  - Add connection middleware in [server.js](file:///.../ucladn/backend/server.js).
  - Extract and parse request cookies during the Socket.io handshake (using the JWT logic in [auth.js](file:///.../ucladn/backend/middleware/auth.js)). Reject the handshake if no valid session cookie is provided.

### [ ] **Scope Private Chat Broadcasts to Rooms**

- **Vulnerability:** Chat messages are broadcasted globally using `req.io.emit("message:sent")`, delivering the contents of private conversations to every connected socket on the network.
- **Remediation:**
  - Modify `sendMessage` inside [messageController.js](file:///.../ucladn/backend/controllers/messageController.js).
  - Scope the emit call to the specific request room using `.to(requestId)` so that only the participants in that chat receive the frames:
    ```javascript
    req.io.to(requestId).emit("message:sent", message_data);
    ```

### [ ] **Restrict Room Access & Validate Joins**

- **Vulnerability:** Sockets can join any room arbitrarily via client-controlled emissions to `join_chat`. The server does not check if the joining socket is authorized to view the chat messages.
- **Remediation:**
  - Update the connection event handler in [server.js](file:///.../ucladn/backend/server.js).
  - Query the request database on `join_chat` and verify that the socket's authenticated user ID matches either the `userId` (requester) or `helperId` (deliverer) for that request.

### [ ] **Enforce Rate Limiting on WebSocket Events**

- **Vulnerability:** Sockets lack rates-of-transmission limits, leaving the server vulnerable to event-flooding and Denial of Service (DoS) attacks.
- **Remediation:**
  - Use connection tracking (e.g. `socket.io-limiter` or raw memory tracking) in [server.js](file:///.../ucladn/backend/server.js) to throttle or disconnect sockets emitting excessive events.

---

## 2. HTTP REST API Security Backlog

### [ ] **Slide-Window Rate Limiting on Auth Endpoints**

- **Vulnerability:** Authentication endpoints (`/api/user/login` and `/api/user/register`) are vulnerable to automated brute-force attacks and credential stuffing.
- **Remediation:**
  - Configure a strict rate limiter (e.g., using `express-rate-limit` with a Redis store) on login and registration routes.
  - Limit requests to a maximum of 5 attempts per 15 minutes per IP address.

### [ ] **Credential Stuffing Delay Tarpit (Exponential Backoff)**

- **Vulnerability:** Standard rate limiters block requests completely, but automated attackers can shift IP addresses. Fast fail responses still allow them to test passwords quickly.
- **Remediation:**
  - Implement a login "tarpit" that introduces a progressive delay on failed authentication attempts.
  - On a failed login, delay the server response asynchronously (e.g. `1s`, `2s`, `4s`, `8s` for consecutive failures) or return a `429 Too Many Requests` status code with a dynamic `Retry-After` header indicating the backoff window.

### [ ] **Global Token Bucket API Rate Limiting**

- **Vulnerability:** The application lacks global protection against API scraping, request floods, and application-layer DDoS attacks.
- **Remediation:**
  - Configure a global API rate limiter in [server.js](file:///.../ucladn/backend/server.js) using the Token Bucket algorithm (via `rate-limiter-flexible`).
  - Track requests in the centralized Redis cluster (`redisClient`) to synchronize rate-limit tokens across multiple server instances in production.

### [ ] **Edge Proxy DDoS Mitigation**

- **Vulnerability:** Heavy Layer 7 DDoS attacks (HTTP floods) will overwhelm the Node.js single-threaded event loop even if rate limiters are configured in Express, consuming CPU and RAM.
- **Remediation:**
  - Recommend routing the production UCLA Delivery Network traffic behind an Edge proxy/WAF (such as Cloudflare or AWS Shield). This blocks volumetric floods and malicious botnets before they reach the application servers.

---

## 3. Data Privacy Backlog

### [ ] **Obfuscate coordinates for Open Requests**

- **Vulnerability:** Publicly broadcasting exact coordinates of active delivery requests allows scrapers to trace user locations and stalk users on campus.
- **Remediation:**
  - Fuzz coordinates for all public request listings (e.g., in [requestController.js](file:///.../ucladn/backend/controllers/requestController.js) `list` method) by adding a randomized offset (e.g., 20–50 meters) if the status is `open`.
  - Expose the exact coordinates _only_ to the assigned helper after they have accepted the delivery.

---

## 4. Overall App Security & Checklists

### [ ] **Application Security Verification Standard (OWASP ASVS)**

- **Vulnerability:** Unstructured security approaches often miss critical software vulnerabilities (like Broken Access Control, Injection, XSS) during the coding phase.
- **Remediation:** 
  - Consult the **[OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)** Level 1 checklist. It is the industry gold standard for web application code security.
  - Implement automated SAST (Static Application Security Testing) tools like **GitHub Advanced Security**, **Snyk**, or **SonarQube** in the CI/CD pipeline to automatically scan code pushes for ASVS violations.

### [ ] **Infrastructure Hardening (CIS Benchmarks)**

- **Vulnerability:** Even secure code can be compromised if the underlying infrastructure (Ubuntu, Docker, MySQL, Redis) uses default passwords, open ports, or insecure configurations.
- **Remediation:**
  - Consult the **[CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks)** for MySQL 8.0, Ubuntu 24.04, and Docker.
  - Use these prescriptive checklists to lock down the Hostinger VPS environment, disable root SSH logins, and restrict network interfaces.
