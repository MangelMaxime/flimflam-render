
# flyd-construct

This is single function module that allows you to stitch together UI components. It produces a single state stream from your root component, and includes any number of nested child components in that state stream.

```js
import flyd_construct from 'flyd-construct'
import main from './components/main'

let state$ = flyd_construct(main.init())
let vtree$ = flyd.map(main.view, state$)
let dom$ = flyd.scan(patch, domContainer, vtree$)
```

A UI component is an object with these keys:

**events**: an object of `eventName: stream`. These streams can be fed into the event handlers in your vdom.

**updates**: an array of pairs of streams and functions that update the state.

**defaultState**: state you want to have for the component immediately on pageload.

**children**: an object of child component names (keys) mapped to child components (child components of course have the same module structure, and the children key can be undefined if the component has no child components)

You only need to run this once on the parent module of `{updates, events, defaultState, children}`, and it will combine everything together.

More docs and examples coming very soon.

