class BubbleController {
  constructor(sceneController) {
    this.sceneController = sceneController;
    this.mesh = null;
    this.currentScale = 0;
    this.goalSize = (Math.random() * 10) + 1;
    this.speed = new BABYLON.Vector3(0, 0, 0);
    this.floatSpeed = (Math.random() * 0.02) + 0.01;
    this.physicsSphere = null;
    this.lifetime = 800;
    this.baseLifetime = this.lifetime;
  }

  prepare(position, material, direction, index) {
    direction = new BABYLON.Vector3(direction.x, direction.y, direction.z);
    const { scene } = this.sceneController;
    this.mesh = BABYLON.MeshBuilder.CreateSphere(
            `sphere-${index}`,
            { diameter: this.goalSize },
            scene,
        );
    this.mesh.parent = this.sceneController.instanceContainer;
    this.mesh.rotationQuaternion = null;
    this.mesh.rotation = new BABYLON.Vector3();
    this.mesh.position = position;
    this.mesh.material = material;
    this.speed = direction;

        // Create a sphere shape and the associated body. Size will be determined automatically.
    this.physicsSphere = new BABYLON.PhysicsAggregate(this.mesh, BABYLON.PhysicsShapeType.BOX, { mass: 0, restitution: 1.8 }, scene);
        // this.physicsSphere.body.setGravityFactor(0);
    this.physicsSphere.body.disablePreStep = false;
    this.physicsSphere.body.setCollisionCallbackEnabled(true);

        // const observable = this.physicsSphere.body.getCollisionObservable()
        // const observer = observable.add((collisionEvent) => {
        //     if (collisionEvent.type == "COLLISION_STARTED") {
        //         var name1 = collisionEvent.collidedAgainst.transformNode.name
        //         var name2 = collisionEvent.collider.transformNode.name
        //         if (name1 != name2 && name1.includes("sphere") && name2.includes("sphere")) {
        //             collisionEvent.collidedAgainst.dispose();
        //             collisionEvent.collidedAgainst.transformNode.dispose();
        //         }
        //     }
        // });


    scene.onBeforeRenderObservable.add(() => {
      this.lifetime--;
      if (this.lifetime <= 0) {
        this.dispose();
      }
            // this.physicsSphere.body.applyForce(
            //     this.speed,
            //     this.mesh.position,
            // );
      this.speed = this.speed.multiplyByFloats(0.95, 0.95, 0.95);
      this.mesh.position = this.mesh.position.add(this.speed);
      this.mesh.position = this.mesh.position.add(new BABYLON.Vector3(0, this.floatSpeed, 0));

      if (this.currentScale < 1) {
        this.currentScale += 0.01;
      }
      this.lifetimeRatio = this.clamp(this.lifetime / 10, 0, 1);
      const adjustedScale = this.lifetimeRatio * this.currentScale;
      this.mesh.scaling = new BABYLON.Vector3(adjustedScale, adjustedScale, adjustedScale);
    });
  }

  dispose() {
    this.physicsSphere.dispose();
    this.mesh.dispose();
  }

  clamp(number, min, max) {
    return Math.min(Math.max(number, min), max);
  }
}
