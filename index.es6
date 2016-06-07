import flyd from 'flyd'
import R from 'ramda'

flyd.mergeAll = require('flyd/module/mergeall')

// A component has a:
//   state: object of static data and flyd streams
//   view: snabbdom view function
//   container: the DOM element we want to replace with our rendered snabbdom tree
//   patch: snabbdom patch function to use for rendering
function render(component) {
  let streams = getObjStreams(component.state)
  let state$ = toStateStream(streams)

  let vtree$ = flyd.scan(
    component.patch
  , component.container
  , flyd.map(changes => component.view(component.state), state$)
  )
  state$([]) // initial patch
  return {state$, vtree$}
}

const isObj = x => x.constructor === Object

// Return all the streams within an object, including those nested further down
function getObjStreams(obj) {
  let stack = [obj]
  let streams = []
  while(stack.length) {
    const vals = R.values(stack.pop())
    streams = R.concat(streams, R.filter(flyd.isStream, vals))
    stack = R.concat(stack, R.filter(isObj, vals))
  }
  return streams
}

// Convert an object containing nested streams into a single stream of changes
function toStateStream(streams) {
  return flyd.mergeAll(streams)
}

module.exports = render

