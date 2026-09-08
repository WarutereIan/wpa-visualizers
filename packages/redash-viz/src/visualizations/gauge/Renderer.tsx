import { isFinite, map } from "lodash";
import React, { useEffect, useState } from "react";
import * as Plotly from "plotly.js";
import resizeObserver from "@/services/resizeObserver";
import { RendererPropTypes } from "@/visualizations/prop-types";
import { visualizationsSettings } from "@/visualizations/visualizationsSettings";

import "./renderer.less";

function getRowNumber(index: any, rowsCount: any) {
  index = parseInt(index, 10) || 0;
  if (index === 0) {
    return index;
  }
  const wrappedIndex = (Math.abs(index) - 1) % rowsCount;
  return index > 0 ? wrappedIndex : rowsCount - wrappedIndex - 1;
}

function readNumericValue(rows: any[], colName: any, rowNumber: any) {
  if (!rows.length || !colName) {
    return null;
  }
  const row = rows[getRowNumber(rowNumber, rows.length)];
  if (!row) {
    return null;
  }
  const value = Number(row[colName]);
  return isFinite(value) ? value : null;
}

function prepareGaugeTrace(data: any, options: any, visualizationName: any) {
  const rows = data?.rows || [];
  const value = readNumericValue(rows, options.counterColName, options.rowNumber);
  let deltaReference = null;
  if (options.deltaColName) {
    deltaReference = readNumericValue(rows, options.deltaColName, options.rowNumber);
  } else if (options.deltaReference != null && isFinite(Number(options.deltaReference))) {
    deltaReference = Number(options.deltaReference);
  }

  const hasDelta = isFinite(deltaReference);
  const steps = map(options.thresholds || [], (threshold: any) => ({
    range: threshold.range,
    color: threshold.color,
  }));

  const trace: any = {
    type: "indicator",
    mode: hasDelta ? "gauge+number+delta" : "gauge+number",
    value: isFinite(value) ? value : 0,
    title: { text: visualizationName || "" },
    gauge: {
      axis: { range: [options.min, options.max] },
      steps,
    },
  };

  if (hasDelta) {
    trace.delta = { reference: deltaReference };
  }

  return [trace];
}

function prepareGaugeLayout(container: any) {
  return {
    autosize: true,
    margin: { l: 40, r: 40, t: 50, b: 20 },
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    width: Math.max(5, Math.floor(container.offsetWidth || 0)),
    height: Math.max(5, Math.floor(container.offsetHeight || 0)),
  };
}

export default function Renderer({ data, options, visualizationName }: any) {
  const [container, setContainer] = useState(null);

  useEffect(() => {
    if (!container) {
      return;
    }

    let isDestroyed = false;
    const plotlyOptions: any = {
      showLink: false,
      displaylogo: false,
      responsive: true,
    };
    if (visualizationsSettings.hidePlotlyModeBar) {
      plotlyOptions.displayModeBar = false;
    }

    Plotly.newPlot(
      container,
      prepareGaugeTrace(data, options, visualizationName),
      prepareGaugeLayout(container),
      plotlyOptions
    );

    const unwatch = resizeObserver(container, () => {
      if (!isDestroyed) {
        Plotly.Plots.resize(container);
      }
    });

    return () => {
      isDestroyed = true;
      unwatch();
      Plotly.purge(container);
    };
  }, [container, data, options, visualizationName]);

  // @ts-expect-error ts-migrate(2322) FIXME: Type 'Dispatch<SetStateAction<null>>' is not assig... Remove this comment to see the full error message
  return <div className="gauge-visualization-container" ref={setContainer} />;
}

Renderer.propTypes = RendererPropTypes;
