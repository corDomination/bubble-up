export default class SpecialBubbleController {
  constructor(sceneController) {
    this.sceneController = sceneController;
    this.mesh = null;
    this.physicsSphere = null;
    this.ring1 = null;
    this.ring2 = null;
    this.ring3 = null;
    this.ring4 = null;
  }

  async prepare(position) {
    const { scene } = this.sceneController;
    const specialBubbleData = await BABYLON.SceneLoader.ImportMeshAsync(null,
            './models/special-bubble.glb',
        );
    const root = specialBubbleData.meshes[0];
    this.ring1 = specialBubbleData.meshes[1];
    this.ring2 = specialBubbleData.meshes[2];
    this.ring3 = specialBubbleData.meshes[3];
    this.ring4 = specialBubbleData.meshes[4];
    this.mesh = root;
    this.mesh.parent = this.sceneController.instanceContainer;
    this.mesh.rotationQuaternion = null;
    this.mesh.rotation = new BABYLON.Vector3();
    this.mesh.position = position;
    this.ring1.material.emissiveColor = new BABYLON.Color3(0.0, 0.15, 0.0);

    this.physicsSphere = new BABYLON.PhysicsAggregate(this.ring1, BABYLON.PhysicsShapeType.BOX, { mass: 0, restitution: 2.0 }, scene);
    this.physicsSphere.body.disablePreStep = false;
    this.physicsSphere.body.setCollisionCallbackEnabled(true);

    const observable = this.physicsSphere.body.getCollisionObservable();
    const observer = observable.add((collisionEvent) => {
      if (collisionEvent.type == 'COLLISION_STARTED') {
        const name1 = collisionEvent.collidedAgainst.transformNode.name;
        const name2 = collisionEvent.collider.transformNode.name;
        if (name1.includes('player') || name2.includes('player')) {
          this.sceneController.PlayerController.BlasterController.ammo = 10;
          this.sceneController.PlayerController.launchPlayer();
        }
      }
    });

    scene.onBeforeRenderObservable.add(() => {
      this.ring1.rotate(BABYLON.Vector3.Up(), 0.01);
      this.ring2.rotate(BABYLON.Vector3.Forward(), 0.02);
      this.ring3.rotate(BABYLON.Vector3.Right(), 0.05);
      this.ring4.rotate(BABYLON.Vector3.Forward(), 0.03);
    });
  }

  dispose() {
    this.physicsSphere.dispose();
    this.mesh.dispose();
  }
}
