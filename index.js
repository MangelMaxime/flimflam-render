'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _flyd = require('flyd');

var _flyd2 = _interopRequireDefault(_flyd);

var _ramda = require('ramda');

var _ramda2 = _interopRequireDefault(_ramda);

// A component has a:
//   state: object of static data and flyd streams
//   view: snabbdom view function
//   debug: if true, will print state data on every stream update in the state
//   container: the DOM element we want to replace with our rendered snabbdom tree
//   patch: snabbdom patch function to use for rendering
function render(component) {
  var state$ = toStateStream(component.state);
  // You can get a console.log record of all new `.state` objects on your
  // component stream for debugging by setting `options.debug: true`
  if (component.debug) _flyd2['default'].map(function (changes) {
    return console.log('%cState changes: %O', "color:green; font-weight: bold;", _ramda2['default'].map(_ramda2['default'].call, changes));
  }, state$);

  var vtree$ = _flyd2['default'].scan(component.patch, component.container, _flyd2['default'].map(function (changes) {
    return component.view(component.state);
  }, state$));
  return { state$: state$, vtree$: vtree$ };
}

var isObj = function isObj(obj) {
  return obj.constructor === Object;
};

// Return all the streams within an object, including those nested further down
function getObjStreams(obj) {
  var stack = [obj];
  var streams = [];
  while (stack.length) {
    var vals = _ramda2['default'].values(stack.pop());
    streams = _ramda2['default'].concat(streams, _ramda2['default'].filter(_flyd2['default'].isStream, vals));
    stack = _ramda2['default'].concat(stack, _ramda2['default'].filter(isObj, vals));
  }
  return streams;
}

// Given a state object (and options), return a component stream based on all the streams and updates from the component
//
// We use flyd.scanMerge to combine all the streams/updates into one single stream
//
// We flip the component's updater functions to make it more compatible with Ramda functions.
// That is, the updater functions for flyd.scanMerge are like scan: (accumulator, val) -> accumulator
// instead we want (val, accumulator) -> accumulator
// That way we can use partial applicaton functions easily like { stream1: R.assoc('prop'), stream2: R.evolve({count: R.inc}) }
function toStateStream(state) {
  var streams = getObjStreams(state);
  return _flyd2['default'].combine(function () {
    var chng = arguments[arguments.length - 1];
    var self = arguments[arguments.length - 2];
    self(chng);
  }, streams);
}

module.exports = render;

