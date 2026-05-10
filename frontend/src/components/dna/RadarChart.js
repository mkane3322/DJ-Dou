import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function RadarChart({ data = [], size = 320 }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data.length || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = 48;
    const radius = (size / 2) - margin;
    const center = size / 2;
    const levels = 5;
    const total = data.length;
    const angleSlice = (Math.PI * 2) / total;

    const rScale = d3.scaleLinear().range([0, radius]).domain([0, 1]);

    const g = svg
      .attr('width', size)
      .attr('height', size)
      .append('g')
      .attr('transform', `translate(${center},${center})`);

    // ── Grid circles ──────────────────────────────────────────────────────────
    const gridWrapper = g.append('g').attr('class', 'grid-wrapper');

    for (let level = 1; level <= levels; level++) {
      const r = (radius / levels) * level;
      gridWrapper.append('circle')
        .attr('r', r)
        .attr('fill', 'none')
        .attr('stroke', 'rgba(168,85,247,0.12)')
        .attr('stroke-width', 1);
    }

    // ── Axis lines ────────────────────────────────────────────────────────────
    const axisWrapper = g.append('g').attr('class', 'axis-wrapper');

    data.forEach((d, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const x = rScale(1) * Math.cos(angle);
      const y = rScale(1) * Math.sin(angle);

      axisWrapper.append('line')
        .attr('x1', 0).attr('y1', 0)
        .attr('x2', x).attr('y2', y)
        .attr('stroke', 'rgba(168,85,247,0.2)')
        .attr('stroke-width', 1);

      // Labels
      const labelR = radius + 24;
      const lx = labelR * Math.cos(angle);
      const ly = labelR * Math.sin(angle);

      axisWrapper.append('text')
        .attr('x', lx)
        .attr('y', ly)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#9d8fc4')
        .attr('font-size', '11px')
        .attr('font-family', "'Syne', sans-serif")
        .attr('font-weight', '600')
        .text(d.axis);
    });

    // ── Radar path ────────────────────────────────────────────────────────────
    const radarLine = d3.lineRadial()
      .radius((d) => rScale(d.value))
      .angle((d, i) => i * angleSlice)
      .curve(d3.curveLinearClosed);

    const blobWrapper = g.append('g').attr('class', 'blob-wrapper');

    // Glow filter
    const defs = svg.append('defs');
    const filter = defs.append('filter').attr('id', 'glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Filled polygon
    blobWrapper.append('path')
      .datum(data)
      .attr('d', radarLine)
      .attr('fill', 'rgba(168,85,247,0.18)')
      .attr('stroke', 'none');

    // Stroke polygon
    blobWrapper.append('path')
      .datum(data)
      .attr('d', radarLine)
      .attr('fill', 'none')
      .attr('stroke', '#a855f7')
      .attr('stroke-width', 2)
      .attr('filter', 'url(#glow)');

    // Data point dots
    data.forEach((d, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const x = rScale(d.value) * Math.cos(angle);
      const y = rScale(d.value) * Math.sin(angle);

      blobWrapper.append('circle')
        .attr('cx', x).attr('cy', y)
        .attr('r', 4)
        .attr('fill', '#a855f7')
        .attr('stroke', '#f1eeff')
        .attr('stroke-width', 1.5)
        .attr('filter', 'url(#glow)');
    });

  }, [data, size]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg ref={svgRef} />
    </div>
  );
}
