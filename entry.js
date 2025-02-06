import SceneController from './modules/scene-controller.js';

class Application {
  constructor() {
    this.sceneController = null;
  }
  async prepare(canvas) {
    this.sceneController = new SceneController(canvas);
    await this.sceneController.prepare();
  }
}

const application = new Application();

// application.prepare(document.getElementById('renderCanvas'));
