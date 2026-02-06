// ===== PIRATE SHIP =====

import * as THREE from 'three';

// Encapsulated ship builder function
export const createPirateShip = () => {
  const shipGroup = new THREE.Group();

  // Brown and white colors for the ship
  const brownColors = [0x8B4513, 0xA0522D, 0x654321, 0x704214];
  const whiteColors = [0xFFFFFF, 0xFFFAF0, 0xF5F5DC, 0xFAF0E6];

  const createCube = (x: number, y: number, z: number, size: number, color: number) => {
    const cubeGeom = new THREE.BoxGeometry(size, size, size);
    const cubeMat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.3, // Lower roughness for more shine
      metalness: 0.1,
      emissive: color, // Add emissive color to make it glow
      emissiveIntensity: 0.3, // Make it glow slightly
    });
    const cube = new THREE.Mesh(cubeGeom, cubeMat);
    cube.position.set(x, y, z);
    return cube;
  };

  const cubeSize = 4;
  const randomBrown = () => brownColors[Math.floor(Math.random() * brownColors.length)];
  const randomWhite = () => whiteColors[Math.floor(Math.random() * whiteColors.length)];

  // Build hull (bottom)
  for (let x = -30; x <= 30; x += cubeSize) {
    for (let z = -10; z <= 10; z += cubeSize) {
      shipGroup.add(createCube(x, -15, z, cubeSize, randomBrown()));
    }
  }

  // Lower hull sides
  for (let x = -35; x <= 35; x += cubeSize) {
    for (let z = -15; z <= 15; z += cubeSize) {
      if (Math.abs(z) > 8) {
        shipGroup.add(createCube(x, -10, z, cubeSize, randomBrown()));
      }
    }
  }

  // Mid hull
  for (let x = -40; x <= 40; x += cubeSize) {
    for (let z = -18; z <= 18; z += cubeSize) {
      if (Math.abs(z) > 12) {
        shipGroup.add(createCube(x, -5, z, cubeSize, randomBrown()));
      }
    }
  }

  // Upper hull / deck
  for (let x = -40; x <= 40; x += cubeSize) {
    for (let z = -18; z <= 18; z += cubeSize) {
      if (Math.abs(z) > 14 || Math.random() > 0.7) {
        shipGroup.add(createCube(x, 0, z, cubeSize, randomBrown()));
      }
    }
  }

  // Bow (front)
  for (let x = 40; x <= 50; x += cubeSize) {
    const taper = (x - 40) / 10;
    for (let z = -15 + taper * 15; z <= 15 - taper * 15; z += cubeSize) {
      if (Math.abs(z) > 10 - taper * 10) {
        shipGroup.add(createCube(x, -10 + taper * 5, z, cubeSize, randomBrown()));
        shipGroup.add(createCube(x, -5 + taper * 5, z, cubeSize, randomBrown()));
      }
    }
  }

  // Stern (back)
  for (let y = -10; y <= 5; y += cubeSize) {
    for (let z = -15; z <= 15; z += cubeSize) {
      shipGroup.add(createCube(-40, y, z, cubeSize, randomBrown()));
    }
  }

  // Masts
  for (let y = 0; y <= 50; y += cubeSize) {
    shipGroup.add(createCube(0, y, 0, cubeSize, randomBrown()));
  }
  for (let y = 0; y <= 40; y += cubeSize) {
    shipGroup.add(createCube(25, y, 0, cubeSize, randomBrown()));
  }
  for (let y = 0; y <= 35; y += cubeSize) {
    shipGroup.add(createCube(-25, y, 0, cubeSize, randomBrown()));
  }

  // Sails
  for (let y = 15; y <= 45; y += cubeSize) {
    for (let x = -15; x <= 15; x += cubeSize) {
      if (Math.random() > 0.2) {
        shipGroup.add(createCube(x, y, 5, cubeSize, randomWhite()));
      }
    }
  }
  for (let y = 12; y <= 35; y += cubeSize) {
    for (let x = 15; x <= 35; x += cubeSize) {
      if (Math.random() > 0.2) {
        shipGroup.add(createCube(x, y, 5, cubeSize, randomWhite()));
      }
    }
  }
  for (let y = 10; y <= 30; y += cubeSize) {
    for (let x = -35; x <= -15; x += cubeSize) {
      if (Math.random() > 0.2) {
        shipGroup.add(createCube(x, y, 5, cubeSize, randomWhite()));
      }
    }
  }

  // Deck decorations
  for (let i = 0; i < 20; i++) {
    const x = THREE.MathUtils.randFloat(-35, 35);
    const z = THREE.MathUtils.randFloat(-12, 12);
    shipGroup.add(createCube(x, 5, z, cubeSize * 0.8, randomBrown()));
  }

  return shipGroup;
};