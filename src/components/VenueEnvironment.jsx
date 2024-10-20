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
  const [toolbarPosition, setToolbarPosition] = useState({ top: 10, left: 10 });
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
    const delta = clock.getDelta();
    
    const handleKeyDown = (event) => {
      switch (event.code) {
        case 'KeyW': controls.moveForward(0.3); break;
        case 'KeyS': controls.moveForward(-0.3); break;
        case 'KeyA': controls.moveRight(-0.3); break;
        case 'KeyD': controls.moveRight(0.3); break;
        case 'Escape': // Detect the Escape key
          controls.unlock(); // Exit 360° navigation
          setMouseControl(true); // Switch back to pointer mode
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
        // Activate the keydown listener when the mouse is locked
        window.addEventListener('keydown', handleKeyDown);
      });

      controls.addEventListener('unlock', () => {
        console.log("Pointer unlocked");
        // Remove the keydown listener when the mouse is unlocked
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
        <div style={{ position: 'absolute', top: '10px', left: '10px', background: '#fff', padding: '10px' }}>
          <h3>{selectedNFT.name}</h3>
          <p>{selectedNFT.description}</p>
          <img src={selectedNFT.image_url} alt={selectedNFT.name} style={{ width: '150px' }} />
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
          {mouseControl ? 'Enable 360° Navigation' : 'Enable Mouse Clicking'}
        </button>
      </div>
    </div>
  );
};

export default VenueEnvironment;
