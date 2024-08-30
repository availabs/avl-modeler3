import React, { useMemo } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// import { Messages } from './modules/avl-components/src'
// import { Messages } from '~/modules/ams/src'

import Layout from "./layout/avail-layout";
import LayoutWrapper from "./layout/LayoutWrapper";

import { path } from "d3";
// import { getSubdomain }  from '~/utils'

// import Auth from './sites/auth/index.jsx'


import DefaultRoutes from './routes';

// const Sites = {
//   www,
//   buildings,
//   countytemplate
// }



function App(props) {
 

  const WrappedRoutes =  useMemo(() => {
    const Routes = [...DefaultRoutes];
    return LayoutWrapper(Routes, Layout)
  }, [])

  console.log(WrappedRoutes);
  return (
    <>
      <RouterProvider router={createBrowserRouter(WrappedRoutes)} />
      {/* <Messages /> */}
    </>
  );
}

export default App;
