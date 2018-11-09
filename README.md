# Bookmarks.js

My first Javascript project, written after some introductory reading on React,
because:

* I wanted a way to keep bookmarks without tying it to a specific browser.
* I wanted to get a feel for the DOM below the React magic.

It was written in ES5 to keep things basic and de-sugared as I was new to the
language.

`Bookmarks.js` generates a bookmark page from nested javascript objects on an
animated background of dynamically created svg. It expects a file `bookmarks.js`
to exist, that declares a variable `BOOKMARKS` containing the nested objects.
If this does not exist, it will provide a `textarea` with placeholder bookmarks
for demonstration.

`bookmarks.js` is expected to have the following structure

```javascript
var BOOKMARKS = {
  'tab-label': {
    'group-label': {
      'bookmark-label': 'https://some.url'
    }
    'bookmark-label': 'https://some.url'
  }
}
```

The first level of objects declares tab pages. The second level declares
ungrouped bookmarks, or a bookmark group. Hotkeys may be assigned to tab
and bookmark labels by surrounding the key with `< >`. Declaring a bookmark
`'b<o>okmark': 'https://someurl'` assigns the hotkey `o`. Assigning an already
assigned hotkey throws an error.

Pressing the hotkey opens the bookmark in the same browser tab. Pressing
shift+hotkey will open the bookmark in a new tab, or however the browser handles
`window.open(url, '_blank')`.

If you don't use a US keyboard layout, you _might_ run into some trouble over how
this handles keycodes and charcodes.
