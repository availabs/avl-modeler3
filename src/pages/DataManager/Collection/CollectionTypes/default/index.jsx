import Overview from "./Overview";
import Versions from "./Version/list";
//import SymbologyEditor from "./Symbology"
import MapEditor from "./MapEditor"

const Pages = {
  overview: {
    name: "Overview",
    path: "",
    component: Overview
  },
  mapeditor: {
    name: "Map Editor",
    path: "/mapeditor",
    fullWidth: true,
    hideBreadcrumbs: true,
    component: MapEditor,
  },
  versions: {
    name: "Versions",
    path: "/versions",
    hidden: "true",
    component: Versions
  }
};

export default Pages;
