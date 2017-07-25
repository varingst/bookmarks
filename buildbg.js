
function main() { // {{{1
  // eslint-disable-next-line no-undef
  var canvas = { width: 700, height: 700, opacity: 0.4, color: cssvar("bg-deco") };
  var c = SvgCanvas(canvas);

  c.center();
  window.onresize = c.center;

  var center = { x: canvas.width / 2, y: canvas.height / 2 };

  var common = {
    stroke: canvas.color,
    opacity: canvas.opacity,
  };

  var segmented = {
    opacity: 0.3,
    'stroke-width': 3,
    fill: canvas.color,
    animInterval: 50,
  };

  // outer ring {{{2

  c.drawCircle(center, 330, 10, extend(common, {}));

  c.drawBrokenRingSegment(center, 300, 40,
                          80, 350,
                          260, 2, 2,
                          extend(common, segmented, {
    animUpdater: rotator(center, 0, -0.8)
  }));

  c.drawRingSegment(center, 300, 40, 30, 170, extend(common, segmented, {
    animUpdater: rotator(center, 130, 0.3)
  }));

  // mid ring {{{2

  c.drawCircle(center, 250, 10, extend(common, {}));

  var midRings = [[  30, 180,   0,  0.2 ],
                  [ 140, 300,  90, -0.5 ],
                  [  45, 125, 170,  0.6 ]]

  for (var i = 0; i < midRings.length; i++) {
    c.drawRingSegment(center, 220, 40, midRings[i][0], midRings[i][1], extend(common, segmented, {
      opacity: 0.2,
      animUpdater: rotator(center, midRings[i][2], midRings[i][3])
    }));
  }

  // inner ring {{{2


  c.drawCircle(center, 170, 10, extend(common, {
  }));

  c.drawBrokenRingSegment(center, 140, 40,
                    37, 290,
                    200, 4, 4,
                    extend(common, segmented, {
    animUpdater: rotator(center, 0, -0.4)
  }));
  c.drawBrokenRingSegment(center, 140, 40,
                    0, 200,
                    40, 40, 40,
                    extend(common, segmented, {
    animUpdater: rotator(center, 90, 0.6)
  }));
}

function SvgCanvas(attributes) { // {{{1
  var _svgNS = "http://www.w3.org/2000/svg";
  var _bg = document.getElementById('background');
  var _svg = document.createElementNS(_svgNS, "svg");

  var _offset = Point(attributes.width / 2, attributes.height / 2);

  _svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
  _bg.appendChild(setAttributes(_svg, attributes));


  function drawerFor(element, func) { // {{{2
    // return function(...args) {
    return function() {
      var attributes = func.apply(null, arguments)
      // var attributes = func(...args)

      var animInterval = attributes.animInterval;
      var animUpdater = attributes.animUpdater;

      delete attributes.animInterval;
      delete attributes.animUpdater;

      var e = document.createElementNS(_svgNS, element)

      if (animInterval && animUpdater) {
        animUpdater(e);
        window.setInterval(function() { animUpdater(e) }, animInterval);
      }

      for (var attr in attributes) {
        e.setAttributeNS(null, attr, attributes[attr]);
      }
      _svg.appendChild(e);
    }
  }

  return { // public {{{2
    drawArc: drawerFor('path', function(center, radius, startAngle, endAngle, attributes) { // {{{3
      return extend(attributes || {}, {
        d: arc(center, radius, startAngle, endAngle)
      })
    }),

    drawCircle: drawerFor('circle', function(center, radius, width, attributes) { // {{{3
      return extend(attributes || {}, {
        cx: center.x || 50,
        cy: center.y || 50,
        r:  radius || 50,
        fill: 'none',
        stroke: 'black',
        'stroke-width': width || 5,
      }, attributes);
    }),

    drawRingSegment: drawerFor('path', function(center, radius, width, startAngle, endAngle, attributes) { // {{{3
      return extend(attributes || {}, {
        d: ringSegment(center, radius, width, startAngle, endAngle)
      });
    }),

    drawBrokenRingSegment: drawerFor('path', function(center, radius, width, // {{{3
                                                      startAngle, endAngle,
                                                      segStartAngle, segAngleWidth, segSpaceWidth,
                                                      attributes) {
      var path = [ ringSegment(center, radius, width, startAngle, segStartAngle) ];

      for (var start = segStartAngle + segSpaceWidth;
           start <= endAngle;
           start += (segSpaceWidth + segAngleWidth)) {
        path.push(ringSegment(center, radius, width, start, start + segAngleWidth));
      }

      return extend(attributes, {
        d: pack(path)
      })
    }),

    center: function() { // {{{3
      var scrCenter = Point(window.innerWidth / 2,
                            window.innerHeight / 2);

      var topleft =   Point(scrCenter.x - _offset.x,
                            scrCenter.y - _offset.y)

      _bg.style.left = topleft.x + 'px';
      _bg.style.top =  topleft.y + 'px';
    },
  };
}

// utility functions  // {{{1

// function extend(...args) { // {{{2
function extend() {
  var rtn = {};
  // for (var i = 0; i < args.length; i++) {
    // for (var key in args[i]) {
      // rtn[key] = args[i][key];
    // }
  // }
  for (var i = 0; i < arguments.length; i++) {
    for (var key in arguments[i]) {
      rtn[key] = arguments[i][key];
    }
  }
  return rtn;
}

function setAttributes(e, attributes) { // {{{2
  for (var attr in attributes) {
    e.setAttribute(attr, attributes[attr]);
  }
  return e;
}

function rotator(center, initial, delta) { // {{{2
  var rotation = initial - delta;
  return function(elem) {
    rotation = (rotation + delta) % 360;
    elem.setAttributeNS(null,
      'transform',
      pack('rotate(', rotation, center.x, center.y, ')'));
  }
}

function polarToCartesian(point, radius, degrees) { // {{{2
  var radians = (degrees - 90) * Math.PI / 180.0;

  return Point(
    point.x + (radius * Math.cos(radians)),
    point.y + (radius * Math.sin(radians))
  );
}

// function pack(...args) { // {{{2
function pack() {
  // return args.join(" ");
  return Array.prototype.slice.call(arguments).join(" ")
}

function move(point) { // {{{2
  return "M " + point.x + " " + point.y;
}

function line(point) { // {{{2
  return "L " + point.x + " " + point.y;
}

function Point(x, y) { // {{{2
  return { x: x, y: y }
}

function arc(point, radius, startAngle, endAngle) { // {{{2
  var start = polarToCartesian(point, radius, endAngle)
  var end = polarToCartesian(point, radius, startAngle)

  var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return pack(
   move(start),
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
  );
}

function ringSegment(point, radius, width, startAngle, endAngle) { // {{{2
  var innerRadius = radius - width / 2;
  var outerRadius = radius + width / 2;

  var startInner = polarToCartesian(point, innerRadius, endAngle)
  var endInner = polarToCartesian(point, innerRadius, startAngle)

  var startOuter = polarToCartesian(point, outerRadius, endAngle)
  var endOuter = polarToCartesian(point, outerRadius, startAngle)

  var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return pack(
      move(startOuter),
      "A", outerRadius, outerRadius, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
      line(endInner),
      "A", innerRadius, innerRadius, 0, largeArcFlag, 1, startInner.x, startInner.y,
      line(startOuter)
    );
}

main(); // {{{1
