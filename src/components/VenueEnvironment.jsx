import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';

const VenueEnvironment = ({ virtualParentNFTList }) => {
  const mountRef = useRef(null);
  const controlsRef = useRef(null);
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const clock = new THREE.Clock();
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [mouseControl, setMouseControl] = useState(true); // Toggle mouse control
  const [toolbarPosition, setToolbarPosition] = useState({ top: 50, right: 50 });
  const [isNFTMinimized, setIsNFTMinimized] = useState(false); // State to track minimization
  const toolbarRef = useRef(null);

  useEffect(() => {
    // Initialize the scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdddddd);

// Set up camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 5);

// Set up renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
const currentMount = mountRef.current;
currentMount.appendChild(renderer.domElement);

// Add lighting
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(5, 10, 7.5).normalize();
scene.add(directionalLight);

// Create textured walls for the virtual hall
const wallTexture = new THREE.TextureLoader().load('https://example.com/path/to/wall-texture.jpg'); // Replace with a real URL
wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping; // Repeat the texture for large walls
wallTexture.repeat.set(4, 2); // Set the repeat for the texture pattern

const wallMaterial = new THREE.MeshStandardMaterial({
  map: wallTexture,
  metalness: 0.3,
  roughness: 0.7,
  side: THREE.DoubleSide,
});

// Add windows or panel details by cutting out sections of the walls
const windowGeometry = new THREE.PlaneGeometry(5, 2.5); // Window size
const windowMaterial = new THREE.MeshBasicMaterial({ color: 0x5555ff, opacity: 0.8, transparent: true }); // Semi-transparent blue for windows

// Back wall with windows
const wall1 = new THREE.Mesh(new THREE.BoxGeometry(40, 10, 1), wallMaterial);
wall1.position.set(0, 5, -20);
scene.add(wall1);

const window1 = new THREE.Mesh(windowGeometry, windowMaterial);
window1.position.set(-10, 7, -19.5); // Slightly in front of the wall
scene.add(window1);

const window2 = window1.clone();
window2.position.set(10, 7, -19.5);
scene.add(window2);

// Left wall with panels
const wall2 = wall1.clone();
wall2.rotation.y = Math.PI / 2;
wall2.position.set(-20, 5, 0);
scene.add(wall2);

const leftPanel1 = new THREE.Mesh(windowGeometry, windowMaterial);
leftPanel1.position.set(-19.5, 7, -5); // Close to left wall
leftPanel1.rotation.y = Math.PI / 2;
scene.add(leftPanel1);

const leftPanel2 = leftPanel1.clone();
leftPanel2.position.set(-19.5, 7, 5);
scene.add(leftPanel2);

// Right wall with reflections
const wall3 = wall1.clone();
wall3.rotation.y = -Math.PI / 2;
wall3.position.set(20, 5, 0);
scene.add(wall3);

const rightWallReflectiveMaterial = new THREE.MeshStandardMaterial({
  color: 0x444444,
  metalness: 1,
  roughness: 0.05,
  envMapIntensity: 1,
});

const rightWallPanel = new THREE.Mesh(new THREE.BoxGeometry(40, 10, 1), rightWallReflectiveMaterial);
rightWallPanel.position.set(19.9, 5, 0);
scene.add(rightWallPanel);

  // Create a unique floor for the virtual hall
  const floorGeometry = new THREE.PlaneGeometry(40, 40, 10, 10); // Adding segments for detailed textures
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333, // Dark base color
    metalness: 0.6, // Slightly metallic for a shiny effect
    roughness: 0.4, // Some smoothness for reflections
  });

  // Create a checkered pattern using a custom texture
  const textureLoader = new THREE.TextureLoader();
  const checkeredTexture = textureLoader.load('https://example.com/path/to/checkered-texture.jpg'); // Use a real URL here

  // Apply the texture to the floor
  checkeredTexture.wrapS = checkeredTexture.wrapT = THREE.RepeatWrapping; // Repeat the texture
  checkeredTexture.repeat.set(8, 8); // Set the repeat pattern for checkered tiles

  floorMaterial.map = checkeredTexture; // Apply texture to the material

  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2; // Rotate to lie flat
  scene.add(floor);

  // Add subtle glow effect (optional)
  const floorGlowGeometry = new THREE.PlaneGeometry(40, 40);
  const floorGlowMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 1.0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float time;
      void main() {
        vec2 st = vUv;
        st *= 10.0;
        vec3 color = vec3(0.3, 0.5, 1.0); // Custom glow color
        color *= sin(st.x + time) * sin(st.y + time);
        gl_FragColor = vec4(color, 0.2); // Glow intensity
      }
    `,
    transparent: true,
  });
  const floorGlow = new THREE.Mesh(floorGlowGeometry, floorGlowMaterial);
  floorGlow.rotation.x = -Math.PI / 2;
  floorGlow.position.y = 0.01; // Slightly above the main floor for effect
  scene.add(floorGlow);

  // Animate the glow effect over time
  function animateGlow(time) {
    floorGlowMaterial.uniforms.time.value = time * 0.001;
    requestAnimationFrame(animateGlow);
  }
  animateGlow(0);


    // Store the frames in an array for raycasting
    const nftFrames = [];

    // Display NFT collections on the walls
    virtualParentNFTList.forEach((collection, index) => {
      const textureLoader = new THREE.TextureLoader();
      const nftTexture = textureLoader.load(collection.image_url);

      // Create a 3D frame for each NFT
      const frameGeometry = new THREE.PlaneGeometry(3, 4); // Make the NFT appear as a "picture"
      const frameMaterial = new THREE.MeshBasicMaterial({ map: nftTexture });
      const frame = new THREE.Mesh(frameGeometry, frameMaterial);

      // Position the NFTs on the walls
      const wallIndex = Math.floor(index / 5); // Select which wall (0: back, 1: left, 2: right)
      const xPos = (index % 5) * 5 - 10; // Adjust horizontal position
      const yPos = 3; // Adjust vertical position
      let zPos = -15; // Distance from the camera for the back wall

      if (wallIndex === 1) {
        frame.position.set(-15, yPos, xPos); // Position on the left wall
        frame.rotation.y = Math.PI / 2;
      } else if (wallIndex === 2) {
        frame.position.set(15, yPos, xPos); // Position on the right wall
        frame.rotation.y = -Math.PI / 2;
      } else {
        frame.position.set(xPos, yPos, zPos); // Position on the back wall
      }

      scene.add(frame);
      nftFrames.push(frame); // Store for raycasting
    });

    // PointerLockControls for 360-degree movement
    const controls = new PointerLockControls(camera, document.body);
    controlsRef.current = controls;

    const handleKeyDown = (event) => {
      switch (event.code) {
        case 'KeyW': controls.moveForward(0.3); break;
        case 'KeyS': controls.moveForward(-0.3); break;
        case 'KeyA': controls.moveRight(-0.3); break;
        case 'KeyD': controls.moveRight(0.3); break;
        case 'Escape': // Detect the Escape key
          controls.unlock(); // Exit 360° navigation
          setMouseControl(true); // Automatically switch to pointer mode
          break;
        default: break;
      }
    };

    // Only use PointerLockControls in navigation mode
    if (!mouseControl) {
      currentMount.addEventListener('click', () => {
        controls.lock(); // Locks the pointer to control the camera
      });

      controls.addEventListener('lock', () => {
        console.log("Pointer locked");
        window.addEventListener('keydown', handleKeyDown);
      });

      controls.addEventListener('unlock', () => {
        console.log("Pointer unlocked");
        window.removeEventListener('keydown', handleKeyDown);
      });
    } else {
      controls.unlock(); // Unlock and remove controls when in pointer mode
      window.addEventListener('keydown', handleKeyDown); // Ensure keydown events still work
    }

    // Handle mouse move to update raycaster
    const onMouseMove = (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    // Handle mouse click to check if an NFT is clicked
    const onMouseClick = () => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nftFrames);

      if (intersects.length > 0) {
        const selectedObject = intersects[0].object;
        const selectedIndex = nftFrames.indexOf(selectedObject);
        setSelectedNFT(virtualParentNFTList[selectedIndex]); // Set the selected NFT
        console.log("Selected NFT:", virtualParentNFTList[selectedIndex]);
        setIsNFTMinimized(false); // Reset minimization when a new NFT is selected
      }
    };

    // Event listeners for pointer mode
    if (mouseControl) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('click', onMouseClick);
    } else {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('click', onMouseClick);
    }

    // Render loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    animate();

    // Clean up on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (mouseControl) {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('click', onMouseClick);
      }
      currentMount.removeChild(renderer.domElement);
    };
  }, [virtualParentNFTList, mouseControl]);

  // Toggle between mouse visibility for navigation and NFT clicking
  const toggleMouseControl = () => {
    setMouseControl((prev) => !prev);
  };

  // Toggle NFT minimization
  const toggleNFTMinimize = () => {
    setIsNFTMinimized((prev) => !prev);
  };

  // Handle toolbar drag
  const onMouseDown = (e) => {
    const shiftX = e.clientX - toolbarRef.current.getBoundingClientRect().left;
    const shiftY = e.clientY - toolbarRef.current.getBoundingClientRect().top;

    const moveAt = (pageX, pageY) => {
      setToolbarPosition({
        left: pageX - shiftX,
        top: pageY - shiftY
      });
    };

    const onMouseMove = (e) => {
      moveAt(e.pageX, e.pageY);
    };

    document.addEventListener('mousemove', onMouseMove);

    document.onmouseup = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.onmouseup = null;
    };
  };

  useEffect(() => {
    const toolbarElement = toolbarRef.current;
    toolbarElement.onmousedown = onMouseDown;

    return () => {
      toolbarElement.onmousedown = null;
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }} ref={mountRef}>
      {selectedNFT && (
        <div
            style={{
            position: 'absolute',
            top: isNFTMinimized ? '125px' : '50%',
            left: isNFTMinimized ? '10px' : '50%',
            transform: isNFTMinimized ? 'none' : 'translate(-50%, -50%)',
            background: isNFTMinimized
                ? 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)'
                : '#fff', // Background changes based on minimized state
            padding: isNFTMinimized ? '15px' : '20px',
            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
            zIndex: 1001,
            transition: 'all 0.3s ease',
            width: isNFTMinimized ? '150px' : '400px',
            height: isNFTMinimized ? '50px' : 'auto',
            cursor: 'pointer',
            color: isNFTMinimized ? '#fff' : '#000',
            textAlign: isNFTMinimized ? 'center' : 'left',
            fontFamily: 'Arial, sans-serif', // Modern, clean font
            }}
            onClick={toggleNFTMinimize}
        >
            {isNFTMinimized ? (
            // Minimized View
            <div>
                <h4
                style={{
                    margin: '0',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    textShadow: '1px 1px 3px rgba(0, 0, 0, 0.3)',
                }}
                >
                {selectedNFT.name}
                </h4>
                <p
                style={{
                    margin: '5px 0 0 0',
                    fontSize: '14px',
                    color: '#f0f0f0',
                }}
                >
                Click to expand
                </p>
            </div>
            ) : (
            // Expanded View
            <div>
                <h3
                style={{
                    fontSize: '24px',
                    color: '#000',
                }}
                >
                {selectedNFT.name}
                </h3>
                {/* <p style={{ color: '#333' }}>{selectedNFT.description}</p> */}
                <img
                src={selectedNFT.image_url}
                alt={selectedNFT.name}
                style={{ width: '100%', borderRadius: '8px' }}
                />
                <button
                onClick={(e) => {
                    e.stopPropagation(); // Prevent clicking from toggling the entire container
                    toggleNFTMinimize();
                }}
                style={{
                    marginTop: '10px',
                    padding: '8px 12px',
                    background: '#007BFF',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                }}
                >
                Minimize
                </button>
            </div>
            )}
        </div>
        )}
      <div
        ref={toolbarRef}
        style={{
          position: 'absolute',
          top: `${toolbarPosition.top}px`,
          left: `${toolbarPosition.left}px`,
          background: 'lightgray',
          padding: '10px',
          cursor: 'move',
          zIndex: 1000
        }}
      >
        <button onClick={toggleMouseControl}>
          {mouseControl ? 'Click on Screen to enable 360° Navigation' : 'Press Esc to disable 360° Navigation'}
        </button>
      </div>
    </div>
  );
};

export default VenueEnvironment;
