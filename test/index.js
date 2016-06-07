const assert = require('assert')
const R = require("ramda")
const flyd = require("flyd")

const snabbdom = require("snabbdom")
const patch = snabbdom.init([ // Init patch function with choosen modules
  require('snabbdom/modules/class'), // makes it easy to toggle classes
  require('snabbdom/modules/props'), // for setting properties on DOM elements
  require('snabbdom/modules/style'), // handles styling on elements with support for animations
  require('snabbdom/modules/eventlisteners'), // attaches event listeners
])
const h = require('snabbdom/h')

const render = require('../')


test('will render static data', () => {
  var container = document.createElement('div')
  const view = state => h('p', state.x)
  render({
    container, patch, view
  , state: {x: 'hallo!'}
  })
  assert.equal(container.textContent, 'hallo!')
})

test('it will render stream data', () => {
  var container = document.createElement('div')
  const view = state => h('p', state.streamVal())
  render({
    container, patch, view
  , state: {streamVal: flyd.stream('wat!!')}
  })
  assert.equal(container.textContent, 'wat!!')
})

test('it will patch on new stream data over time', () => {
  var container = document.createElement('div')
  const view = state => h('p', state.streamVal())
  const s = flyd.stream('wat!!')
  render({
    container, patch, view
  , state: {streamVal: s}
  })
  assert.equal(container.textContent, 'wat!!')
  s('goodbye')
  assert.equal(container.textContent, 'goodbye')
})

test('it patches on nested streams', () => {
  var container = document.createElement('div')
  const view = state => h('p', state.nested.x.streamVal() + state.y())
  const s = flyd.stream('wat!!')
  render({
    container, patch, view
  , state: {y: s, nested: {x: {streamVal: s}}}
  })
  assert.equal(container.textContent, 'wat!!wat!!')
  s('bye')
  assert.equal(container.textContent, 'byebye')
})

test('it patches with multiple empty streams', () => {
  var container = document.createElement('div')
  const view = state => h('p', state.s1() || 'hi')
  let state = {s1: flyd.stream(), s2: flyd.stream()}
  render({ container, patch, view, state })
  assert.equal(container.textContent, 'hi')
  state.s1('x')
  assert.equal(container.textContent, 'x')
  state.s2('y')
  state.s1('z')
  assert.equal(container.textContent, 'z')
})

