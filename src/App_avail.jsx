import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { dmsPageFactory, registerDataType } from "./modules/dms/src"

import pageConfig from './modules/dms/src/patterns/page/siteConfig'
import Selector, { registerComponents } from "./modules/dms/src/patterns/page/selector"



registerDataType("selector", Selector)

const siteCMS = { 
  ...dmsPageFactory(
    pageConfig({ app: "dms-docs", type: "main", baseUrl: ""}
  ), "/")
}

function App() {
  return (
    <>
    {/* <div>
      <>Test run successful</>
     </div> */}
    <RouterProvider router={createBrowserRouter([siteCMS])} />
    </>
  )
}


export default App
