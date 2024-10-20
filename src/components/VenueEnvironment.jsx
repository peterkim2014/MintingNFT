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

    // Store the frames in an array for raycasting
    const nftFrames = [];

    // Display NFT collections in the 3D space
    virtualParentNFTList.forEach((collection, index) => {
      const textureLoader = new THREE.TextureLoader();
      const nftTexture = textureLoader.load(collection.image_url);

      // Create a 3D frame for each NFT
      const frameGeometry = new THREE.BoxGeometry(3, 4, 0.1);
      const frameMaterial = new THREE.MeshBasicMaterial({ map: nftTexture });
      const frame = new THREE.Mesh(frameGeometry, frameMaterial);

      // Position the frames in a grid layout
      frame.position.set((index % 5) * 5 - 10, 2, -10 - Math.floor(index / 5) * 5);
      scene.add(frame);

      // Add the frame to the array for raycasting
      nftFrames.push(frame);
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
            top: isNFTMinimized ? '10px' : '50%',
            left: isNFTMinimized ? '10px' : '50%',
            transform: isNFTMinimized ? 'none' : 'translate(-50%, -50%)',
            background: '#fff',
            padding: '20px',
            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
            zIndex: 1001,
            transition: 'all 0.3s ease',
            width: isNFTMinimized ? '150px' : '400px',
            height: isNFTMinimized ? '50px' : 'auto',
            cursor: isNFTMinimized ? 'pointer' : 'default'
          }}
          onClick={toggleNFTMinimize}
        >
          {isNFTMinimized ? (
            <div style={{'padding': '10px','color': 'black', 'text-align': 'center', position: 'absolute', top: '50px', left: '10px'}}>
              <h4 style={{'margin': '0'}}>{selectedNFT.name}</h4>
              <p style={{'margin': '0'}}>Click to expand</p>
            </div>
          ) : (
            <div>
              <h3>{selectedNFT.name}</h3>
              <p>{selectedNFT.description}</p>
              <img src={selectedNFT.image_url} alt={selectedNFT.name} style={{ width: '100%' }} />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNFTMinimize();
                }}
                style={{
                  marginTop: '10px',
                  padding: '5px 10px',
                  background: '#007BFF',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
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
