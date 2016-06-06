import flyd from 'flyd'
import R from 'ramda'

// A component has a:
//   state: object of static data and flyd streams
//   view: snabbdom view function
//   debug: if true, will print state data on every stream update in the state
//   container: the DOM element we want to replace with our rendered snabbdom tree
//   patch: snabbdom patch function to use for rendering
function render(component) {
  let state$ = toStateStream(component.state)
  // You can get a console.log record of all new `.state` objects on your
  // component stream for debugging by setting `options.debug: true`
  if(component.debug)
    flyd.map(changes => console.log('%cState changes: %O', "color:green; font-weight: bold;", R.map(R.call, changes)), state$)

  let vtree$ = flyd.scan(
    component.patch
  , component.container
  , flyd.map(changes => component.view(component.state), state$)
  )
  return {state$, vtree$}
}

const isObj = obj => obj.constructor === Object

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
function toStateStream(state) {
  const streams = getObjStreams(state)
  return flyd.combine(function() {
    const chng = arguments[arguments.length - 1]
    const self = arguments[arguments.length - 2]
    self(chng)
  }, streams)
}

module.exports = render

