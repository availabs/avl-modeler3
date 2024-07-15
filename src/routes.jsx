import Home from "./pages/Home";
import ProjectCreate from "./pages/Project/Create";
import ProjectView from "./pages/Project/View";
import DamaRoutes from "./pages/DataManager"
import {useFalcor} from "./modules/avl-falcor";
// import { useFalcor } from "./modules/avl-components/src";
import {
   useAuth
  } from "./modules/ams/src"

import Auth from './pages/auth/index.jsx'
import NoMatch from "./pages/404";

const Routes = [
  Home, 
  ProjectCreate, 
  ProjectView, 
  // ...DamaRoutes({
  //           baseUrl:'/dama',
  //           defaultPgEnv : "kari",
  //           //.navSettings: authMenuConfig,
  //           useFalcor,
  //           //useAuth
  //         }),
  ...Auth, 
  NoMatch];



export default Routes;

// import Home from "pages/Home";

// import Auth from "pages/Auth";
// import NoMatch from "pages/404";

// const Routes = [Home, Auth, NoMatch];

// export default Routes;
