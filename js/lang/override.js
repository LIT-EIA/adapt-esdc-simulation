define(function () {

  function loadTranslationFile(Adapt) {
    const globals = Adapt.course.get('_globals')._components['_simulation'];
    return {
      "adapt-simulation-window": globals.simulationWindow,
      "adapt-simulation-controls": globals.simulationControls,
      "adapt-simulation-start-simulation": globals.startSimulation,
      "adapt-simulation-go-back": globals.goBack,
      "adapt-simulation-show-instructions": globals.showInstructions,
      "adapt-simulation-exit": globals.exitSimulation,
      "adapt-simulation-full-screen": globals.fullScreen,
      "adapt-simulation-mobile-message": globals.mobileMessage,
      "adapt-simulation-remaining-characters": globals.remainingCharacters
    }
  }

  return { loadTranslationFile }
});
