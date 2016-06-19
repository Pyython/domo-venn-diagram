// Array for mapping each unique source
var sources = [];

// Fetch and parse data, then draw diagram
domo.get('/data/v1/venn')
  .then(convertDataObjectToArray)
  .then(getPaths)
  .then(getCombinations)
  .then(createSets)
  .then(drawVenn)
  .catch(function() {
    console.log('Error fetching data');
  });

// Converts incoming array of objects to array of arrays for easy iteration
function convertDataObjectToArray(data) {
  var newData = data.map(function(d) {
    var newArray = [];
    for (var item in d) {
      newArray.push(d[item]);
    }
    return newArray;
  });

  return newData;
}

// Creates an array representing each path
function getPaths(data) {
  var paths = {};
  var pathsArray = [];

  for (var i = 0; i < data.length; i++) {
    if (sources.indexOf(data[i][1]) === -1) {
      sources.push(data[i][1]);
    }
  }

  for (var i = 0; i < data.length; i++) {
    if (paths[data[i][0]]) {
      paths[data[i][0]].push(sources.indexOf(data[i][1]));
    } else {
      paths[data[i][0]] = [sources.indexOf(data[i][1])];
    }
  }

  Object.keys(paths).forEach(function(key, index) {
    pathsArray.push(paths[key]);
  });
  return pathsArray;
}

// Iterates through each path and counts the instances where intersections occur
function getCombinations(set) {
  var counter = {};
  for (var k = 0; k < set.length; k++) {

    // Sort each path to assure that all paths that include the same elements will be recorded under one key.
    set[k].sort();

    // Counts each instance of individual elements in a path.
    for (var i = 0; i < set[k].length; i++) {
      counter[[set[k][i]]] = (counter[[set[k][i]]] || 0) + 1;
    }

    // Removes duplicates from paths.  We only want to count unique instances of sources within a path for overlaps.
    var uniqueArray = set[k].filter(function(elem, pos) {
      return set[k].indexOf(elem) == pos;
    });

    if (uniqueArray.length > 1) {
      for (var j = 0; j < uniqueArray.length - 1; j++) {
        var combs = [];
        combs.push(uniqueArray[j]);
        for (var l = 1; l < uniqueArray.length; l++) {

          if (l + j < uniqueArray.length) {
            combs.push(uniqueArray[j + l]);
            counter[combs] = (counter[combs] || 0) + 1;
          }

        }
      }
    }
  }
  return counter;
}

// Creates an array with each path array as the key and the instances of each path as the count
function createSets(counter) {
  var sets = [];
  Object.keys(counter).forEach(function(key, index) {
    var arr = key.split(",");
    for (i = 0; i < arr.length; i++) {
      arr[i] = parseInt(arr[i]);
    }
    if (arr.length === 1) {
      sets.push({
        "sets": arr,
        "label": sources[arr[0]],
        "size": counter[key]
      });
    } else {
      sets.push({
        "sets": arr,
        "size": counter[key]
      });
    }
  });
  return sets;
}

// Draws venn diagram
function drawVenn(sets) {
  var chart = venn.VennDiagram();
  var div = d3.select("#venn")
  div.datum(sets).call(chart);

  // add a tooltip
  var tooltip = d3.select("body").append("div")
    .attr("class", "venntooltip");

  div.selectAll("path")
    .style("stroke-opacity", 0)
    .style("stroke", "#fff")
    .style("stroke-width", 0);

  // add listeners to all the groups to display tooltip on mouseover
  div.selectAll("g")
    .on("mouseover", function(d, i) {
      // sort all the areas relative to the current item
      venn.sortAreas(div, d);

      // Display a tooltip with the current size
      tooltip.transition().duration(400).style("opacity", .9);
      if (d.size > 1) {
        tooltip.text(d.size + " users");
      } else {
        tooltip.text(d.size + " user");
      }

      // highlight the current path
      var selection = d3.select(this).transition("tooltip").duration(400);
      selection.select("path")
        .style("stroke-width", 3)
        .style("fill-opacity", d.sets.length == 1 ? .4 : .1)
        .style("stroke-opacity", 1);
    })

  .on("mousemove", function() {
    tooltip.style("left", (d3.event.pageX) + "px")
      .style("top", (d3.event.pageY - 28) + "px");
  })

  .on("mouseleave", function(d, i) {
    tooltip.transition().duration(400).style("opacity", 0);
    var selection = d3.select(this).transition("tooltip").duration(400);
    selection.select("path")
      .style("stroke-width", 0)
      .style("fill-opacity", d.sets.length == 1 ? .25 : .0)
      .style("stroke-opacity", 0);
  });
}
