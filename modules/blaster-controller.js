export default class BlasterController {
  constructor(playerController) {
    this.playerController = playerController;
    this.blasterRoot = null;
    this.rotationOffset = new BABYLON.Vector3(0, 0, 0);
    this.positionOffset = new BABYLON.Vector3(0.5, -0.2, 2.5);
    this.bubbleMaterial = null;
    this.soapTexture = null;
    this.bubbleIndex = 0;
    this.ammo = 10;
    this.cameraTransform = null;
  }

  async prepare() {
    this.cameraTransform = new BABYLON.TransformNode('CameraProxy');
    const { scene, camera, canvas } = this.playerController.sceneController;
    const bubbleBlaster = await BABYLON.SceneLoader.ImportMeshAsync(null,
            './models/bubble-gun-legacy.glb',
        );
    this.blasterRoot = bubbleBlaster.meshes[0];
    bubbleBlaster.meshes[1].rotation = new BABYLON.Vector3(0, Math.PI / 2, 0);
    bubbleBlaster.meshes[2].rotation = new BABYLON.Vector3(0, Math.PI / 2, 0);
    bubbleBlaster.meshes[3].rotation = new BABYLON.Vector3(0, Math.PI / 2, 0);
    this.blasterRoot.parent = this.cameraTransform;
    this.blasterRoot.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);
    this.blasterRoot.rotation = this.rotationOffset;
    this.blasterRoot.position = this.positionOffset;

    this.bubbleMaterial = new BABYLON.PBRMaterial('PBR Material');
    this.soapTexture = new BABYLON.Texture('./textures/soap.png');
    this.bubbleMaterial.albedoTexture = this.soapTexture;
    this.bubbleMaterial.metallic = 0.07;
    this.bubbleMaterial.roughness = 1.0;
    this.bubbleMaterial.albedoColor.albedoColor = new BABYLON.Color3(0.3, 0.3, 0.7);
    this.bubbleMaterial.alpha = 0.75;
    this.bubbleMaterial.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.12);


    canvas.addEventListener('click', () => {
      if (this.ammo <= 0) { return; }
      this.ammo -= 1;
      const { colliderBall } = this.playerController;
      const p0 = this.blasterRoot.forward.clone();
      const p1 = this.blasterRoot.absolutePosition.clone();
      const bubble = new BubbleController(this.playerController.sceneController);
      bubble.prepare(p1.add(p0), this.bubbleMaterial, p0, this.bubbleIndex);
      this.bubbleIndex += 1;

      const currentVelocity = colliderBall.physicsAggregate.body.getLinearVelocity();
      colliderBall.physicsAggregate.body.setLinearVelocity(
                new BABYLON.Vector3(
                    currentVelocity.x,
                    9.8 * 1.5,
                    currentVelocity.z,
                ),
            );
      console.log(this.ammo);
    });

    scene.onBeforeRenderObservable.add(() => {
      this.soapTexture.uOffset += 0.0001;
      this.soapTexture.vOffset += 0.0002;
    });

    scene.onBeforeDrawPhaseObservable.add(() => {
      const { scene, camera, canvas } = this.playerController.sceneController;
      this.cameraTransform.position.copyFrom(camera.position);
      this.cameraTransform.rotation.copyFrom(camera.rotation);
    });
  }

  reset() {

  }
}
