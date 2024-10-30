define(function () {

  function loadTranslationFile(Adapt) {
    const globals = Adapt.course.get('_globals')._components['_simulation'];
    return {
      "adapt-simulation-startSimulationText": globals.startSimulationText
    }
  }

  return { loadTranslationFile }
});
