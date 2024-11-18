define(function () {

  function loadTranslationFile(Adapt) {
    const globals = Adapt.course.get('_globals')._components['_simulation'];
    return {
      "adapt-simulation-window": globals.simulationWindow,
      "adapt-simulation-controls": globals.simulationControls,
      "adapt-simulation-start-simulation": globals.startSimulation,
      "adapt-simulation-restart-simulation": globals.restartSimulation,
      "adapt-simulation-go-back": globals.goBack,
      "adapt-simulation-show-instructions": globals.showInstructions,
      "adapt-simulation-exit": globals.exitSimulation,
      "adapt-simulation-full-screen": globals.fullScreen,
      "adapt-simulation-mobile-message": globals.mobileMessage,
      "adapt-simulation-remaining-characters": globals.remainingCharacters,
      "adapt-simulation-issues-detected": globals.issuesDetected,
      "adapt-simulation-you-have-entered": globals.youEntered,
      "adapt-simulation-you-have-left-input-empty": globals.inputEmpty,
      "adapt-simulation-no-option-selected": globals.noOptionSelected,
      "adapt-simulation-fallback-error" : globals.incorrectFallback
    }
  }

  return { loadTranslationFile }
});
