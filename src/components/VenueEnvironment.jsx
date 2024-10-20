import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';

const VenueEnvironment = ({virtualParentNFTList}) => {
  const mountRef = useRef(null);
  const controlsRef = useRef(null);
  const isMovingRef = useRef(false); // Track if movement is happening

  useEffect(() => {
    // Initialize the scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdddddd);

    // Set up camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 5); // Height at 1.6 units for "human" perspective

    // Set up renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    const currentMount = mountRef.current; // Copy ref to avoid React Hooks warning
    currentMount.appendChild(renderer.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040); // Soft light
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 10, 7.5).normalize();
    scene.add(directionalLight);

    // Create the museum floor
    const floorGeometry = new THREE.PlaneGeometry(100, 100);
    const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2; // Lay it flat
    scene.add(floor);

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
    });

    // PointerLockControls for movement
    const controls = new PointerLockControls(camera, document.body);
    controlsRef.current = controls;
    
    // Only lock controls when clicking inside the 3D environment
    currentMount.addEventListener('click', () => {
      controls.lock();  // Locks the pointer to control the character
    });

    controls.addEventListener('lock', () => {
      console.log("Pointer locked");
    });

    controls.addEventListener('unlock', () => {
      console.log("Pointer unlocked");
    });

    // Handle player movement
    const handleKeyDown = (event) => {
      if (event.key === 'w') {
        controls.moveForward(0.2); 
      } else if (event.key === 's') {
        controls.moveForward(-0.2); 
      } else if (event.key === 'a') {
        controls.moveRight(-0.2); 
      } else if (event.key === 'd') {
        controls.moveRight(0.2); 
      }
    };

    const handleKeyUp = () => {
      isMovingRef.current = false;  // Stop movement when keys are released
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Render loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Clean up on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      currentMount.removeChild(renderer.domElement);
    };
  }, [virtualParentNFTList]);

  return (
    <div
      style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}
      ref={mountRef}
    />
  );
};

export default VenueEnvironment;
