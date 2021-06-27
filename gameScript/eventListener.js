// ======misc=====
const mouse = new THREE.Vector2();
const mousePointer = new THREE.Raycaster();
const gravityRay= new THREE.Raycaster();
const GRAVITY = 1.0;
const MOVEMENT = 2.0;
// actual coordinates of floorplan[0][0][0]
let defaultMapGeometry = new THREE.Vector3(0, 0, 0);

// =====Event Triggers======
const INTRO = new THREE.Vector3(10, 11, 2);
// const ... = new THREE.Vector3();
// const ... = new THREE.Vector3();
const PORTFOLIO = new THREE.Vector3(10, 11, 8);
const CONTACT = new THREE.Vector3(10, 6, 11);

// =====Directions=====
const XM = 0; // -x
const XP = 1; // +x
const YM = 2; // -y
const YP = 3; // +y 
const UA = 4; // unreachable/arrival

// =====variables=====
let character;
let MOUSE_POINTED;
let CHARACTER_LOCATED;

var stop = false;
var frameCount = 0;
var fpsInterval, startTime, now, then, elapsed;

var isMoving = false;
var path = [new THREE.Vector3()];

// ========== RESIZE ==========
var resizeListener = () => {
	window.addEventListener('resize', () => {
		camera.aspect = window.innerWidth/window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	}, false);
}

// ========== ON LOAD ==========
var loadListener = async () => {
	window.addEventListener('load', async () => {
		settings = data.settings;
		document.body.style.background = `rgb(${settings.background})`;
		floorplan = data.floorplan;
		await initGame()
		.then(await loadCharacter(scene)
			.then(() => {
				// limit frame rate based on the settings
				fpsInterval = 1000 / settings.frameRate;
				then = Date.now();
				startTime = then;
				animate();
			})
		);
	});

	defaultMapGeometry = new THREE.Vector3(
		0 - (Math.ceil(data.floorplan[0][0].length / 2) * blockSize),
		0 - (Math.ceil(data.floorplan[0].length / 2) * blockSize),
		0 + (Math.ceil(data.floorplan.length / 2) * blockSize)
	);

	const animate = () => {
		requestAnimationFrame(animate);
		now = Date.now();
		elapsed = now - then;
		if (elapsed > fpsInterval) {
			then = now - (elapsed % fpsInterval);

			// gravity action
			applyGravity();
			// cursor action
			watchCursor();
			// character behaviour 
			applyMovement();
			
			// render
			if (controls) controls.update();
			renderer.render(scene, camera);
		}	
	}
}

var applyGravity = () => {
	if (!isMoving) {
		gravityRay.set(character.position, new THREE.Vector3(0, 0, -1));
		// gravitty visualization for debugging
		// scene.add(new THREE.ArrowHelper(gravityRay.ray.direction, gravityRay.ray.origin, 300, 0xff0000, 0, 0));
		const standingPlatforms = gravityRay.intersectObjects(scene.children);
		if (standingPlatforms.length > 0) {
			let firstEncounter = standingPlatforms[0];
			if (firstEncounter.distance > 0) {
				character.position.set(character.position.x, character.position.y, character.position.z - GRAVITY);
			} else if (firstEncounter.distance < 0) {
				character.position.set(character.position.x, character.position.y, character.position.z + GRAVITY);
			}
		}
	}
}

var watchCursor = () => {
	if (!isMoving) {
		mousePointer.setFromCamera(mouse, camera);
		const intersects = mousePointer.intersectObjects(scene.children);
		if (intersects.length > 0) {
			if (MOUSE_POINTED !== intersects[0].object && intersects[0].object.type === TYPE_PLATFORM) {
				MOUSE_POINTED = intersects[0].object;
			}
		} else {
			MOUSE_POINTED = undefined;
		}
	}
}

var applyMovement = () => {
	if (isMoving) {
		let curr = getMapLocation(character.position);
		let dest = getMapLocation(MOUSE_POINTED.position);
		if (path.length === 0 || curr === dest) {
			isMoving = false;
			path = [];
		} else {
			character.position.set(MOUSE_POINTED.position.x, MOUSE_POINTED.position.y, MOUSE_POINTED.position.z + Math.ceil(blockSize / 2));
		}
		isMoving = false;


		if (findDirection() === XM) {
			character.rotation.set(Math.PI/2, -Math.PI/2, 0);
			character.position.set(character.position.x - MOVEMENT, character.position.y, character.position.z);
		} else if (findDirection() === XP) {
			character.rotation.set(0, Math.PI/2, Math.PI/2);
			character.position.set(character.position.x + MOVEMENT, character.position.y, character.position.z);
		} else if (findDirection() === YM) {
			character.rotation.set(Math.PI/2, 0, 0);
			character.position.set(character.position.x, character.position.y - MOVEMENT, character.position.z);
		} else if (findDirection() === YP) {
			character.rotation.set(-Math.PI/2, 0, Math.PI);
			character.position.set(character.position.x, character.position.y + MOVEMENT, character.position.z);
		}
	}
}

// scan the path, and udpate the path variable
var findDirection = () => {
	let currLoc = getMapLocation(character.position);
	let position = getActualPosition(currLoc);
	// let Xplus = curr.x + 1 > data.floorplan[curr.z].length - 1 ? 0 : data.floorplan[curr.z][curr.x + 1][curr.y];
	// let Xminus = curr.x - 1 < 0 ? 0 : data.floorplan[curr.z][curr.x - 1][curr.y];
	// let Yplus = curr.y + 1 > data.floorplan[curr.z][curr.x].length - 1 ? 0 : data.floorplan[curr.z][curr.x][curr.y + 1];
	// let Yminus = curr.y - 1 < 0 ? 0 : data.floorplan[curr.z][curr.x][curr.y - 1];

	// if (Xminus === 1) {
	// 	if (character.position.x > MOUSE_POINTED.position.x) {
	// 		return XM;
	// 	}
	// }
	// if (Xplus === 1) {
	// 	if (character.position.x < MOUSE_POINTED.position.x) {
	// 		return XP;
	// 	}
	// }
	// if (Yminus === 1) {
	// 	if (character.position.y > MOUSE_POINTED.position.y) {
	// 		return YM;
	// 	}
	// }
	// if (Yplus === 1) {
	// 	if (character.position.y < MOUSE_POINTED.position.y) {
	// 		return YP;
	// 	}
	// }
	// return UA;
}


var getMapLocation = (vectorLocation) => {
	return {
		z: Math.ceil(Math.abs(vectorLocation.z/20 - 11)),
		x: Math.ceil(vectorLocation.x/20 + 6),
		y: Math.ceil(vectorLocation.y/20 + 6)
	}
}

var getActualPosition = (mapVector) => {
	return new THREE.Vector3(
		defaultMapGeometry.x + (mapVector.x * blockSize),
		defaultMapGeometry.y + (mapVector.y * blockSize),
		defaultMapGeometry.z - (mapVector.z * blockSize)
	);
}

// ========== MOUSE ACTION ==========
var mouseListener = () => {
	renderer.domElement.addEventListener('mousemove', (event) => {
		event.preventDefault();
		mouse.x = (event.clientX/window.innerWidth) * 2 - 1;
		mouse.y = -(event.clientY/window.innerHeight) * 2 + 1;
	}, false);

	renderer.domElement.addEventListener('click', onClick, false);
	renderer.domElement.addEventListener('touchstart', onClick, false);
}

var onClick = (event) => {
	// current location of the character (block-based) for debugging
	// let curr = getMapLocation(character.position);
	// console.log(curr);
	
	// reset the destination upon click
	isMoving = false;
	watchCursor();
	event.preventDefault();
	if (MOUSE_POINTED) {
		isMoving = true;
	}
}
