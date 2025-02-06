import SceneController from './modules/scene-controller.js';

class Application {
  constructor() {
    this.sceneController = null;
  }
  async prepare() {
    const canvas = document.getElementById("renderCanvas");
    this.sceneController = new SceneController(canvas);
    await this.sceneController.prepare();
  }
}

addEventListener("DOMContentLoaded", (event) => {
  const application = new Application();
  application.prepare();
});

