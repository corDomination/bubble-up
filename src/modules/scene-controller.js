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
        this.tubeMaterial = null;
    }

    get PlayerController() { return this.playerController; }

    async prepare() {
        this.engine = await new BABYLON.Engine(this.canvas, true, {
            preserveDrawingBuffer: true,
            stencil: true,
            disableWebGL2Support: false
        });
        this.scene = new BABYLON.Scene(this.engine);

        const hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("./textures/skybox.env", this.scene);
        const hdrTexture2 = BABYLON.CubeTexture.CreateFromPrefilteredData("./textures/skybox.env", this.scene);
        this.scene.environmentTexture = hdrTexture;
        this.scene.clearColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        // this.scene.debugLayer.show();
        this.camera = new BABYLON.UniversalCamera(
            "Camera",
            new BABYLON.Vector3(30, 20, 20),
            this.scene
        );
        this.camera.setTarget(new BABYLON.Vector3(0, 20, 0));
        this.camera.attachControl(this.canvas, true);
        this.camera.inertia = 0;
        this.camera.fov = 1;
        this.camera.minZ = 0;
        this.camera.maxZ = 100000;
        this.createPointerLock();

        this.light = new BABYLON.HemisphericLight(
            "light",
            new BABYLON.Vector3(0, 1, 0),
            this.scene
        );

        this.instanceContainer = new BABYLON.TransformNode("instance-container");

        this.light.intensity = 0.7;

        const havokInstance = await HavokPhysics();
        const hk = new BABYLON.HavokPlugin(true, havokInstance);
        this.scene.enablePhysics(new BABYLON.Vector3(0, -9.8, 0), hk);
        window.scene = this.scene;
        globalThis.HK = await HavokPhysics();
        if (!this.engine) throw "engine should not be null.";

        window.addEventListener("resize", () => {
            this.engine.resize();
        });

        this.resetButtonElement.addEventListener('click', () => {
            this.reset();
        })

        await this.createEnvironment();
        const gl = new BABYLON.GlowLayer("glow", scene);
        gl.intensity = 2;
        this.playerController = new PlayerController(this);
        this.playerController.prepare();

        this.engine.runRenderLoop(() => {
            this.tubeMaterial.albedoTexture.vOffset += 0.0001;
            if (this.scene && this.scene.activeCamera) {
                this.scene.render();
            }
        });
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
        var tube = await BABYLON.SceneLoader.ImportMeshAsync(null,
            "./models/tube.glb"
        );
        const tubeRoot = tube.meshes[0];
        tube.meshes[1].visibility = 0.02;
        tubeRoot.scaling = new BABYLON.Vector3(5000, 25000, 5000);
        this.tubeMaterial = tube.meshes[1].material;
        this.tubeMaterial.albedoTexture.uScale = 1;
        this.tubeMaterial.albedoTexture.vScale = 20;
        for (let i = 0; i < 20; i++)
        {
            var ground = await BABYLON.SceneLoader.ImportMeshAsync(null,
                "./models/tower.glb"
            );
            ground.meshes[1].visibility = 0.05;
            if (i == 0) { continue; }
            const x = (Math.random() - 0.5) * 160 * Math.sqrt(i * 2);
            const y = i * 100 + Math.pow(i, 1.5) * 10;
            const z = (Math.random() - 0.5) * 160 * Math.sqrt(i * 2);
            ground.meshes[0].position = new BABYLON.Vector3(x, y, z);
        }

        for (let i = 0; i < 20; i++)
        {
            var specialBubble1 = new SpecialBubbleController(this);
            const x = (Math.random() - 0.5) * 160 * Math.sqrt(i * 2);
            const y = 50 + 200*i + Math.pow(i, 1.5) * 30;
            const z = (Math.random() - 0.5) * 160 * Math.sqrt(i * 2);
            await specialBubble1.prepare(new BABYLON.Vector3(x, y, z));
        }

        let collisions = this.scene.meshes.filter((item) =>
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
