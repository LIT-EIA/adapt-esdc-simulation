define([
  'core/js/adapt',
  './simulationView',
  'core/js/models/itemsComponentModel',
  './helpers/keyboardTrap',
  './helpers/simulationNotify',
  './lang/translation'
], function (Adapt, SimulationView, ItemsComponentModel, KeyBoardTrapHelper, SimulationNotify, Translation) {

  Adapt.once("i18n:ready", function () {
      Translation.loadTranslations(Adapt);
  });

  Adapt.on('startkeyboardtrap', function (keyboardTrapObject, opts) {
    KeyBoardTrapHelper.handleStartKeyboardTrap(keyboardTrapObject, opts);
  });

  Adapt.on('stopkeyboardtrap', function (keyboardTrapObject) {
    KeyBoardTrapHelper.handleStopKeyboardTrap(keyboardTrapObject);
  });

  return Adapt.register('simulation', {
    model: ItemsComponentModel,
    view: SimulationView
  });

});
