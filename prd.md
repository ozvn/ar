Project LiveCanvas (Code Name: MagicFrame) - PRD
1. Project Overview & Objective
Project LiveCanvas is an Augmented Reality (AR) experience designed to dissolve the boundary between static physical artwork (paintings, posters, photos) and the digital 3D world.

The primary goal is to allow users to point their smartphone camera at a 2D image hanging on a wall and see a 3D object emerge from it. The object must behave as if it is an integral part of the artwork, adhering strictly to perspective rules. This creates a modern "Moving Portrait" illusion, similar to the magical universe of Harry Potter.

2. Core Concepts
2.1. "Living Canvas" Illusion (The Harry Potter Effect)
Unlike standard AR apps that place objects on floors or in empty space, LiveCanvas focuses on Contextual Integration.

Perceived Depth: The 3D object should not look like a flat sticker; it must appear to have depth inside the frame of the painting.

Consistency: As the user moves closer or further away, the 3D object must scale and move in perfect synchronization with the physical 2D image.

2.2. Image Tracking (vs. Plane Detection)The system relies on Image-Targeted AR rather than surface/ground detection.Anchor Logic: The 2D image serves as the "Anchor" $(0,0,0)$. The 3D scene is constructed relative to this coordinate system.Stability: The object belongs to the image. If the physical frame is tilted on the wall, the 3D object must maintain that same tilt.

2.3. The Golden Rule: Static Non-Interactive Placement
A defining requirement is that the user cannot physically interact with the 3D object.

Prohibited Manipulations: Users cannot drag, rotate, or manually resize the object (No Pinch-to-Zoom / No Drag).

Sense of Reality: The object behaves like a physical sculpture or part of the painting. Its different sides become visible only when the user changes their physical viewing angle.

3. Tech Stack & Architecture
To ensure high accessibility, the project is purely Web-based.

Core Frameworks: * A-Frame (v1.5.0): For 3D scene rendering and entity management.

MindAR (v1.2.5): For computer vision and image tracking. MindAR is chosen for its performance, utilizing the device GPU via WebGL and Web Workers to keep the main thread free.

File Architecture: High-DPI images of the paintings will be compiled using the MindAR compiler into a single consolidated .mind file.

4. User Experience (UX) & Restrictions
4.1. Camera Lockdown
To maintain the 6 Degrees of Freedom (6DoF) illusion and prevent "drift," the default A-Frame controls (look-controls and wasd-controls) must be explicitly disabled. No external gesture-detector plugins shall be used.

4.2. Browser-Level Gesture Prevention
To prevent iOS Safari and Android Chrome from triggering default OS behaviors (like page zooming), the following defensive layers are required:

CSS: Apply touch-action: none, user-select: none, and -webkit-touch-callout: none.

JavaScript: Implement aggressive preventDefault() on touchmove, touchend, wheel, and gesturestart events with passive: false.

5. Visual Fidelity & Multi-Target Support
Lighting & Color: The A-Frame scene will use the sRGB color space. colorManagement: true and physicallyCorrectLights: true must be enabled for realistic lighting.

Depth Management: To prevent Z-fighting and ensure the object looks "inside" the frame, GLTF objects should have a slight Z-axis offset (e.g., position="0 0 0.05").

Multi-Target (Museum Simulation): The system must support multiple paintings simultaneously. This involves setting the maxTrack parameter and creating separate <a-entity> elements with unique targetIndex values.

Cursor AI Implementation Prompts
You can use these prompts sequentially in the Cursor "Composer" or "Chat" to build the project:

Step 1: Project Setup & Interface Constraints
"We are coding a mobile-friendly WebXR project called 'Project LiveCanvas'. Create an index.html file. Include A-Frame (v1.5.0), A-Frame Extras, and MindAR Image Tracking (v1.2.5) via CDN in the <head>. I want to strictly prevent the user from zooming or scrolling the page. Create a <style> block: set html, body, and a-scene to 100% dimensions, and add overflow: hidden, touch-action: none, user-select: none, and -webkit-touch-callout: none."

Step 2: Aggressive Gesture Blocking via JS
"We need a perfect 6DoF lock. We must stop browser-based pinch-to-zoom and overscroll using JavaScript. Inside <head>, open a <script> tag and create an IIFE. Add event listeners for touchmove (if multiple fingers or scale != 1), gesturestart, touchend (with a timer to prevent double-tap zoom), and wheel. Use passive: false and call e.preventDefault() in all of them."

Step 3: A-Frame Scene & Camera Configuration
"Add an <a-scene> to the <body>. Initialize MindAR with the scene parameter mindar-image="imageTargetSrc: ./assets/targets.mind; maxTrack: 2". Set color-space="sRGB" and renderer="colorManagement: true, physicallyCorrectLights: true". Hide default VR/Orientation UIs with vr-mode-ui="enabled: false" and device-orientation-permission-ui="enabled: false". Add an <a-camera>, but disable all controls using look-controls="enabled: false" and wasd-controls="enabled: false"."

Step 4: Adding 3D Assets & Target Linking
"Inside <a-scene>, open an <a-assets> block and define two <a-asset-item> entries for GLTF/GLB models (IDs: 'model1' and 'model2'). Then, create two <a-entity> elements using the mindar-image-target attribute. The first should have targetIndex: 0 and the second targetIndex: 1. Inside these, place <a-gltf-model> components referencing our assets. Give them a position="0 0 0.05" to sit slightly off the surface and include the animation-mixer component to play embedded animations."

