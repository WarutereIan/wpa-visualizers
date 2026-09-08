import { each, isFinite } from "lodash";
import React, { useEffect, useState } from "react";
import * as Plotly from "plotly.js";
import resizeObserver from "@/services/resizeObserver";
import { RendererPropTypes } from "@/visualizations/prop-types";
import { visualizationsSettings } from "@/visualizations/visualizationsSettings";

import "./renderer.less";

function prepareTreemapTrace(data: any, options: any) {
  const rows = data?.rows || [];
  const labels: any[] = [];
  const parents: any[] = [];
  const values: any[] = [];
  const colors: any[] = [];

  each(rows, (row) => {
    const label = options.labelsColName ? row[options.labelsColName] : null;
    if (label == null || label === "") {
      return;
    }

    labels.push(String(label));
    const parent = options.parentsColName ? row[options.parentsColName] : null;
    parents.push(parent == null || parent === "" ? "" : String(parent));

    if (options.valuesColName) {
      const value = Number(row[options.valuesColName]);
      values.push(isFinite(value) ? value : 0);
    }

    if (options.colorColName) {
      colors.push(row[options.colorColName]);
    }
  });

  const trace: any = {
    type: "treemap",
    labels,
    parents,
  };

  if (options.valuesColName) {
    trace.values = values;
  }

  if (options.colorColName) {
    trace.marker = { colors };
  }

  return [trace];
}

function prepareTreemapLayout(container: any) {
  return {
    autosize: true,
    margin: { l: 10, r: 10, t: 10, b: 10 },
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    width: Math.max(5, Math.floor(container.offsetWidth || 0)),
    height: Math.max(5, Math.floor(container.offsetHeight || 0)),
  };
}

export default function Renderer({ data, options }: any) {
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
      prepareTreemapTrace(data, options),
      prepareTreemapLayout(container),
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
  }, [container, data, options]);

  // @ts-expect-error ts-migrate(2322) FIXME: Type 'Dispatch<SetStateAction<null>>' is not assig... Remove this comment to see the full error message
  return <div className="treemap-visualization-container" ref={setContainer} />;
}

Renderer.propTypes = RendererPropTypes;
