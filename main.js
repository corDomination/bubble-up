(async () => {
  const canvas = document.getElementById("renderCanvas");
  const sceneController = new SceneController(canvas);
  await sceneController.prepare();
})();