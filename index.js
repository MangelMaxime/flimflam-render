'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _flyd = require('flyd');

var _flyd2 = _interopRequireDefault(_flyd);

var _ramda = require('ramda');

var _ramda2 = _interopRequireDefault(_ramda);

_flyd2['default'].mergeAll = require('flyd/module/mergeall');

// A component has a:
//   state: object of static data and flyd streams
//   view: snabbdom view function
//   container: the DOM element we want to replace with our rendered snabbdom tree
//   patch: snabbdom patch function to use for rendering
function render(component) {
  var streams = getObjStreams(component.state);
  var state$ = toStateStream(streams);

  var vtree$ = _flyd2['default'].scan(component.patch, component.container, _flyd2['default'].map(function (changes) {
    return component.view(component.state);
  }, state$));
  state$([]); // initial patch
  return { state$: state$, vtree$: vtree$ };
}

var isObj = function isObj(x) {
  return x.constructor === Object;
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

// Convert an object containing nested streams into a single stream of changes
function toStateStream(streams) {
  return _flyd2['default'].mergeAll(streams);
}

module.exports = render;

