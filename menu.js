
function main() {
  var myMenu = Menu();
  /* eslint-disable no-undef */
  if (typeof BOOKMARKS !== 'undefined') {
    // build menu from bookmarks.js
    myMenu.build(BOOKMARKS);
  } else {
    // build menu from textarea content
    var input = document.getElementById('input');
    var ielem = make('textarea', { autofocus: true, rows: 32 });
    var mkmenu = menuMaker(myMenu);
    ielem.addEventListener('input', mkmenu);
    input.appendChild(ielem);
    ielem.innerHTML = defaultJSON;
    mkmenu({ target: { value: defaultJSON }});
  }
  /* eslint-enable no-undef */
}

function menuMaker(menu) {
  var lastWorking;
  return function(e) {
    try {
      var bookmarks = JSON.parse(e.target.value);
      menu.build(bookmarks);
      lastWorking = bookmarks;
    } catch(_) {
      menu.build(lastWorking);
    } finally {
      menu.restore();
    }
  };
}

var Menu = function() { // {{{1
  var _hotKeys = HotKeys();
  var _sections = {};
  var _orphans = {};
  var _selected;

  var _menuElement = document.getElementById('menu');
  var _bookmarks = document.getElementById('bookmarks');

  // Chrome, Safari, Opera
  _bookmarks.addEventListener("mousewheel", mouseWheelHandler, false);
  // Firefox
  _bookmarks.addEventListener("DOMMouseScroll", mouseWheelHandler, false);


  // private methods {{{2

  function clearBookmarks() { // {{{3
    _hotKeys.clearDynamic();
    for (var entry in _orphans) {
      delete _orphans[entry];
    }
    while (_bookmarks.firstChild) {
      _bookmarks.removeChild(_bookmarks.firstChild);
    }
  }

  function mouseWheelHandler(e) { // {{{3
    e.preventDefault();
    var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
    var toShift;
    if (_bookmarks.childElementCount === 0) { return; }
    if (delta < 0) {
      toShift = _bookmarks.removeChild(_bookmarks.lastChild);
      _bookmarks.insertBefore(toShift, _bookmarks.firstChild);
    } else {
      toShift = _bookmarks.removeChild(_bookmarks.firstChild);
      _bookmarks.appendChild(toShift);
    }
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
    for (var title in content) {
      if (i++ % columns == 0) {
        var row = group.insertRow();
      }
      var url = content[title];
      var cell = row.appendChild(make('td'));
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
      throw new Error("Malformed entry, " +
                      "expected object or string, got: " +
                      typeof content);
    }
  }

  function showSection(section) { // {{{3
    clearBookmarks();

    for (var menuSection in _sections) {
      if (menuSection == section) {
        var showing = _sections[section].declaration;
        for (var title in showing) {
          buildEntry(title, showing[title]);
        }
        if (Object.keys(_orphans).length > 0) {
          buildEntry(section, _orphans);
        }
        // eslint-disable-next-line no-undef
        _sections[menuSection].label.style.background = cssvar("item-active");
        _selected = section;
      } else {
        // eslint-disable-next-line no-undef
        _sections[menuSection].label.style.background = cssvar("item-passive");
      }
    }
  }

  function add(title, sectionDeclaration) { // {{{2
    var parsed = _hotKeys.add(title, showSection);

    var section = make('div', { class: "section", onmouseover: parsed.show });
    section.appendChild(makeHotKey(parsed.key));
    section.appendChild(make('span', { class: "label", innerHTML: parsed.title}));
    _sections[parsed.title] = {
      declaration: sectionDeclaration,
      label: section
    };

    _menuElement.appendChild(section);
  }

  function clearAll() {
    clearBookmarks();
    _hotKeys.clearAll();
    while(_menuElement.firstChild) {
      _menuElement.removeChild(_menuElement.firstChild);
    }
    while(_bookmarks.firstChild) {
      _bookmarks.removeChild(_bookmarks.firstChild);
    }
  }

  return {
    restore: function () {
      showSection(_selected);
    },

    build: function(bookmarks) {
      clearAll();
      for (var section in bookmarks) {
        add(section, bookmarks[section]);
      }
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

    keyCode = 48; // "0"
    while (keyCode <= 48 + 9) {
      char = String.fromCharCode(keyCode);
      table[char] = keyCode++;
    }

    return function(char) {
      return table[char];
    };
  })();

  var _assigned = (function() { // {{{2
    // dynamic hotkey assigner
    var priority = "jfkdls;ahgurieowpqytmv,c.x/z1234567890".split('');
    var dynamic = [];
    return {
      next: function() { // {{{3
        return priority.find(function(char) {
          var code = keyCode(char);
          if (code in _bindings) {
            return;
          }
          dynamic.push(code);
          return char;
        });
      },

      take: function(key, isDynamic) { // {{{3
        var code = keyCode(key);
        if (code in _bindings) {
          return null;
        }
        if (isDynamic) {
          dynamic.push(code);
        }
        return key;
      },

      clearDynamic: function() { // {{{3
        dynamic.forEach(function(code) {
          delete _bindings[code];
        });
        dynamic.length = 0;
      },

      clearAll: function() { // {{{3
        for (var code in _bindings) {
          delete _bindings[code];
        }
        dynamic.length = 0;
      }
    };
  })();

  document.addEventListener('keydown', function(event) { // {{{2
    if (document.getElementById('input').firstChild === document.activeElement) {
      return;
    }
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
    // check if there's a < > in the title to designate hotkey
    var rtn = findHotKey(title);
    if (rtn.key) {
      // it they key is already taken, _assigned.take() returns null
      var wanted = rtn.key;
      rtn.key = _assigned.take(rtn.key, isDynamic);
      if (rtn.key == null) {
        throw new Error("Duplicate key assignment for " +
                        title + ", " +
                        "'" + wanted + "' already taken");
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
      _assigned.clearDynamic();
    },

    clearAll: function() { // {{{2
      _assigned.clearAll();
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
      rtn.show = function() { showFunc(rtn.title); };
      if (rtn.key) {
        bind(rtn.key, rtn.show);
      }
      return rtn;
    }
  };
};

// HTML element creation convencience {{{1

function make(elem, props) { // {{{2
  var e = document.createElement(elem);
  for (var prop in (props || {})) {
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

function makeLink(title, url) { // {{{2
  var span = make('span');
  span.appendChild(make('a', { innerHTML: title, href: url }));
  return span;
}

// Default JSON for demonstration {{{1

var page = "https://nosuch.com";
var defaultJSON = JSON.stringify({
  "<T>ab1": {
    "Group1": {
      "B<o>okmark2": page,
      "Book<m>ark3": page,
      "Bookmark4": page,
      "Bookmark5": page,
    },
    "NoGro<u>p1": page,
    "NoGroup2": page,
  },
  "T<a>b2": {
    "Group2": {
      "Bookmark6": page,
      "Bookmark7": page,
    },
    "Group3": {
      "Bookmark8": page,
      "Bookmark9": page,
    }
  },
  "Ta<b>3": {
    "Bookmark10": page,
    "Bookmark11": page,
    "Bookmark12": page,
    "Bookmark13": page,
    "Bookmark14": page,
    "Bookmark15": page,
    "Bookmark16": page,
    "Bookmark17": page,
    "Bookmark18": page,
    "Bookmark19": page,
  },
}, null, 2);


main(); // {{{1
