# UCLA Delivery Network (ucladn) - Feature Roadmap

This document outlines upcoming feature suggestions, convenience routing brainstorming, and Quality of Life (QoL) improvements. Tasks are sorted from easiest to implement to hardest.

---

### Completed Tasks

- [x] **Paranoid Mode Archiving (Soft Deletes):** Instead of manually moving Requests and Messages into separate Archive tables, implement Sequelize's `paranoid: true` setting. Automatically adds a `deletedAt` timestamp to records when destroyed, keeping them permanently available for Administrative scam auditing.

---

### Easy (Quick Wins & UI Tweaks)

- [ ] **Order History:** Create a dedicated history tab showing completed requests, total distance traveled, and delivery history. Show couriers their performance metrics (average completion speed, active weeks).
- [ ] **Uncluttered Display:** Transition to a simplified, high-contrast interface showing only vital stats. Add contextual collapsible panels that show detail sheets only when markers are clicked.
- [ ] **SQL Index Optimization:** Add composite indexes for frequently filtered queries (e.g., `helper_id` + `status`) and explicitly index foreign keys to ensure $O(1)$ lookup times.
- [ ] **Websocket Payload Minimization:** Optimize Socket.io transmissions by serializing and sending minimized, custom JSON payloads instead of bloated raw database model instances.

### Medium (Logic Updates & API Integrations)

- [ ] **Privacy Considerations:** Mask exact user coordinates on the public map with a randomized offset radius (e.g., 25–50 meters) until a courier officially accepts. Automatically delete message logs and attachment images after a request is archived.
- [ ] **Easy Pickup Locations:** Manually research and integrate designated pickup/dropoff points across the UCLA campus (e.g., Ackerman Turnaround, Hill Housing Hubs, Court of Sciences, Lu Valle Commons).
- [ ] **Location-Based Sorting:** Allow couriers to sort open delivery requests by proximity to their current coordinates or dropoff proximity using HTML5 Geolocation API.
- [ ] **Transaction Confirmation:** Generate a short 4-digit code on the receiver's screen for the deliverer to enter, or use NFC/QR code scanning for instant delivery verification.

### Hard (Infrastructure changes)

- [ ] **Active Request Caching (Redis):** Cache the list of open requests in Redis to reduce database read load from $O(N)$ SQL table scans to sub-millisecond memory fetches. Update cache on request creation/acceptance/completion.
- [ ] **Self-Hosted Routing Infrastructure (OSRM):** Replace the external OpenRouteService API with a fully self-hosted OSRM Docker container. Mount a custom UCLA `.osm.pbf` map dataset to include custom pedestrian footpaths and building entrances.

### Very Hard (AI, ML & Complex Algorithms)

- [ ] **Path Alignment Score (Route Bundling):** Compare a courier's planned route with open requests. Calculate a detour penalty to recommend requests that add the minimum extra walking distance.
- [ ] **Historical Behavior Profiles:** Use historical delivery records to determine a courier's common delivery zones and rank new requests higher if they match.
- [ ] **User-Specific Machine Learning (ML):** Implement lightweight ML models to predict the likelihood of a courier accepting a request based on inputs like time of day, average speed, preferred hubs, and item categories.
