import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createPirateShip } from './PirateShip';

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
      5000 // Far clipping plane (render distance)
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

    // Particle data
    interface ParticleData {
      offset: number;
      startPos: THREE.Vector3;
      controlPoint1: THREE.Vector3;
      controlPoint2: THREE.Vector3;
      endPos: THREE.Vector3;
      axis: THREE.Vector3;
      angle: number;
      color: THREE.Color;
    }

    const particles: ParticleData[] = [];

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      const offset = (i / particleCount) * duration;
      
      // Start position (left side)
      const startPos = new THREE.Vector3(100, -1, -5000);
      
      // End position (right side)
      const endPos = new THREE.Vector3(200, -1, 700);
      
      // Control points for bezier curve
      const controlPoint1 = new THREE.Vector3(
        THREE.MathUtils.randFloat(-1000, -500),
        1,//THREE.MathUtils.randFloat(800, 800),
        THREE.MathUtils.randFloat(600, 1400)
      );
      
      const controlPoint2 = new THREE.Vector3(
        THREE.MathUtils.randFloat(100, 1400),
        -1,//THREE.MathUtils.randFloat(-200, -300),
        THREE.MathUtils.randFloat(-1600, -400)
      );
      
      // Rotation axis and angle
      const axis = new THREE.Vector3(
        THREE.MathUtils.randFloatSpread(2),
        THREE.MathUtils.randFloatSpread(2),
        THREE.MathUtils.randFloatSpread(2)
      ).normalize();
      
      const angle = Math.PI * THREE.MathUtils.randInt(16, 32);
      
      // Various shades of blue
      const color = new THREE.Color();
      const blueVariant = Math.random();
      
      if (blueVariant < 0.3) {
        // Vibrant blue - rgb(15, 178, 242) range
        color.setRGB(
          THREE.MathUtils.randFloat(10 / 255, 30 / 255),  // 15-30 / 255
          THREE.MathUtils.randFloat(120 / 255, 140 / 255),  // 165-190 / 255
          THREE.MathUtils.randFloat(230 / 255, 255 / 255)   // 230-250 / 255
        );
      } else if (blueVariant < 0.6) {
        // Cyan/light blue
        color.setRGB(
          THREE.MathUtils.randFloat(0.2, 0.4),
          THREE.MathUtils.randFloat(0.7, 0.9),
          THREE.MathUtils.randFloat(0.9, 1.0)
        );
      } else {
        // Bright sky blue
        color.setRGB(
          THREE.MathUtils.randFloat(0.3, 0.5),
          THREE.MathUtils.randFloat(0.8, 0.95),
          THREE.MathUtils.randFloat(0.95, 1.0)
        );
      }

      
      particles.push({
        offset,
        startPos,
        controlPoint1,
        controlPoint2,
        endPos,
        axis,
        angle,
        color
      });
    }

    // Cubic bezier function
    function cubicBezier(
      p0: THREE.Vector3,
      c0: THREE.Vector3,
      c1: THREE.Vector3,
      p1: THREE.Vector3,
      t: number
    ): THREE.Vector3 {
      const tn = 1 - t;
      return new THREE.Vector3(
        tn * tn * tn * p0.x + 3 * tn * tn * t * c0.x + 3 * tn * t * t * c1.x + t * t * t * p1.x,
        tn * tn * tn * p0.y + 3 * tn * tn * t * c0.y + 3 * tn * t * t * c1.y + t * t * t * p1.y,
        tn * tn * tn * p0.z + 3 * tn * tn * t * c0.z + 3 * tn * t * t * c1.z + t * t * t * p1.z
      );
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

    // Create and position the ship
    const shipGroup = createPirateShip();
    shipGroup.position.set(300, 100, 100);
    shipGroup.scale.set(3, 3, 3);
    shipGroup.rotation.y = 10 * Math.PI / 16; // Rotate 90 degrees to face along the river
    scene.add(shipGroup);

    // Add dedicated light for the ship to make it brighter
    const shipLight = new THREE.PointLight(0xffffff, 4, 2);
    shipLight.position.set(300, 150, 100);
    scene.add(shipLight);

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

      // Update particles
      for (let i = 0; i < particleCount; i++) {
        const particle = particles[i];
        
        // Calculate progress with time offset
        const tProgress = ((time + particle.offset) % duration) / duration;
        
        // Position along bezier curve
        position.copy(
          cubicBezier(
            particle.startPos,
            particle.controlPoint1,
            particle.controlPoint2,
            particle.endPos,
            tProgress
          )
        );
        
        // Rotation based on progress
        const currentAngle = particle.angle * tProgress;
        rotation.copy(quatFromAxisAngle(particle.axis, currentAngle));
        
        // Update matrix
        matrix.compose(position, rotation, scale);
        instancedMesh.setMatrixAt(i, matrix);
      }

      instancedMesh.instanceMatrix.needsUpdate = true;

      // Animate ship (gentle bobbing)
      shipGroup.position.y = -10 + Math.sin(time * 2) * 2 + 45;

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
    };
  }, []);

  return <div ref={mountRef} className="fixed top-0 left-0 w-full h-full z-0 bg-white" />;
};

export default PixelRiver;
