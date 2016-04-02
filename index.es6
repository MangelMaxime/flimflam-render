import flyd from 'flyd'
import flyd_scanMerge from 'flyd/module/scanmerge'
import R from 'ramda'
import snabbdom from '../ffffocus/node_modules/snabbdom'

flyd.lift = require('flyd/module/lift')

const defaultPatch = snabbdom.init([
  require('../ffffocus/node_modules/snabbdom/modules/class')
, require('../ffffocus/node_modules/snabbdom/modules/props')
, require('../ffffocus/node_modules/snabbdom/modules/style')
, require('../ffffocus/node_modules/snabbdom/modules/eventlisteners')
, require('../ffffocus/node_modules/snabbdom/modules/attributes')
])


// Given a UI component object with these keys:
//   events: an object of event names set to flyd streams
//   defaultState: an initial default state (plain js object) to be set immediately on pageload
//   updates: an array of pairs of flyd streams and updater functions (with each stream, make an update on the state for each new value on that stream)
//   children: an object of child module namespaces (keys) and child module state streams (values) to be mixed into this module
// Return:
//   A single state stream that combines the default state, updaters, and child components
function flam(state, view, container, options) {
  options = options || {}
  let patch = options.patch || defaultPatch

  // Render it!
  let state$ = toStateStream(state, options)
  let vtree$ = flyd.scan(patch, container, flyd.map(view, state$))
  return { state$, vtree$ }
}


function toStateStream(state, options) {
  // Concat the child state updaters with this state's updaters
  // Flip the state's updater functions to make it more compatible with Ramda functions
  // the updater functions for flyd_scanMerge are like scan, they take (accumulator, val) -> accumulator
  // instead we want (val, accumulator) -> accumulator
  // That way we can use partial applicaton functions easily like [[stream1, R.assoc('prop')], [stream2, R.evolve({count: R.inc})]]
  let updatePairs = R.compose(
    R.map(R.apply((key, fn) => [state.streams[key], (data, val) => fn(val, data)]))
  , R.filter(R.apply((key, fn) => state.streams[key])) // filter out streams actually present in .streams
  , R.toPairs
  )(state.updates || {})

  // Hooray for scanMerge !!!
  let data$ = flyd.immediate(flyd_scanMerge(updatePairs, state.data || {}))

  // update the 'data' key for every new value on the data stream
  let state$ = flyd.map(d => R.assoc('data', d, state), data$)

  // Reduce over all children, applying lift to each one
  // Stream of child updates of pairs of [childName, childState]
  state$ = R.reduce(
    (stream, pair) => {
      let [key, child] = pair
      let child$ = toStateStream(child, options)
      flyd.map(s => console.log('child', s), child$)
      return flyd.lift(R.assocPath(['children', key]), child$, stream)
    }
  , state$
  , R.toPairs(state.children))

  if(options.debug)
    flyd.map(s => console.log('%cState data: %O', "color:green; font-weight: bold;", s.data), state$)

  return state$
}

module.exports = flam

