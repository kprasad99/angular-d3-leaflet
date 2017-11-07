import { Component, OnInit } from '@angular/core';

import * as d3 from 'd3';
import * as L from 'leaflet';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Angular5 D3v4 Leaflet Example';

  options = {
    layers: [
      L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '...'
      })
    ],
    zoom: 4,
    center: L.latLng(22.776, 81.87)
  };

  private map: L.map;

  ngOnInit() {}

  onMapReady(map: L.map) {
    function projectPoint(x, y) {
      const point = map.latLngToLayerPoint(new L.LatLng(y, x));
      this.stream.point(point.x, point.y);
    }

    const transform = d3.geoTransform({ point: projectPoint });
    const path: any = d3.geoPath(d3.geoNaturalEarth1()).projection(transform);

    L.svg({ clickable: true }).addTo(map);

    const svg = d3.select(map.getPanes().overlayPane).select('svg');

    const g = svg.append('g').attr('class', 'leaflet-zoom-hide');

    const arcGroup = g.append('g');
    const imageGroup = g.append('g');
    const pointGroup = g.append('g');

    d3.csv('assets/major-cities.csv', function(error1, data) {
      // Draw images after drawing paths.

      data.forEach(v => (v.latLng = new L.LatLng(v.lat, v.lon)));

      const images = imageGroup
        .selectAll('image')
        .data([0])
        .data(data)
        .enter()
        .append('image')
        .attr(
          'xlink:href',
          d => './assets/images/' + d.code.toLowerCase() + '.jpg'
        )
        .attr('width', '34')
        .attr('height', '34');

      // Also, text needs to be added to the `g` group
      const point = pointGroup
        .append('g')
        .attr('class', 'points')
        .selectAll('g')
        .data(data)
        .enter()
        .append('g');

      point
        .append('text')
        .attr('y', 5)
        .attr('dx', '1em')
        .text(d => d.center);

      const tweenDash = function tweenDashM() {
        // This function is used to animate the dash-array property, which is a
        //  nice hack that gives us animation along some arbitrary path (in this
        //  case, makes it look like a line is being drawn from point A to B)
        const len = this.getTotalLength(),
          interpolate = d3.interpolateString('0,' + len, len + ',' + len);

        return t => interpolate(t);
      };

      // --- Add paths
      // Format of object is an array of objects, each containing
      //  a type (LineString - the path will automatically draw a greatArc)
      //  and coordinates
      let links = [
        {
          type: 'LineString',
          coordinates: [[data[0].lon, data[0].lat], [data[1].lon, data[1].lat]]
        }
      ];

      // you can build the links any way you want - e.g., if you have only
      //  certain items you want to draw paths between
      // Alterntively, it can be created automatically based on the data
      links = [];
      for (let i = 0, len = data.length - 1; i < len; i++) {
        // (note: loop until length - 1 since we're getting the next
        //  item with i+1)
        links.push({
          type: 'LineString',
          coordinates: [
            [data[i].lon, data[i].lat],
            [data[i + 1].lon, data[i + 1].lat]
          ]
        });
      }

      // Standard enter / update
      const pathArcs = arcGroup
        .selectAll('.arc')
        .data(links)
        .enter()
        .append('path')
        .attr('class', 'arc')
        .style('fill', 'none');

      // exit
      pathArcs.exit().remove();
      map.on('zoom', update);

      update();

      function update() {
        pathArcs
          .attr('d', path)
          .style('stroke', '#0000ff')
          .style('stroke-width', '2px')
          .transition()
          .duration(1500)
          .attrTween('stroke-dasharray', tweenDash);

        point.attr(
          'transform',
          d =>
            'translate(' +
            map.latLngToLayerPoint(d.latLng).x +
            ',' +
            map.latLngToLayerPoint(d.latLng).y +
            ')'
        );
        images.attr(
          'transform',
          d =>
            'translate(' +
            map.latLngToLayerPoint(d.latLng).x +
            ',' +
            map.latLngToLayerPoint(d.latLng).y +
            ')'
        );
      }
    });
  }
}
