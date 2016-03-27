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

  R.map( // Just some helpful warnings if you accidentally name 'updates' as 'updaters' or something
    prop => !state[prop] && console && console.warn(`No .${prop} present in state: `, state)
  , ['data', 'streams', 'updates']
  )

  let state$ = toStateStream(state, options)
  let vtree$ = flyd.scan(patch, container, flyd.map(view, state$))

  // Render it!
  return { vtree$, state$ }
}


function toStateStream(state, options) {
  // Every parent update on a child state updates the child state

  // Concat the child state updaters with this state's updaters
  // Flip the state's updater functions to make it more compatible with Ramda functions
  // the updater functions for flyd_scanMerge are like scan, they take (accumulator, val) -> accumulator
  // instead we want (val, accumulator) -> accumulator
  // That way we can use partial applicaton functions easily like [[stream1, R.assoc('prop')], [stream2, R.evolve({count: R.inc})]]
  let updatePairs = R.compose(
    R.map(R.apply((key, fn) => [state.streams[key], (data, val) => fn(val, data)]))
  , R.filter(R.apply((key, fn) => R.hasOwnProperty(key, state.streams))) // filter out streams actually present in .streams
  , R.toPairs
  )(state.updates || {})

  // Hooray for scanMerge !!!
  let data$ = flyd.immediate(flyd_scanMerge(updatePairs, state.data))

  // For every event on each child state stream, lift that into our own parent state stream
  let lifter = key => (state, childState) =>
    flyd.lift(
      R.assocPath(['children', key])
    , toStateStream(childState)
    , state
    )

  // Reduce over all children, applying lift to each one
  let state$ = R.compose(
    R.reduce(key => R.apply(lifter(key)), R.__, state.children || [])
  , flyd.map(d => R.assoc('data', d, state))
  )(data$)

  if(options.debug)
    flyd.map(s => console.log('%cState data: %O', "color:green; font-weight: bold;", s.data), state$)

  return state$
}

module.exports = flam

