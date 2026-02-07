import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createPirateShip } from './PirateShip';
import { createIsland } from './Island';

const PixelRiver = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60, // Field of view (larger = wider view)
      window.innerWidth / window.innerHeight,
      0.1, // Near clipping plane
      600 // Far clipping plane (render distance)
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    camera.position.set(0, 100, 700);
    camera.lookAt(0, 0, 0);

    // Lighting
    const light = new THREE.PointLight(0xffffff, 4, 1000, 2);
    light.position.set(0, 400, 0);
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Particle system
    const particleCount = 30000;
    const duration = 20;
    
    // Single geometry for all particles
    const geometry = new THREE.BoxGeometry(3, 3, 3);
    
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x0fb2f2), // rgb(15, 178, 242)
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.2
    });

    // Create single instanced mesh
    const instancedMesh = new THREE.InstancedMesh(geometry, material, particleCount);
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    instancedMesh.frustumCulled = false;
    scene.add(instancedMesh);

    // Particle data for ring
    interface ParticleData {
      offset: number;
      radius: number; // Distance from center
      orbitSpeed: number; // Speed of rotation
      verticalOffset: number; // Slight vertical variation
      axis: THREE.Vector3;
      angle: number;
    }

    const particles: ParticleData[] = [];

    // Ring parameters
    const ringInnerRadius = 500;
    const ringOuterRadius = 900;
    
    // Initialize particles in ring formation
    for (let i = 0; i < particleCount; i++) {
      const offset = (i / particleCount) * Math.PI * 2; // Angle around the ring
      
      // Random radius within ring width
      const radius = THREE.MathUtils.randFloat(ringInnerRadius, ringOuterRadius);
      
      // Orbit speed (slightly randomized for natural flow)
      const orbitSpeed = THREE.MathUtils.randFloat(0.8, 1.2);
      
      // Slight vertical variation for depth
      const verticalOffset = THREE.MathUtils.randFloat(-5, 5);
      
      // Rotation axis and angle for cube spinning
      const axis = new THREE.Vector3(
        THREE.MathUtils.randFloatSpread(2),
        THREE.MathUtils.randFloatSpread(2),
        THREE.MathUtils.randFloatSpread(2)
      ).normalize();
      
      const angle = Math.PI * THREE.MathUtils.randInt(16, 32);
      
      particles.push({
        offset,
        radius,
        orbitSpeed,
        verticalOffset,
        axis,
        angle,
      });
    }

    // Quaternion from axis angle
    function quatFromAxisAngle(axis: THREE.Vector3, angle: number): THREE.Quaternion {
      const halfAngle = angle * 0.5;
      return new THREE.Quaternion(
        axis.x * Math.sin(halfAngle),
        axis.y * Math.sin(halfAngle),
        axis.z * Math.sin(halfAngle),
        Math.cos(halfAngle)
      );
    }

    function randomScaleForTriangle() {
        return THREE.MathUtils.randFloatSpread(1) * 1 + 4;
    }

    // Create and position the ship on the ring
    const shipGroup = createPirateShip();
    shipGroup.position.set(250, 100, 300);
    shipGroup.scale.set(3, 4, 3);
    // Rotate ship to face along the ring's tangent
    shipGroup.rotation.y = 8 * Math.PI / 16;
    scene.add(shipGroup);

    // Add dedicated light for the ship to make it brighter
    const shipLight = new THREE.PointLight(0xffffff, 4, 2);
    shipLight.position.set(300, 150, 100);
    scene.add(shipLight);

    // Create and position the island in center-left
    const islandGroup = createIsland();
    islandGroup.position.set(-200, 30, 375);
    islandGroup.scale.set(3, 3, 3);
    scene.add(islandGroup);

    // Add dedicated light for the island to make it visible
    const islandLight = new THREE.PointLight(0xffffff, 6, 500);
    islandLight.position.set(-200, 150, 200);
    scene.add(islandLight);

    // Animation
    let time = 0;
    const timeStep = 1 / 60;
    let animationId: number;

    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const scale = new THREE.Vector3(randomScaleForTriangle(), randomScaleForTriangle(), randomScaleForTriangle());

    function animate() {
      animationId = requestAnimationFrame(animate);

      // Update particles in ring formation
      for (let i = 0; i < particleCount; i++) {
        const particle = particles[i];
        
        // Calculate current angle around the ring
        const currentAngle = particle.offset + (time * particle.orbitSpeed * 0.5);
        
        // Position in circular orbit
        position.set(
          Math.cos(currentAngle) * particle.radius - 400,
          particle.verticalOffset,
          Math.sin(currentAngle) * particle.radius + 400
        );
        
        // Rotation based on time
        const spinAngle = particle.angle * (time / duration);
        rotation.copy(quatFromAxisAngle(particle.axis, spinAngle));
        
        // Update matrix
        matrix.compose(position, rotation, scale);
        instancedMesh.setMatrixAt(i, matrix);
      }

      instancedMesh.instanceMatrix.needsUpdate = true;

      // Animate ship (gentle bobbing)
      shipGroup.position.y = -10 + Math.sin(time * 2) * 2 + 50;

      time += timeStep;
      time %= duration;

      renderer.render(scene, camera);
    }

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      if (mountRef.current && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      instancedMesh.dispose();
      
      // Dispose ship geometries and materials
      shipGroup.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (object.material instanceof THREE.Material) {
            object.material.dispose();
          }
        }
      });

      // Dispose island geometries and materials
      islandGroup.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (object.material instanceof THREE.Material) {
            object.material.dispose();
          }
        }
      });
    };
  }, []);

  return <div ref={mountRef} className="fixed top-0 left-0 w-full h-full z-0 bg-white" />;
};

export default PixelRiver;
