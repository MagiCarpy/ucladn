# UCLA Delivery Network (ucladn) - Feature Roadmap

This document outlines upcoming feature suggestions, convenience routing brainstorming, and Quality of Life (QoL) improvements designed to reduce user friction and enhance the overall platform experience.

---

## 1. Convenient Routing & Sorting (Deliverer-Focused)

### **Location-Based Sorting**
*   **Deliverer Proximity Sort:** Allow couriers to sort open delivery requests by proximity to their current coordinates (using HTML5 Geolocation API).
*   **Receiver Location Sort:** Sort requests by their dropoff proximity, allowing couriers to find deliveries going to building clusters where they already plan to go (e.g., student housing, North Campus).

### **Brainstorming Conveniences & Recommendations**
To make route recommendations most convenient for the deliverer, we can explore several approaches:
*   **Path Alignment Score (Route Bundling):**
    *   Compare the courier's planned route (or their common walking path) with the pickup/dropoff coords of open requests. 
    *   Calculate a detour penalty (using OpenRouteService distance/duration data) to recommend requests that add the minimum extra walking distance.
*   **Historical Behavior Profiles:**
    *   Use historical delivery records to determine a courier's common delivery zones (e.g., if a courier consistently completes orders between De Neve and Boelter Hall).
    *   Rank new requests higher if they match the courier's typical active zones.
*   **User-Specific Machine Learning (ML):**
    *   Implement client-side or backend-based lightweight models (e.g., collaborative filtering or classification tree) to predict the likelihood of a courier accepting an open request.
    *   **Inputs for ML Model:**
        *   Time of day (e.g., class schedule breaks).
        *   Average speed/duration of past deliveries.
        *   Historically preferred pickup/dropoff hubs.
        *   Weight/item category preferences.

---

## 2. Quality of Life (QoL) & Friction Reduction

### **Uncluttered Display**
*   **Essential-Only Mode:** Transition to a simplified, high-contrast interface showing only vital stats (Item name, Pickup, Dropoff, navigation path, and active chat).
*   **Contextual UI:** Collapsible panels that show detail sheets only when markers are clicked, maximizing the map viewport on mobile devices.

### **Easy Pickup Locations**
*   *Manually research and integrate designated pickup/dropoff points across the UCLA campus to streamline handoffs:*
    *   **Ackerman Turnaround / Union:** Prime pickup hub for courier vehicles or rideshares.
    *   **Hill Housing Hubs:** Specific lobby/front-desk areas for residential halls (Sproul, Rieber, De Neve, Hedrick) where packages can be securely signed off.
    *   **Court of Sciences:** A logical outdoor aggregation zone for South Campus student handoffs.
    *   **Lu Valle Commons:** Key hub for North Campus deliveries.

### **Transaction Confirmation for Streamlined Dropoffs**
*   **One-Tap Verification Codes:** Generate a short, secure 4-digit code on the receiver's screen. The deliverer enters this code to instantly confirm delivery completion instead of relying solely on photo uploads.
*   **NFC or QR Code Handoff:** Allow scanning a quick QR code on the receiver's phone using the helper's camera for instant verification.

### **Order History**
*   **Detailed Archive Log:** Create a dedicated history tab showing completed requests, total distance traveled, and delivery history.
*   **Performance Metrics:** Show couriers their total deliveries, average completion speed, and active weeks to encourage continued participation.

### **Privacy Considerations**
*   **Ephemeral Chat Logs:** Automatically delete message logs, attachment images, and exact coordinates after a request is archived.
*   **Location Obfuscation:** Mask exact user coordinates on the public map with a randomized offset radius (e.g., 25–50 meters) until a courier officially accepts the delivery request.

---

## 3. Database & Data Structure Efficiency

### **SQL Index Optimization**
*   **Composite Indexing on Queries:** Assess foreign keys and add composite indexes for frequently filtered queries. For example, queries like `Request.findOne({ where: { helperId, status: "accepted" } })` should have a composite index on `(helper_id, status)` to ensure $O(1)$ lookup times in high-traffic scenarios.
*   **Indexes on Foreign Keys:** Ensure foreign keys such as `user_id`, `request_id`, and `sender_id` are explicitly indexed if Sequelize's implicit associations index isn't created due to `constraints: false`.

### **Active Request Caching (Memory-Store)**
*   **Redis Cache for Active Requests:** Since active requests on the map are read frequently by all online users, cache the list of open requests in Redis. Invalidate or update the cache when a request is created, accepted, or completed. This reduces database read load from $O(N)$ SQL table scans to sub-millisecond memory fetches.
*   **Active Session Management:** Continue utilizing Redis for session refresh token storage, and explore caching active user profile summaries to reduce join queries during authentication handshake/checks.

### **Messages Data Structure & Archiving**
*   **Partitioning/Sharding Chat Messages:** In a mature state, messages table queries grow exponentially. Archive messages to a separate history table immediately when a request is archived/completed, keeping the active `Messages` table extremely small and fast for both reads and writes.
*   **Websocket Payload Minimization:** Optimize the size of objects transmitted via Socket.io. Instead of sending raw database model instances (which contain bloated meta-fields and unused attributes), serialize and send minimized, custom JSON payloads for `message:sent` and `request:updated` events.

