define([
	'core/js/adapt',
	'./simulationView',
	'core/js/models/itemsComponentModel',
  './helpers/keyboardTrap',
  './helpers/simulationNotify'
], function (Adapt, SimulationView, ItemsComponentModel, KeyBoardTrapHelper) {

	function loadScript(scriptObject, callback) {
		var head = document.getElementsByTagName('head')[0];
		var script = document.createElement('script');

		script.type = scriptObject.type || 'text/javascript';

		if (scriptObject.src) {
			script.src = scriptObject.src;
		}

		if (scriptObject.text) {
			script.text = scriptObject.text;
		}

		if (callback) {
			// Then bind the event to the callback function.
			// There are several events for cross browser compatibility.
			script.onreadystatechange = callback;
			script.onload = callback;
		}

		// Append the <script> tag.
		head.appendChild(script);
	}

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
