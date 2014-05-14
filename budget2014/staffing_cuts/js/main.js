
var w = 1280 - 80,
    h = 800 - 180,
    x = d3.scale.linear().range([0, w]),
    y = d3.scale.linear().range([0, h]),
    color = d3.scale.category20c(),
    root,
    node;

function wrap(text, width) {
    text.each(function() {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            y = text.attr("y"),
            x = text.attr("x"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
        }
    });
}

var treemap = d3.layout.treemap()
        .round(false)
        .size([w, h])
        .sticky(true)
        .value(function(d) { return d.change*-1; });

var svg = d3.select("#d3-container").append("div")
        .attr("class", "chart")
        .style("width", w + "px")
        .style("height", h + "px")
        .append("svg:svg")
        .attr("width", w)
        .attr("height", h)
        .append("svg:g")
        .attr("transform", "translate(.5,.5)");

d3.json("data/asl.json", function(data) {
    node = root = data;

    var nodes = treemap.nodes(root)
            .filter(function(d) { return !d.children; });

    var cell = svg.selectAll("g")
            .data(nodes)
            .enter().append("svg:g")
            .attr("class", "cell")
            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
            .on("click", function(d) { return zoom(node == d.parent ? root : d.parent); });

    cell.append("svg:rect")
        .attr("width", function(d) { return d.dx - 1; })
        .attr("height", function(d) { return d.dy - 1; })
        .style("fill", function(d) { return color(d.parent.name); });

    
    cell.append("svg:text")
        .attr('class', 'name')
        .attr("x", function(d) { return d.dx / 2; })
        .attr("y", function(d) { return d.dy / 2; })
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .text(function(d) { return d.name; })
        .style('font-size', 10);
    
    cell.selectAll('text').call(wrap, 150);
    cell.selectAll('text')
        .style("opacity", function(d) { 
            d.w = this.getBBox().width;
            d.h = this.getBBox().height;
            if ( d.dx > d.w && d.dy > d.h ) {
                return 1;
            } else {
                return 0;
            }
        });
    
    cell.append("svg:text")
        .attr('class', 'number')
        .attr("x", function(d) { 
            return d.dx / 2; 
        })
        .attr("y", function(d) { 
            var name_text = d3.select(this.parentNode).select('text');
            return Number(name_text.attr('y')) + name_text[0][0].getBBox().height;
        })
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .text(function(d) { return "(" + d.change + ")"; })
        .style('font-size', 10)
        .style("opacity", function(d) { 
            if ( d.dx > d.w ) {
                return 1;
            } else {
                return 0;
            }
        });

    d3.select(window).on("click", function() { zoom(root); });

    d3.select("select").on("change", function() {
        treemap.value(this.value == "size" ? size : count).nodes(root);
        zoom(node);
    });
});

function size(d) {
    return d.change*-1;
}

function count(d) {
    return 1;
}

function zoom(d) {
    var kx = w / d.dx, ky = h / d.dy;
    x.domain([d.x, d.x + d.dx]);
    y.domain([d.y, d.y + d.dy]);

    // Move cell groups to new x, y coordinates
    var t = svg.selectAll("g.cell").transition()
            .duration(d3.event.altKey ? 7500 : 750)
            .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });
    
    // Modify width and height so that full svg box is used
    t.select("rect")
        .attr("width", function(d) { return kx * d.dx - 1; })
        .attr("height", function(d) { return ky * d.dy - 1; });

    // Move text within this new rectangle
    // Move both the text containers and the tspans
    t.selectAll("text.name tspan")
        .attr("x", function(d) { return kx * d.dx / 2; })
        .attr("y", function(d) { 
            return ky * d.dy / 2; 
        })
        .style("opacity", function(d) { return kx * d.dx > d.w ? 1 : 0; });
    
    t.selectAll("text.name")
        .attr("x", function(d) { return kx * d.dx / 2; })
        .attr("y", function(d) { 
            d.new_name_y = ky * d.dy / 2; 
            d.bb_y = this.getBBox().height;
            return ky * d.dy / 2; 
        })
        .style("opacity", function(d) { return kx * d.dx > d.w ? 1 : 0; });
        
    t.select("text.number")
        .attr("x", function(d) { return kx * d.dx / 2; })
        .attr("y", function(d) {
            return d.new_name_y + d.bb_y;
            var name_text = d3.select(this.parentNode).select('text.name');
            return Number(name_text.attr('y')) + name_text[0][0].getBBox().height;
            // return ky * d.dy / 2 + 15; 
        })
        .style("opacity", function(d) { return kx * d.dx > d.w ? 1 : 0; });
    
    node = d;
    d3.event.stopPropagation();
}


