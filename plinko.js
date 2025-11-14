// 3D Plinko Game Implementation with Three.js and Cannon.js
// This file is completely isolated and does not interfere with mining logic

class PlinkoGame {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error('Plinko container not found');
      return;
    }

    // Game state
    this.resultCallback = null;

    // Initialize
    this.init();
  }

  init() {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);

    // Camera setup - positioned for 2D view
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    this.camera.position.set(0, -1, 15); // Shifted down to see bottom slot
    this.camera.lookAt(0, -1, 0);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);

    // Physics world
    this.world = new CANNON.World();
    this.world.gravity.set(0, -25, 0);
    this.world.defaultContactMaterial.restitution = 0.65;

    // Build the 2D Plinko board
    this.buildBoard();

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());

    // Start animation loop
    this.animate();
  }

  buildBoard() {
    this.pegs = [];
    this.pegBodies = [];
    this.slots = [];

    const pegRadius = 0.15;
    const rows = 12;
    const cols = 9;
    const spacing = 0.9;
    const boardHeight = rows * spacing;

    // Create pegs in brick/staggered pattern
    const pegMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x16a34a,
      metalness: 0.3,
      roughness: 0.4
    });

    for (let row = 0; row < rows; row++) {
      const numPegsInRow = cols;
      
      for (let col = 0; col < numPegsInRow; col++) {
        // Brick-pattern offset: odd rows shifted by half spacing
        const isOddRow = row % 2 === 1;
        const baseX = (col - (numPegsInRow - 1) / 2) * spacing;
        const offsetX = isOddRow ? spacing / 2 : 0;
        const x = baseX + offsetX;
        const y = boardHeight / 2 - row * spacing - 2;

        // Visual peg (cylinder)
        const pegGeometry = new THREE.CylinderGeometry(pegRadius, pegRadius, 0.3, 16);
        const peg = new THREE.Mesh(pegGeometry, pegMaterial);
        peg.rotation.x = Math.PI / 2; // Face camera
        peg.position.set(x, y, 0);
        this.scene.add(peg);
        this.pegs.push(peg);

        // Physics body (sphere for better collision)
        const pegShape = new CANNON.Sphere(pegRadius);
        const pegBody = new CANNON.Body({ 
          mass: 0, 
          shape: pegShape,
          material: new CANNON.Material({ restitution: 0.8, friction: 0.1 })
        });
        pegBody.position.set(x, y, 0);
        this.world.addBody(pegBody);
        this.pegBodies.push(pegBody);
      }
    }

    // Create single small green slot at bottom (impossible to reach)
    const slotWidth = 0.6;
    const slotHeight = 0.4;
    const slotY = -boardHeight / 2 - 2.5;
    
    const slotGeometry = new THREE.BoxGeometry(slotWidth, slotHeight, 0.5);
    const slotMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x16a34a, // Green
      metalness: 0.6,
      roughness: 0.3,
      emissive: 0x16a34a,
      emissiveIntensity: 0.4
    });
    
    const slot = new THREE.Mesh(slotGeometry, slotMaterial);
    slot.position.set(0, slotY, 0);
    slot.userData.slotIndex = 0;
    this.scene.add(slot);
    this.slots.push(slot);

    // Create one big invisible pin directly above the slot to block balls
    const pinRadius = 0.8;
    const pinY = slotY + slotHeight / 2 + pinRadius; // Position pin just above slot
    
    // No visual mesh - completely invisible
    
    // Create physics sphere - this will block the balls
    const pinShape = new CANNON.Sphere(pinRadius);
    const pinBody = new CANNON.Body({
      mass: 0, // Static object
      material: new CANNON.Material({ friction: 0.3, restitution: 0.8 })
    });
    pinBody.addShape(pinShape);
    pinBody.position.set(0, pinY, 0);
    this.world.addBody(pinBody);

    // Slot walls (physics)
    const slotWallThickness = 0.1;
    const leftWall = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(slotWallThickness / 2, slotHeight, 0.5))
    });
    leftWall.position.set(-slotWidth / 2, slotY, 0);
    this.world.addBody(leftWall);

    const rightWall = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(slotWallThickness / 2, slotHeight, 0.5))
    });
    rightWall.position.set(slotWidth / 2, slotY, 0);
    this.world.addBody(rightWall);

    // Side walls
    const wallHeight = boardHeight + 5;
    const sideWallThickness = 0.2;
    const wallX = 5;

    const leftSideWall = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(sideWallThickness / 2, wallHeight / 2, 0.5))
    });
    leftSideWall.position.set(-wallX, 0, 0);
    this.world.addBody(leftSideWall);

    const rightSideWall = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(sideWallThickness / 2, wallHeight / 2, 0.5))
    });
    rightSideWall.position.set(wallX, 0, 0);
    this.world.addBody(rightSideWall);

    // Bottom floor
    const floorBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(10, 0.1, 0.5))
    });
    floorBody.position.set(0, slotY - 1, 0);
    this.world.addBody(floorBody);
  }

  dropBall(onResult) {
    this.resultCallback = onResult;

    // Create ball
    const ballRadius = 0.22;
    const ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);
    const ballVisualMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2563eb,
      metalness: 0.5,
      roughness: 0.3
    });
    
    const newBall = new THREE.Mesh(ballGeometry, ballVisualMaterial);
    const startX = (Math.random() - 0.5) * 0.5; // Small random offset
    newBall.position.set(startX, 6, 0);
    this.scene.add(newBall);

    // Physics ball
    const ballShape = new CANNON.Sphere(ballRadius);
    const ballPhysicsMaterial = new CANNON.Material({ restitution: 0.7, friction: 0.3 });
    const ballBody = new CANNON.Body({ 
      mass: 1, 
      shape: ballShape,
      material: ballPhysicsMaterial,
      linearDamping: 0.01,
      angularDamping: 0.01
    });
    ballBody.position.set(startX, 6, 0);
    
    // Add slight random initial velocity
    ballBody.velocity.set(
      (Math.random() - 0.5) * 1.2,
      -3,
      0
    );
    
    this.world.addBody(ballBody);

    // Store ball reference for animation
    newBall.userData.body = ballBody;
    
    // Check for landing after delay
    setTimeout(() => this.checkBallLanded(newBall, ballBody, onResult), 2000);
  }

  checkBallLanded(ball, ballBody, callback) {
    if (!ball || !ballBody) return;

    // Check if ball has settled (velocity near zero and below threshold)
    const velocity = ballBody.velocity.length();
    const y = ballBody.position.y;

    if (velocity < 0.8 && y < -4) {
      // Determine which slot the ball landed in
      const x = ballBody.position.x;
      let closestSlot = 0;
      let closestDistance = Infinity;

      this.slots.forEach((slot, index) => {
        const distance = Math.abs(slot.position.x - x);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestSlot = index;
        }
      });

      // Clean up ball
      setTimeout(() => {
        if (ball) {
          this.scene.remove(ball);
        }
        if (ballBody) {
          this.world.removeBody(ballBody);
        }

        // Call result callback
        if (callback) {
          callback(closestSlot);
        }
      }, 300);
    } else {
      // Keep checking
      setTimeout(() => this.checkBallLanded(ball, ballBody, callback), 100);
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Update physics
    this.world.step(1 / 60);

    // Update all balls' positions
    this.scene.traverse((object) => {
      if (object.isMesh && object.userData.body) {
        object.position.copy(object.userData.body.position);
        object.quaternion.copy(object.userData.body.quaternion);
      }
    });

    // Render
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // Public method to trigger ball drop
  play(callback) {
    this.dropBall(callback);
  }
}

// Export for use in main script
window.PlinkoGame = PlinkoGame;
