import PlotlyUMD from 'plotly.js/dist/plotly.min.js'

const Plotly = (PlotlyUMD as { default?: unknown } | undefined)?.default ?? PlotlyUMD
export default Plotly
