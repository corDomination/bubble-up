// global BABYLON

class PlayerController {
    constructor(sceneController) {
        this.sceneController = sceneController;
        this.baseAngularSensibility = 1;
        this.pressedKeys = {};
        this.sensitivityX = 0.1;
        this.sensitivityY = 0.1;
        this.colliderBall = null;
        this.playerHeight = 1;
        this.blasterController = null;
        this.terminalVelocity = 9.8 * 4.5;
        this.maxHeightElement = document.querySelector('.max-height-value');
        this.currentHeightElement = document.querySelector('.current-height-value');
        this.ammoElement = document.querySelector('.ammo-value');
        this.maxHeight = 0;
        this.basePosition = new BABYLON.Vector3(0, 4, 0);
    }

    get SceneController() { return this.sceneController; }

    get BlasterController() { return this.blasterController; }

    async prepare() {
        const {scene, camera, canvas} = this.sceneController;
        document.addEventListener("pointerlockchange", lockChangeAlert, false);
        document.addEventListener("mozpointerlockchange", lockChangeAlert, false);
        document.addEventListener(
            "webkitpointerlockchange",
            lockChangeAlert,
            false
        );

        function lockChangeAlert() {
            if (document.pointerLockElement === canvas) {
                document.addEventListener("mousemove", this.updateCameraRotation, false);
            } else {
                document.removeEventListener("mousemove", this.updateCameraRotation, false);
            }
        }

        let ballDiameter = 2;
        let ballMass = 5;
        var ball = BABYLON.MeshBuilder.CreateSphere(
            "player",
            { diameter: ballDiameter },
            scene
        );
        ball.position = this.basePosition;

        this.blasterController = new BlasterController(this);
        this.blasterController.prepare();
        ball.physicsAggregate = new BABYLON.PhysicsAggregate(
            ball,
            BABYLON.PhysicsShapeType.SPHERE,
            { mass: ballMass, friction: 0, restitution: 0 }
        );

        window.addEventListener("keydown", (event) => {
            this.pressedKeys[event.code] = true; // Mark this key as pressed

            if (
                event.code === "KeyW" ||
                event.code === "KeyA" ||
                event.code === "KeyS" ||
                event.code === "KeyD"
            ) {
            }
        });

        window.addEventListener("keyup", (event) => {
            this.pressedKeys[event.code] = false; // Mark this key as released

            if (
                event.code === "KeyW" ||
                event.code === "KeyA" ||
                event.code === "KeyS" ||
                event.code === "KeyD"
            ) {
            }
        });

        ball.isVisible = false;
        // ball.physicsAggregate.body.setLinearDamping(10);

        ball.physicsAggregate.body.setGravityFactor(3);
        this.colliderBall = ball;

        let maxHorizontalSpeed = 9.8 * 1.5; // Maximum horizontal speed
        let maxVerticalSpeed = 9.8 * 1.5; // Max vertical speed due to gravity

        let jumpState = "idle";

        scene.onBeforePhysicsObservable.add(() => {
            if (this.colliderBall.position.y < -100) {
                location.reload();
            }
            // Scale the angular sensitivity by delta time to normalize rotation speed
            scene.activeCamera.angularSensibility =
                100 * this.baseAngularSensibility * scene.deltaTime;

            const ballPos = ball.getAbsolutePosition();
            this.maxHeight = Math.max(ballPos.y, this.maxHeight);
            this.maxHeightElement.textContent = Math.round(this.maxHeight-4);
            this.currentHeightElement.textContent = Math.round(ballPos.y-4);
            this.ammoElement.textContent = this.blasterController.ammo;
            camera.position = ballPos;

            // Calculate the combined movement direction based on pressed keys
            let direction = new BABYLON.Vector3.Zero();
            let dir = scene.activeCamera.getForwardRay().direction;
            dir = new BABYLON.Vector3(dir.x, 0, dir.z).normalize();
            if (this.pressedKeys["KeyW"]) {
                direction.addInPlace(dir);
            }
            if (this.pressedKeys["KeyS"]) {
                direction.addInPlace(
                    dir.negate()
                );
            }
            if (this.pressedKeys["KeyD"]) {
                direction.addInPlace(
                    BABYLON.Vector3.Cross(
                        dir,
                        scene.activeCamera.upVector
                    )
                        .normalize()
                        .negate()
                );
            }
            if (this.pressedKeys["KeyA"]) {
                direction.addInPlace(
                    BABYLON.Vector3.Cross(
                        dir,
                        scene.activeCamera.upVector
                    ).normalize()
                );
            }

            // Project direction onto the plane defined by the surface normal only if touching the floor
            var hitInfo = this.touchingFloor(scene)
            if(hitInfo && hitInfo.pickedMesh != null && !hitInfo.pickedMesh.name.includes("sphere"))
            {
                this.blasterController.ammo = 10;
            }

            // Normalize direction and scale by max speed
            if (!direction.equals(BABYLON.Vector3.Zero())) {
                direction = direction.normalize().scale(maxHorizontalSpeed);
            }

            // Apply the direction as a force to the ball
            if (!this.movementKeysPressed()) {
                // Stop horizontal movement when no movement keys are pressed
                ball.physicsAggregate.body.setLinearVelocity(
                    new BABYLON.Vector3(
                        0,
                        ball.physicsAggregate.body.getLinearVelocity().y,
                        0
                    )
                );
            } else {
                ball.physicsAggregate.body.setLinearVelocity(
                    new BABYLON.Vector3(
                        direction.x,
                        ball.physicsAggregate.body.getLinearVelocity().y,
                        direction.z
                    )
                );
            }

            // Handle jump with spacebar
            if (this.pressedKeys["Space"] && jumpState === "idle") {
                jumpState = "leavingGround";
                let currentVelocity = ball.physicsAggregate.body.getLinearVelocity();
                // if (Math.abs(currentVelocity.y) < 0.1) { // Check if the ball is on the ground
                ball.physicsAggregate.body.setLinearVelocity(
                    new BABYLON.Vector3(
                        currentVelocity.x,
                        maxVerticalSpeed,
                        currentVelocity.z
                    )
                );
                // }
            }

            if (jumpState === "leavingGround" && !this.touchingFloor(scene)) {
                jumpState = "inAir";
            }
            if (jumpState === "inAir" && this.touchingFloor(scene)) {
                jumpState = "idle";
            }

            // Limit vertical speed due to gravity
            let velocity = ball.physicsAggregate.body.getLinearVelocity();
            if (velocity.y < -this.terminalVelocity) {
                ball.physicsAggregate.body.setLinearVelocity(
                    new BABYLON.Vector3(velocity.x, -this.terminalVelocity, velocity.z)
                );
            }
            // if (velocity.y > this.terminalVelocity) {
            //     ball.physicsAggregate.body.setLinearVelocity(
            //         new BABYLON.Vector3(velocity.x, this.terminalVelocity, velocity.z)
            //     );
            // }
        });
    }

    launchPlayer() {
        if (this.colliderBall == null) { return; }
        let currentVelocity = this.colliderBall.physicsAggregate.body.getLinearVelocity();
        this.colliderBall.physicsAggregate.body.setLinearVelocity(
            new BABYLON.Vector3(
                currentVelocity.x,
                9.8 * 5,
                currentVelocity.z
            )
        );
    }

    movementKeysPressed() {
        return (
            this.pressedKeys["KeyA"] ||
            this.pressedKeys["KeyD"] ||
            this.pressedKeys["KeyW"] ||
            this.pressedKeys["KeyS"]
        );
    }

    touchingFloor(scene) {
        // Create a downward ray from the camera's position
        var rayOrigin = this.colliderBall.position; //.getAbsolutePosition(); //scene.activeCamera.position;
        var rayDirection = new BABYLON.Vector3(0, -1, 0); // Downward direction

        // Define the ray with a length of 0.7 units
        var rayLength = this.playerHeight / 2 + 1;
        var downwardRay = new BABYLON.Ray(rayOrigin, rayDirection, rayLength);

        // Check intersection with all meshes in the scene
        var hitInfo = scene.pickWithRay(downwardRay);

        // Return true if the ray hit a mesh within the distance, otherwise false
        // return hitInfo.hit;

        // return hitInfo;
        if (hitInfo.hit) {
            return hitInfo;
        } else {
            return false;
        }
    }

    // Function to update the camera's rotation based on mouse movement
    updateCameraRotation(e) {
        const {camera} = this.sceneController;
        let movementX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
        let movementY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;

        // Apply mouse movement to camera rotation
        camera.rotation.y += movementX * this.sensitivityX;
        camera.rotation.x += movementY * this.sensitivityY;

        // Optional: Clamp camera.rotation.x to avoid flipping the camera
        camera.rotation.x = Math.max(
            -Math.PI / 2,
            Math.min(Math.PI / 2, camera.rotation.x)
        );
    }

    reset() {
        this.colliderBall.position = basePosition;
        this.physicsAggregate.body.setLinearVelocity(new BABYLON.Vector3(
            0,
            0,
            0
        ));
    }
}