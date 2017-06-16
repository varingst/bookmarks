function main() {
  myMenu = Menu();
  // iterate over declaration in index.html
  for (var section in MENU) {
    myMenu.add(section, MENU[section]);
  }
}

var Menu = function() { // {{{1
  var _hotKeys = HotKeys();
  var _sections = {};
  var _orphans = {};

  var _menuElement = document.getElementById('menu');
  var _bookmarks = document.getElementById('bookmarks');

  // private methods {{{2

  function clearBookmarks() { // {{{3
    _hotKeys.clearDynamic();
    for (entry in _orphans) {
      delete _orphans[entry];
    }
    while (_bookmarks.firstChild) {
      _bookmarks.removeChild(_bookmarks.firstChild);
    }
  }

  function make(elem, props) { // {{{3
    var e = document.createElement(elem)
    for (prop in (props || {})) {
      switch(prop) {
        case 'class':
          e.className = props[prop];
          break;
        default:
          e[prop] = props[prop];
      }
    }
    return e;
  }

  function makeLink(title, url) { // {{{3
    var span = make('span');
    span.appendChild(make('a', { innerHTML: title, href: url }));
    return span;
  }

  function makeGroup(label, content) { // {{{3
    var item = make('div', { class: 'groupcontainer' });
    item.appendChild(make('span', { innerHTML: label, class: 'grouplabel' }));
    var group = item.appendChild(make('table', { class: 'group' }));

    fillGroup(group, content);

    return item;
  }

  function fillGroup(group, content) { // {{{3
    var columns = 2;
    var i = 0;
    for (title in content) {
      if (i++ % columns == 0) {
        var row = group.insertRow();
      }
      var url = content[title];
      var cell = row.appendChild(make('td'))
      cell.appendChild(makeBookmark(title, url));
    }
  }

  function makeHotKey(key) { // {{{3
    return make('span', { class: "hotkey", innerHTML: key });
  }

  function makeBookmark(label, url) { // {{{3
    var b = make('div', { class: "bookmark" });
    var rtn = _hotKeys.addDynamic(label, url);
    if (rtn.key) {
      b.appendChild(makeHotKey(rtn.key));
    }
    b.appendChild(makeLink(rtn.title, url));
    return b;
  }

  function buildEntry(title, content) { // {{{3
    if (typeof content === 'string' || content instanceof String) {
      _orphans[title] = content;
    } else if (typeof content === 'object') {
      _bookmarks.appendChild(makeGroup(title, content));
    } else {
      console.log(typeof content);
    }
  }


  function showSection(section) { // {{{3
    clearBookmarks();

    for (menuSection in _sections) {
      if (menuSection == section) {
        var showing = _sections[section].declaration;
        for (var title in showing) {
          buildEntry(title, showing[title]);
        }
        if (Object.keys(_orphans).length > 0) {
          buildEntry(section, _orphans);
        }
        _sections[menuSection].label.style.background = cssvar("item-active");
      } else {
        _sections[menuSection].label.style.background = cssvar("item-passive");
      }
    }
  }

  return {
    add: function(title, sectionDeclaration) { // {{{2
      var parsed = _hotKeys.add(title, showSection);

      var section = make('li', { class: "section", onmouseover: parsed.show })
      section.appendChild(makeHotKey(parsed.key));
      section.appendChild(make('span', { class: "label", innerHTML: parsed.title}));
      _sections[parsed.title] = {
        declaration: sectionDeclaration,
        label: section
      };

      _menuElement.appendChild(section);
    }
  };
};

var HotKeys = function() { // {{{1
  // keycode to function mapping
  var _bindings = {};

  var keyCode = (function() { // {{{2
  // keycode from char loopup function
    var table = {
      ';': 186,
      ',': 188,
      '.': 190,
      '/': 191,
    };
    var keyCode = 65;   // "a"
    var charCode = 97;  // "a"
    var char;
                   // a -> z
    while (keyCode <= 65 + 25) {
      char = String.fromCharCode(charCode++);
      table[char] = keyCode++;
    }

    return function(char) {
      return table[char];
    }
  })();

  var _assigned = (function() { // {{{2
    // dynamic hotkey assigner
    var priority = "jfkdls;ahgurieowpqytmv,c.x/z".split('');
    var dynamic = [];
    return {
      next: function() { // {{{3
        for (var i = 0; i < priority.length; i++) {
          var code = keyCode(priority[i])
          if (code in _bindings) {
            continue
          }
          dynamic.push(code);
          return priority[i];
        }
      },

      take: function(key, isDynamic) { // {{{3
        var code = keyCode(key)
        if (code in _bindings) {
          return null;
        }
        if (isDynamic) {
          dynamic.push(code);
        }
        return key;
      },

      clear: function() { // {{{3
        for (var i = 0; i < dynamic.length; i++) {
          delete _bindings[dynamic[i]];
        }
        dynamic.length = 0;
      }
    }
  })();

  document.addEventListener('keydown', function(event) { // {{{2
    var func = _bindings[event.keyCode];
    if(func) {
      func(event);
    }
  });

  // private methods {{{2

  function bind(char, func) { // {{{3
    if (char) {
      _bindings[keyCode(char)] = func;
      return char;
    }
  }

  function isShift(event) { // {{{3
    return window.event ? !!window.event.shiftKey : !!event.shiftKey;
  }

  function bestKey(title, isDynamic) { // {{{3
    // check if there's a & in the title to designate hotkey
    var rtn = findHotKey(title);
    if (rtn.key) {
      // it they key is already taken, _assigned.take() returns null
      var wanted = rtn.key;
      rtn.key = _assigned.take(rtn.key, isDynamic)
      if (rtn.key == null) {
        console.log(title + ": key '" + wanted + "' already taken");
      }
    } // so this acts as fallback
    if (!rtn.key) {
      rtn.key = _assigned.next();
    }
    return rtn;
  }

  function findHotKey(title) { // {{{3
    var idx = title.search(/<.>/);
    if (idx >= 0) {
      return { key:   title.charAt(idx + 1).toLowerCase(),
               title: title.replace(/<(.)>/, "$1") };
    } else {
      return { title : title };
    }
  }

  return {
    clearDynamic: function() { // {{{2
      _assigned.clear();
    },

    addDynamic: function(title, url) { // {{{2
      var rtn = bestKey(title, true);
      if (rtn.key) {
        bind(rtn.key, function(event) {
          if (isShift(event)) {
            // open in new tab .. kinda
            window.open(url, '_blank').focus();
          } else {
            // open in current tab
            window.location.replace(url);
          }
        });
      }
      return rtn;
    },

    add: function(title, showFunc) { // {{{2
      var rtn = bestKey(title, false);
      rtn.show = function() { showFunc(rtn.title); }
      if (rtn.key) {
        bind(rtn.key, rtn.show);
      }
      return rtn;
    }
  }
};

main(); // {{{1
