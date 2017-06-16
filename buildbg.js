
function main() { // {{{1
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
    anim_interval: 50,
  };

  // outer ring {{{2

  c.drawCircle(center.x, center.y, 330, 10, extend(common, {
  }));

  c.drawBrokenRingSegment(center.x, center.y, 300, 40,
                          80, 350,
                          260, 2, 2,
                          extend(common, segmented, {
    anim_updater: rotator(center.x, center.y, 0, -0.8)
  }));

  c.drawRingSegment(center.x, center.y, 300, 40, 30, 170, extend(common, segmented, {
    anim_updater: rotator(center.x, center.y, 130, 0.3)
  }));

  // mid ring {{{2

  c.drawCircle(center.x, center.y, 250, 10, extend(common, {
  }));

  var midRings = [[  30, 180,   0,  0.2 ],
                  [ 140, 300,  90, -0.5 ],
                  [  45, 125, 170,  0.6 ]]

  for (var i = 0; i < midRings.length; i++) {
    c.drawRingSegment(center.x, center.y, 220, 40, midRings[i][0], midRings[i][1], extend(common, segmented, {
      opacity: 0.2,
      anim_updater: rotator(center.x, center.y, midRings[i][2], midRings[i][3])
    }));
  }

  // inner ring {{{2


  c.drawCircle(center.x, center.y, 170, 10, extend(common, {
  }));

  c.drawBrokenRingSegment(center.x, center.y, 140, 40,
                    37, 290,
                    200, 4, 4,
                    extend(common, segmented, {
    anim_updater: rotator(center.x, center.y, 0, -0.4)
  }));
  c.drawBrokenRingSegment(center.x, center.y, 140, 40,
                    0, 200,
                    40, 40, 40,
                    extend(common, segmented, {
    anim_updater: rotator(center.x, center.y, 90, 0.6)
  }));
}

function SvgCanvas(attributes) { // {{{1
  var svgNS = "http://www.w3.org/2000/svg";
  var bg = document.getElementById('background');
  var svg = document.createElementNS(svgNS, "svg");

  var xOffset = attributes.width / 2;
  var yOffset = attributes.height / 2;

  svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
  bg.appendChild(setAttributes(svg, attributes));


  function drawer_for(element, func) { // {{{2
    return function(...args) {
      var attributes = func(...args)

      var anim_interval = attributes.anim_interval;
      var anim_updater = attributes.anim_updater;

      delete attributes.anim_interval;
      delete attributes.anim_updater;

      var e = document.createElementNS(svgNS, element)

      if (anim_interval && anim_updater) {
        anim_updater(e);
        window.setInterval(function() { anim_updater(e) }, anim_interval);
      }

      for (attr in attributes) {
        e.setAttributeNS(null, attr, attributes[attr]);
      }
      svg.appendChild(e);
    }
  }

  return { // public {{{2
    drawArc: drawer_for('path', function(x, y, radius, startAngle, endAngle, attributes = {}) { // {{{3
      return extend(attributes, {
        d: arc(x, y, radius, startAngle, endAngle)
      })
    }),

    drawCircle: drawer_for('circle', function(x, y, radius, width, attributes = {}) { // {{{3
      return extend({
        cx: x || 50,
        cy: y || 50,
        r:  radius || 50,
        fill: 'none',
        stroke: 'black',
        'stroke-width': width || 5,
      }, attributes);
    }),

    drawRingSegment: drawer_for('path', function(x, y, radius, width, startAngle, endAngle, attributes) { // {{{3
      return extend(attributes, {
        d: ringSegment(x, y, radius, width, startAngle, endAngle)
      });
    }),

    drawBrokenRingSegment: drawer_for('path', function(x, y, radius, width, // {{{3
                                                      startAngle, endAngle,
                                                      segStartAngle, segAngleWidth, segSpaceWidth,
                                                      attributes) {
      var path = [ ringSegment(x, y, radius, width, startAngle, segStartAngle) ];

      for (var start = segStartAngle + segSpaceWidth;
           start <= endAngle;
           start += (segSpaceWidth + segAngleWidth)) {
        path.push(ringSegment(x, y, radius, width, start, start + segAngleWidth));
      }

      return extend(attributes, {
        d: pack(path)
      })
    }),

    center: function() { // {{{3
      var scrCenterX = window.innerWidth / 2;
      var scrCenterY = window.innerHeight / 2;

      var x = scrCenterX - xOffset;
      var y = scrCenterY - yOffset;

      bg.style.left = x + 'px';
      bg.style.top =  y + 'px';
    },
  };
}

// utility functions  // {{{1

function extend(...args) { // {{{2
  var rtn = {};
  for (var i = 0; i < args.length; i++) {
    for (var key in args[i]) {
      rtn[key] = args[i][key];
    }
  }
  return rtn;
}

function setAttributes(e, attributes) { // {{{2
  for (attr in attributes) {
    e.setAttribute(attr, attributes[attr]);
  }
  return e;
}

function rotator(x, y, initial, delta) { // {{{2
  return (function() {
    var rotation = initial - delta;
    return function(elem) {
      rotation = (rotation + delta) % 360;
      elem.setAttributeNS(null, 'transform', pack('rotate(', rotation, x, y, ')'));
    }
  })();
}

function polarToCartesian(x, y, radius, degrees) { // {{{2
  var radians = (degrees - 90) * Math.PI / 180.0;

  return {
    x: x + (radius * Math.cos(radians)),
    y: y + (radius * Math.sin(radians)),
  };
}

function pack(...args) { // {{{2
  return args.join(" ");
}

function move(x, y) { // {{{2
  return "M " + x + " " + y;
}

function arc(x, y, radius, startAngle, endAngle, doMove = true) { // {{{2
  var start = polarToCartesian(x, y, radius, endAngle)
  var end = polarToCartesian(x, y, radius, startAngle)

  var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return pack(
    doMove ? move(start.x, start.y) : "",
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
  );
}

function ringSegment(x, y, radius, width, startAngle, endAngle) { // {{{2
  var innerRadius = radius - width / 2;
  var outerRadius = radius + width / 2;

  var startInner = polarToCartesian(x, y, innerRadius, endAngle)
  var endInner = polarToCartesian(x, y, innerRadius, startAngle)

  var startOuter = polarToCartesian(x, y, outerRadius, endAngle)
  var endOuter = polarToCartesian(x, y, outerRadius, startAngle)

  var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return pack(
      move(startOuter.x, startOuter.y),
      "A", outerRadius, outerRadius, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
      "L", endInner.x, endInner.y,
      "A", innerRadius, innerRadius, 0, largeArcFlag, 1, startInner.x, startInner.y,
      "L", startOuter.x, startOuter.y
    );
}

function line(startX, startY, endX, endY, doMove = true) { // {{{2
  return pack(
    doMove ? move(startX, startY) : "",
    "L", endX, endY
  );
}

main(); // {{{1
