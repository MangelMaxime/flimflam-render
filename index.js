'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _flyd = require('flyd');

var _flyd2 = _interopRequireDefault(_flyd);

var _flydModuleScanmerge = require('flyd/module/scanmerge');

var _flydModuleScanmerge2 = _interopRequireDefault(_flydModuleScanmerge);

var _ramda = require('ramda');

var _ramda2 = _interopRequireDefault(_ramda);

// Given a UI component object with these keys:
//   events: an object of event names set to flyd streams
//   defaultState: an initial default state (plain js object) to be set immediately on pageload
//   updates: an array of pairs of flyd streams and updater functions (with each stream, make an update on the state for each new value on that stream)
//   children: an object of child module namespaces (keys) and child module state streams (values) to be mixed into this module
// Return:
//   A single state stream that combines the default state, updaters, and child components
function ui(component) {
  // Array of child state streams (NOTE: recursive)
  var childStreams = _ramda2['default'].compose(_ramda2['default'].toPairs, _ramda2['default'].map(ui))(component.children || []);

  // Array of static default states for every child component
  // Note this is an array of child module keys and a pair of child module events and child module default states
  var childDefaults = _ramda2['default'].map(_ramda2['default'].apply(function (key, $) {
    return [key, $()];
  }), childStreams);
  var childDefaultStates = _ramda2['default'].map(_ramda2['default'].apply(function (key, pair) {
    return [key, _ramda2['default'].last(pair)];
  }), childDefaults);
  var childEvents = _ramda2['default'].map(_ramda2['default'].apply(function (key, pair) {
    return [key, _ramda2['default'].head(pair)];
  }), childDefaults);

  // Merge in every default child state under a key within the parent state
  componeng.defaultState = _ramda2['default'].reduce(function (parentState, pair) {
    var _pair = _slicedToArray(pair, 2);

    var childKey = _pair[0];
    var childState = _pair[1];

    return _ramda2['default'].assoc(childKey, _ramda2['default'].merge(parentState[childKey], childState), parentState);
  }, component.defaultState, childDefaultStates);

  // Nest child event objects into the parent events obj
  component.events = _ramda2['default'].reduce(function (parentEvents, pair) {
    var _pair2 = _slicedToArray(pair, 2);

    var childKey = _pair2[0];
    var childEvents = _pair2[1];

    return _ramda2['default'].assoc(childKey, _ramda2['default'].merge(parentEvents[childKey], childEvents), parentEvents);
  }, component.events, childEvents);

  // Turn the array of child component streams ([key, stream]) into an array of pairs that can go into flyd/module/scanMerge
  // [key, stream] -> [[stream, (state, [events, childState]) -> state]]
  // Every new state on each child stream updates the nested child state in the parent component
  var childUpdaters = _ramda2['default'].map(_ramda2['default'].apply(function (key, stream) {
    return [stream, function (state, pair) {
      return _ramda2['default'].assoc(key, _ramda2['default'].merge(state[key], _ramda2['default'].last(pair)), state);
    }];
  }), childStreams);

  // Every parent update on a child state updates the child component

  // Concat the child component updaters with this component's updaters
  // Flip the component's updater functions to make it more compatible with Ramda functions
  // the updater functions for flyd_scanMerge are like scan, they take (accumulator, val) -> accumulator
  // instead we want (val, accumulator) -> accumulator
  // That way we can use partial applicaton functions easily like [[stream1, R.assoc('prop')], [stream2, R.evolve({count: R.inc})]]
  var updaters = _ramda2['default'].concat(childUpdaters, _ramda2['default'].map(_ramda2['default'].apply(function (stream, fn) {
    return [stream, function (state, val) {
      return fn(val, state);
    }];
  }), component.updates));

  // Wrap it in immediate because we want to emit the defaultState onto the stream as soon as the page loads
  var state$ = _flyd2['default'].immediate((0, _flydModuleScanmerge2['default'])(updaters, component.defaultState));

  // Finally, pair every state value on the state stream with the events object so your view function has access to the events
  return _flyd2['default'].map(function (s) {
    return [component.events, s];
  }, state$);
}

module.exports = ui;

