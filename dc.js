/* Rimalith page runtime: renders a {{hole}} / <sc-for> / <sc-if> template with a small component class. */
(function () {
  'use strict';
  var HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
  var WHOLE = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/;

  function lookup(scope, path) {
    path = path.trim();
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (path === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    var parts = path.split('.'), v = scope;
    for (var i = 0; i < parts.length; i++) {
      if (v == null) return undefined;
      v = v[parts[i]];
    }
    return v;
  }
  function interp(str, scope) {
    return str.replace(HOLE, function (_, p) { var v = lookup(scope, p); return v == null ? '' : String(v); });
  }

  function DCLogic(props) { this.props = props || {}; this.state = {}; }
  DCLogic.prototype.setState = function (patch) {
    var s = typeof patch === 'function' ? patch(this.state) : patch;
    for (var k in s) this.state[k] = s[k];
    if (this.__render) this.__render();
  };
  DCLogic.prototype.forceUpdate = function () { if (this.__render) this.__render(); };
  window.DCLogic = DCLogic;

  function mount(opts) {
    var tpl = opts.template, host = opts.host, Comp = opts.component;
    var inst = new Comp(opts.props || {});
    var handlers = {}, hid = 0;

    function renderNode(node, scope, out) {
      if (node.nodeType === 3) { out.appendChild(document.createTextNode(interp(node.nodeValue, scope))); return; }
      if (node.nodeType !== 1) return;
      var tag = node.tagName.toLowerCase();
      if (tag === 'sc-for') {
        var list = lookup(scope, (node.getAttribute('list').match(WHOLE) || [, ''])[1]) || [];
        var as = node.getAttribute('as') || 'item';
        for (var i = 0; i < list.length; i++) {
          var sc = Object.create(scope); sc[as] = list[i]; sc.$index = i;
          renderChildren(node, sc, out);
        }
        return;
      }
      if (tag === 'sc-if') {
        var m = node.getAttribute('value').match(WHOLE);
        if (m && lookup(scope, m[1])) renderChildren(node, scope, out);
        return;
      }
      if (tag === 'helmet' || tag === 'script') return;
      var el = node.namespaceURI === 'http://www.w3.org/2000/svg'
        ? document.createElementNS(node.namespaceURI, node.tagName)
        : document.createElement(node.tagName);
      for (var a = 0; a < node.attributes.length; a++) {
        var at = node.attributes[a], name = at.name, val = at.value;
        if (name.indexOf('hint-') === 0) continue;
        if (name.indexOf('on') === 0 && WHOLE.test(val)) {
          var fn = lookup(scope, val.match(WHOLE)[1]);
          if (typeof fn === 'function') { var id = 'h' + (hid++); handlers[id] = fn; el.setAttribute('data-on-' + name.slice(2), id); }
          continue;
        }
        var v = WHOLE.test(val) ? lookup(scope, val.match(WHOLE)[1]) : interp(val, scope);
        if (v === false || v == null) continue;
        el.setAttribute(name, v === true ? '' : String(v));
      }
      renderChildren(node.tagName.toLowerCase() === 'template' ? node.content : node, scope, el);
      out.appendChild(el);
    }
    function renderChildren(node, scope, out) { for (var c = node.firstChild; c; c = c.nextSibling) renderNode(c, scope, out); }

    function render() {
      handlers = {}; hid = 0;
      var vals = inst.renderVals();
      var frag = document.createElement('div');
      renderChildren(tpl.content, vals, frag);
      var next = host.cloneNode(false);
      while (frag.firstChild) next.appendChild(frag.firstChild);
      window.morphdom(host, next, {
        onBeforeElUpdated: function (from, to) {
          if (from.tagName === 'VIDEO' || from.tagName === 'INPUT' || from.tagName === 'TEXTAREA' || from.tagName === 'SELECT') {
            for (var i = 0; i < to.attributes.length; i++) if (from.getAttribute(to.attributes[i].name) !== to.attributes[i].value) from.setAttribute(to.attributes[i].name, to.attributes[i].value);
            return from.tagName !== 'VIDEO' ? true : false;
          }
          return !from.isEqualNode(to);
        }
      });
      if (opts.afterRender) opts.afterRender(vals);
    }
    inst.__render = render;

    ['click', 'submit', 'change', 'input'].forEach(function (ev) {
      host.addEventListener(ev, function (e) {
        var t = e.target.closest ? e.target.closest('[data-on-' + ev + ']') : null;
        if (!t || !host.contains(t)) return;
        var fn = handlers[t.getAttribute('data-on-' + ev)];
        if (fn) fn(e);
      });
    });
    render();
    if (inst.componentDidMount) inst.componentDidMount();
    return inst;
  }
  window.RimalithPage = { mount: mount };
})();
