'use strict'

const ko = require('knockout')
const qs = require('qs')

ko.bindingHandlers.path = { init(e, xx, b, x, c) { applyBinding.call(this, e, b, c) } }
ko.bindingHandlers.state = { init(e, xx, b, x, c) { applyBinding.call(this, e, b, c) } }
ko.bindingHandlers.query = { init(e, xx, b, x, c) { applyBinding.call(this, e, b, c) } }

function applyBinding(el, bindings, ctx) {
  const bindingsToApply = {}
  el.href = '#'

  bindingsToApply.click = (data, e) => {
    if (1 !== which(e) || e.metaKey || e.ctrlKey || e.shiftKey) {
      return true
    }

    const [router, path] = getRoute(ctx, bindings)
    const state = bindings.has('state') ? ko.toJS(bindings.get('state')) : false
    const query = bindings.has('query') ? bindings.get('query') : false
    const handled = router.update(path, state, true, query)

    if (handled) {
      e.preventDefault()
    }

    return !handled
  }

  bindingsToApply.attr = {
    href: ko.pureComputed(() => {
      const [router, path] = getRoute(ctx, bindings)
      const querystring = bindings.has('query')
        ? '?' + qs.stringify(bindings.get('query'))
        : ''
      return router
        ? router.config.base
          + (!router.config.hashbang || router.$parent ? '' : '/#!')
          + path
          + querystring
        : '#'
    })
  }

  if (bindings.has('path')) {
    bindingsToApply.css = {
      'active-path': ko.pureComputed(() => {
        const [router, path] = getRoute(ctx, bindings)
        return router.route() !== '' && path
          ? router.route().matches(path)
          : false
        })
    }
  }

  // allow adjacent routers to initialize
  ko.tasks.schedule(() => ko.applyBindingsToNode(el, bindingsToApply))
}

function getRoute(ctx, bindings) {
  let router = getRouter(ctx)
  let path = bindings.has('path') ? ko.unwrap(bindings.get('path')) : false

  if (path === false) {
    path = router.canonicalPath()
  }

  while (path && path.match(/\/?\.\./i) && router.$parent) {
    router = router.$parent
    path = path.replace(/\/?\.\./i, '')
  }

  return [router, path]
}

function getRouter(ctx) {
  while (typeof ctx !== 'undefined') {
    if (typeof ctx.$router !== 'undefined') {
      return ctx.$router
    }

    ctx = ctx.$parentContext
  }
}

function which(e) {
  e = e || window.event
  return null === e.which ? e.button : e.which
}
