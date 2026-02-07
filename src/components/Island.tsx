// ===== ISLAND WITH BILLBOARD =====

import * as THREE from 'three';

// Encapsulated island builder function
export const createIsland = () => {
  const islandGroup = new THREE.Group();

  // Colors for the island
  const sandColors = [0xFFFACD, 0xFFFFE0, 0xFFF8DC, 0xFFE4B5, 0xFFFDD0];
  const greenColors = [0x228B22, 0x32CD32, 0x3CB371, 0x2E8B57];
  const brownColors = [0x8B4513, 0xA0522D, 0x654321, 0x704214];
  const billboardWhite = [0xFFFFFF, 0xFFFAF0, 0xF5F5DC];

  const createCube = (x: number, y: number, z: number, size: number, color: number) => {
    const cubeGeom = new THREE.BoxGeometry(size, size, size);
    const cubeMat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.3,
      metalness: 0.1,
      emissive: color,
      emissiveIntensity: 0.3,
    });
    const cube = new THREE.Mesh(cubeGeom, cubeMat);
    cube.position.set(x, y, z);
    return cube;
  };

  const cubeSize = 4;
  const randomSand = () => sandColors[Math.floor(Math.random() * sandColors.length)];
  const randomGreen = () => greenColors[Math.floor(Math.random() * greenColors.length)];

  // Build island base (sand/rock foundation)
  // Bottom layer - gently rounded oval shape
  for (let x = -100; x <= 100; x += cubeSize) {
    for (let z = -65; z <= 65; z += cubeSize) {
      // Elliptical distance: (x/a)^2 + (z/b)^2
      const ellipseDist = (x * x) / (100 * 100) + (z * z) / (65 * 65);
      if (ellipseDist < 1.0) {
        islandGroup.add(createCube(x, -20, z, cubeSize, randomSand()));
      }
    }
  }

  // Middle layer - slightly smaller ellipse
  for (let x = -90; x <= 90; x += cubeSize) {
    for (let z = -58; z <= 58; z += cubeSize) {
      const ellipseDist = (x * x) / (90 * 90) + (z * z) / (58 * 58);
      if (ellipseDist < 1.0) {
        islandGroup.add(createCube(x, -15, z, cubeSize, randomSand()));
      }
    }
  }

  // Top surface layer (beach) - smaller ellipse
  for (let x = -80; x <= 80; x += cubeSize) {
    for (let z = -52; z <= 52; z += cubeSize) {
      const ellipseDist = (x * x) / (80 * 80) + (z * z) / (52 * 52);
      if (ellipseDist < 1.0) {
        islandGroup.add(createCube(x, -10, z, cubeSize, randomSand()));
      }
    }
  }

  // Add some grass patches on top - grass layer
  for (let x = -70; x <= 70; x += cubeSize) {
    for (let z = -45; z <= 45; z += cubeSize) {
      const ellipseDist = (x * x) / (70 * 70) + (z * z) / (45 * 45);
      if (ellipseDist < 1.0 && Math.random() > 0.4) {
        islandGroup.add(createCube(x, -5, z, cubeSize, randomGreen()));
      }
    }
  }

  return islandGroup;
};
