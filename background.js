
function main() { // {{{1
  // eslint-disable-next-line no-undef
  var canvas = { width: 700, height: 700, opacity: 0.4, color: cssvar("bg-deco") };
  var c = SvgCanvas(canvas);

  c.center();
  window.onresize = c.center;

  var center = Point(canvas.width / 2, canvas.height / 2);

  var style = {
    common: {
      stroke: canvas.color,
      opacity: canvas.opacity,
    },

    segmented: {
      opacity: 0.3,
      'stroke-width': 3,
      fill: canvas.color,
      animInterval: 50,
    }
  };

  // outer ring {{{2

  c.drawCircle(center, 330, 10, style.common);

  c.drawBrokenRingSegment(center,
    300, 40,    /* radius, width */
    80, 350,    /* startAngle, endAngle */
    260, 2, 2,  /* segStartAngle, segAngleWidth, segSpaceWidth */
    extend(style.common, style.segmented, {
      animUpdater: rotatorFor(center, 0, -0.8)
    }
  ));

  c.drawRingSegment(center,
    300, 40, /* radius, width */
    30, 170, /* startAngle, endAngle */
    extend(style.common, style.segmented, {
      animUpdater: rotatorFor(center, 130, 0.3)
    }
  ));

  // mid ring {{{2

  c.drawCircle(center, 250, 10, style.common);

/* [ startAngle, endAngle, initialAngle, delta ] */
  [[         30,      180,            0,   0.2 ],
   [        140,      300,           90,  -0.5 ],
   [         45,      125,          170,   0.6 ]].forEach(function(ring) {
    c.drawRingSegment(center,
      220, 40,           /* radius, width */
      ring[0], ring[1],  /* startAngle, endAngle */
      extend(style.common, style.segmented, {
        opacity: 0.2,
        animUpdater: rotatorFor(center,
                                ring[2],  /* initialAngle */
                                ring[3])  /* delta */
      })
    );
  });

  c.drawCircle(center, 170, 10, style.common);

  c.drawBrokenRingSegment(center,
    140, 40,    /* radius, width */
    37, 290,    /* startAngle, endAngle */
    200, 4, 4,  /* segStartAngle, segAngleWidth, segSpaceWidth */
    extend(style.common, style.segmented, {
      animUpdater: rotatorFor(center, 0, -0.4)
    }
  ));

  c.drawBrokenRingSegment(center,
    140, 40,     /* radius, width */
    0, 200,      /* startAngle, endAngle */
    40, 40, 40,  /* segStartAngle, segAngleWidth, segSpaceWidth */
    extend(style.common, style.segmented, {
      animUpdater: rotatorFor(center, 90, 0.6)
    }
  ));
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
      var attributes = func.apply(null, arguments);
      // var attributes = func(...args)

      var animInterval = attributes.animInterval;
      var animUpdater = attributes.animUpdater;

      delete attributes.animInterval;
      delete attributes.animUpdater;

      var e = document.createElementNS(_svgNS, element);

      if (animInterval && animUpdater) {
        animUpdater(e);
        window.setInterval(function() { animUpdater(e); }, animInterval);
      }

      for (var attr in attributes) {
        e.setAttributeNS(null, attr, attributes[attr]);
      }
      _svg.appendChild(e);
    };
  }

  return { // public {{{2
    drawArc: drawerFor('path', function(center, radius, startAngle, endAngle, attributes) { // {{{3
      return extend(attributes || {}, {
        d: arc(center, radius, startAngle, endAngle)
      });
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

      return extend(attributes, { d: path.join(' ') });
    }),

    center: function() { // {{{3
      var scrCenter = Point(window.innerWidth / 2,
                            window.innerHeight / 2);

      var topleft =   Point(scrCenter.x - _offset.x,
                            scrCenter.y - _offset.y);

      _bg.style.left = topleft.x + 'px';
      _bg.style.top =  topleft.y + 'px';
    },
  };
}

// utility functions  // {{{1

// function extend(...args) { // {{{2
function extend() {
  var rtn = {};
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

function rotatorFor(center, initial, delta) { // {{{2
  var rotation = initial - delta;
  return function(elem) {
    rotation = (rotation + delta) % 360;
    elem.setAttributeNS(null,
      'transform',
      pack('rotate(', rotation, center.x, center.y, ')'));
  };
}

function polarToCartesian(point, radius, degrees) { // {{{2
  var radians = (degrees - 90) * Math.PI / 180.0;

  return Point(
    point.x + (radius * Math.cos(radians)),
    point.y + (radius * Math.sin(radians))
  );
}

function pack() { // {{{2
  return Array.prototype.slice.call(arguments).join(' ');
}

function move(point) { // {{{2
  return pack('M', point.x, point.y);
}

function line(point) { // {{{2
  return pack('L', point.x, point.y);
}

function Point(x, y) { // {{{2
  return { x: x, y: y };
}

function arc(point, radius, startAngle, endAngle) { // {{{2
  var start = polarToCartesian(point, radius, endAngle);
  var end = polarToCartesian(point, radius, startAngle);

  var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return pack(
    move(start),
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
  );
}

function ringSegment(point, radius, width, startAngle, endAngle) { // {{{2
  var innerRadius = radius - width / 2;
  var outerRadius = radius + width / 2;

  var startInner = polarToCartesian(point, innerRadius, endAngle);
  var endInner = polarToCartesian(point, innerRadius, startAngle);

  var startOuter = polarToCartesian(point, outerRadius, endAngle);
  var endOuter = polarToCartesian(point, outerRadius, startAngle);

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
