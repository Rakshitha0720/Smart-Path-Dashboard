# Assignment Submission - Tap Invest Frontend Developer 

This repository is a submission for the assignment given by **Tap Invest** for the role of **Frontend Developer**.  
I was required to build a useful and functional project utilizing at least **three** of the given Web APIs such as the **Geolocation API**, **Canvas API**, and others.

---

#  Smart Path Dashboard

A real-life problem-solving web app that tracks, simulates, and analyzes movement and paths using geolocation, canvas-based rendering, and network diagnostics.

---

## 📌 Project Summary

**Smart Path Dashboard** is a location-tracking web app that enables users to:
- Live track their movement
- Draw routes between two locations
- Simulate path traversal between places
- Monitor network connection status and performance
- Visualize activity insights (steps, calories, distance)

---

## ✅ Used Web APIs

This project utilizes **3+** modern Web APIs:

| API | Purpose |
|-----|---------|
| [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API) | For live tracking and simulating user location |
| [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) | To draw the path on a transparent layer over the map |
| [Background Tasks API (`requestIdleCallback`)](https://developer.mozilla.org/en-US/docs/Web/API/Background_Tasks_API) | To optimize and clean tracking data in idle time |
| [Network Information API](https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API) | To display the user's current network status and connection type |
| [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) | For lazy loading UI elements with animation effects |

---

## 🚀 Features

- 🌐 **Live Tracking**: Track your real-time location and path.
- 🗺️ **Route Drawing**: Enter start and end locations to generate route and stats.
- ⚙️ **Simulated Movement**: Visual simulation of moving from one point to another.
- 🧮 **Live Stats & Analytics**:
  - Total Distance
  - Estimated Steps Taken
  - Estimated Calories Burned
- 📊 **Interactive Charts** (via Chart.js)
- 🎨 **Smooth UI/UX** using Bootstrap 5 and AOS animations
- 🧠 **Background Optimization**: Reduces canvas load and clears outdated tracking data when idle.
- 📶 **Network Status Monitor** with connection type feedback (4G, Wi-Fi, etc.)
- ⚡ **Performance Indicator** based on FPS using requestAnimationFrame

---

## 🛠️ Tech Stack

- HTML5, CSS3
- JavaScript (Vanilla)
- [Leaflet.js](https://leafletjs.com/) (for map)
- [Chart.js](https://www.chartjs.org/) (for data visualization)
- Bootstrap 5
- AOS (Animate On Scroll Library)

---

## 📂 File Structure

```
├── index.html        # Main UI structure
├── style.css         # Custom styles and themes
├── script.js         # Logic, APIs, interactions, rendering
```

---

## 🧠 How It Solves a Real-Life Problem

This app is designed for:
- Walkers, hikers, or tourists wanting to track their route
- People needing offline distance estimations
- Anyone monitoring their activity and performance on the move
- Network-aware applications that adjust behavior based on connection type

---

## 🔗 Deployment

Just open `index.html` in a browser. No backend or build step is required.

 Deployed link for Demo https://rakshitha0720.github.io/Smart-Path-Dashboard/ 

---

## 📅 Author & Credits

**Author**: *Rakshitha S*  
This project was created as a submission for the **Frontend Developer Assignment** by **Tap Invest**, using multiple modern Web APIs.

---

## 📝 License

This project is for educational purposes only and not intended for production use. Customize and build upon it freely.
