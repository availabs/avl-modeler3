import React, { useMemo } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// import { Messages } from './modules/avl-components/src'
// import { Messages } from '~/modules/ams/src'

import Layout from "./layout/avail-layout";
import LayoutWrapper from "./layout/LayoutWrapper";
import Test from "./pages/test";
import TempComp from "./pages/temp";
import Home from "./pages/Home";
import { path } from "d3";
// import { getSubdomain }  from '~/utils'
// import Auth from './pages/auth/index.jsx'

import Routes from './routes'

// const Sites = {
//   www,
//   buildings,
//   countytemplate
// }


// const DefaultRoutes = [
//   {
//     path: "/",
//     component: () => <Home/>,
//   },
//   {
//     path: "/test1",
//     component: () => <Test/>,
//   },
//   {
//     path: "/test2",
//     component: () => <TempComp tempVar="new Temp"/>,
//   }
// ];

function App(props) {
  // const SUBDOMAIN = getSubdomain(window.location.host)

  // const site = useMemo(() => {
  //     return Sites?.[SUBDOMAIN] || Sites['www']
  // },[SUBDOMAIN])

  const WrappedRoutes =  useMemo(() => {
  
    return LayoutWrapper(Routes, Layout)
  }, [])

  // const SUBDOMAIN = getSubdomain(window.location.host)

  // const WrappedRoutes =  useMemo(() => {
  //   const Routes = [...DefaultRoutes];
  //   return LayoutWrapper(Routes, Layout)
  // }, [DefaultRoutes])

  console.log(WrappedRoutes);
  return (
    <>
      <RouterProvider router={createBrowserRouter(WrappedRoutes)} />
      {/* <Messages /> */}
    </>
  );
}

export default App;
