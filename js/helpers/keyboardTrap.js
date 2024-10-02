// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define([
  './jquery-ui.min'
], function () {
  var mutationObserverMap = {};

  function startKeyboardTrap(keyboardTrapObject) {
    if (keyboardTrapObject && keyboardTrapObject.$el) {
      var focusableItems = $(`${keyboardTrapObject.$el.attr('id') ? '#' + keyboardTrapObject.$el.attr('id') : ''}.${keyboardTrapObject.$el.attr('class').replace(/[\n\s]/g, '.')} :focusable:not(.trap-wrapper):not(.display-none):not(.action-container)`);
      if (focusableItems && focusableItems.length > 0) {
        if(keyboardTrapObject.focus){
          var action = keyboardTrapObject.focus;
          var element = keyboardTrapObject.$el.find(`.action-container [data-id="${action.id}"]`);
          element.focus();
        }
        focusableItems.first().on('keydown', function (e) {
          var keyCode = e.keyCode || e.which;
          if (e.type == 'keydown' && keyCode === 9 && e.shiftKey) {
            e.preventDefault();
            focusableItems.last().focus();
          }
        });
        focusableItems.last().on('keydown', function (e) {
          var keyCode = e.keyCode || e.which;
          if (e.type == 'keydown' && keyCode === 9 && !e.shiftKey) {
            e.preventDefault();
            focusableItems.first().focus();
          }
        });
      }
    }
  }

  function stopKeyboardtrap(keyboardTrapObject) {
    if (!(keyboardTrapObject && keyboardTrapObject.$el && keyboardTrapObject.$el.attr('class'))) return;
    var focusableItems = $(`.${keyboardTrapObject.$el.attr('class').replace(/[\n\s]/g, '.') } :focusable:not(.trap-wrapper):not(.display-none)`);
    if (focusableItems && focusableItems.length > 1) {
      focusableItems.first().off('keydown');
      focusableItems.last().off('keydown');
    }
  }

  function handleStartKeyboardTrap(keyboardTrapObject, opts) {
    if (opts && opts.userMutationObserver && keyboardTrapObject && keyboardTrapObject.$el) {
      var elClassName = keyboardTrapObject.$el.attr('class');
      if (!mutationObserverMap[elClassName]) {
        var node = document.getElementsByClassName(elClassName)[0];
        var config = { attributes: true, childList: true, subtree: true };
        var callback = (mutationList, observer) => {
          var focusableItems = $(`${keyboardTrapObject.$el.attr('id') ? '#' + keyboardTrapObject.$el.attr('id') : ''}.${keyboardTrapObject.$el.attr('class').replace(/[\n\s]/g, '.')} :focusable:not(.trap-wrapper):not(.display-none)`);
          if (mutationObserverMap[elClassName] && !mutationObserverMap[elClassName]['startedKeyboardTrap']) {
            if (focusableItems.length > 1) {
              startKeyboardTrap(keyboardTrapObject);
              mutationObserverMap[elClassName]['startedKeyboardTrap'] = true;
            }
          }
        };
        var observer = new MutationObserver(callback);
        observer.observe(node, config);
        mutationObserverMap[elClassName] = observer;
      }
    }
    else {
      startKeyboardTrap(keyboardTrapObject);
    }
  }

  function handleStopKeyboardTrap(keyboardTrapObject) {
    if (keyboardTrapObject && keyboardTrapObject.$el) {
      var elClassName = keyboardTrapObject.$el.attr('class');
      if (mutationObserverMap[elClassName]) {
        var observer = mutationObserverMap[elClassName];
        if (observer) observer.disconnect();
        delete mutationObserverMap[elClassName];
      }
      stopKeyboardtrap(keyboardTrapObject)
    }
  }

  return {
    handleStartKeyboardTrap: handleStartKeyboardTrap,
    handleStopKeyboardTrap: handleStopKeyboardTrap
  }
})
