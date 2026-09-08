import getOptions from "./getOptions";
import Renderer from "./Renderer";
import Editor from "./Editor";

export default {
  type: "TREEMAP",
  name: "Treemap",
  getOptions,
  Renderer,
  Editor,

  defaultRows: 10,
};
