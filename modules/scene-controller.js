class SceneController {
    constructor(canvas) {
        this.scene = null;
        this.engine = null;
        this.canvas = canvas;
        this.camera = null;
        this.playerController = null;
        this.light = null;
        this.instanceContainer = null;
        this.resetButtonElement = document.querySelector('.reset-button');
    }

    async prepare() {
        this.engine = await new BABYLON.Engine(this.canvas, true, {
            preserveDrawingBuffer: true,
            stencil: true,
            disableWebGL2Support: false
        });
        this.scene = new BABYLON.Scene(this.engine);

        const hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("textures/skybox.env", this.scene);
        const hdrTexture2 = BABYLON.CubeTexture.CreateFromPrefilteredData("textures/skybox.env", this.scene);
        this.scene.environmentTexture = hdrTexture;
        this.scene.clearColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        // this.scene.debugLayer.show();
        this.camera = new BABYLON.UniversalCamera(
            "Camera",
            new BABYLON.Vector3(30, 20, 20),
            this.scene
        );
        this.camera.setTarget(new BABYLON.Vector3(0, 0, 0));
        this.camera.attachControl(this.canvas, true);
        this.camera.inertia = 0;
        this.camera.fov = 1;
        this.camera.minZ = 0;
        this.createPointerLock();

        this.light = new BABYLON.HemisphericLight(
            "light",
            new BABYLON.Vector3(0, 1, 0),
            this.scene
        );
        this.createEnvironment();
        this.instanceContainer = new BABYLON.TransformNode("instance-container");

        this.light.intensity = 0.7;

        const havokInstance = await HavokPhysics();
        const hk = new BABYLON.HavokPlugin(true, havokInstance);
        this.scene.enablePhysics(new BABYLON.Vector3(0, -9.8, 0), hk);
        window.scene = this.scene;
        globalThis.HK = await HavokPhysics();
        if (!this.engine) throw "engine should not be null.";
        this.engine.runRenderLoop(() => {
            if (this.scene && this.scene.activeCamera) {
                this.scene.render();
            }
        });

        window.addEventListener("resize", () => {
            this.engine.resize();
        });

        this.resetButtonElement.addEventListener('click', () => {
            this.reset();
        })

        this.playerController = new PlayerController(this);
        this.playerController.prepare();
    }

    createPointerLock() {
        let canvas = this.scene.getEngine().getRenderingCanvas();
        canvas.addEventListener( 
            "click",
            function () {
                canvas.requestPointerLock =
                canvas.requestPointerLock ||
                    canvas.msRequestPointerLock ||
                    canvas.mozRequestPointerLock ||
                    canvas.webkitRequestPointerLock;
                if (canvas.requestPointerLock) {
                    canvas.requestPointerLock();
                }
            },
            false
        );
    }

    async createEnvironment()
    {
        var ground1 = await BABYLON.SceneLoader.ImportMeshAsync(null,
            "/models/tower.glb"
        );
        ground1.meshes[1].visibility = 0.5;

        var ground2 = await BABYLON.SceneLoader.ImportMeshAsync(null,
            "/models/tower.glb"
        );

        ground2.meshes[1].visibility = 0.5;
        ground2.meshes[0].position = new BABYLON.Vector3(0, 100, 20);

        var ground3 = await BABYLON.SceneLoader.ImportMeshAsync(null,
            "/models/tower.glb"
        );

        ground3.meshes[1].visibility = 0.5;
        ground3.meshes[0].position = new BABYLON.Vector3(-20, 300, -20);

        let collisions = scene.meshes.filter((item) =>
            item.name.includes("#col")
        );
        collisions.forEach((mesh) => {
            mesh.physicsAggregate = new BABYLON.PhysicsAggregate(
                mesh,
                BABYLON.PhysicsShapeType.MESH,
                { mass: 0, friction: 1, restitution: 0 }
            );
        });
    }

    reset() {
        this.playerController.reset();
        const children = this.instanceContainer.getChildren();
        children.dispose();
    }
}
