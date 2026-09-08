import getOptions from "./getOptions";
import Renderer from "./Renderer";
import Editor from "./Editor";

export default {
  type: "GAUGE",
  name: "Gauge",
  getOptions,
  Renderer,
  Editor,

  defaultColumns: 4,
  defaultRows: 5,
};
