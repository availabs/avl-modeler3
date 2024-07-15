import React from "react";

import { DataManagerHeader, Header } from "./Source/layout";
import SourceList from "./Source/list";
import SourceView from "./Source";
import SourceCreate from "./Source/create";
import SourceDelete from "./Source/delete";

import CollectionList from "./Collection/list";
import CollectionView from "./Collection";
import CollectionCreate from "./Collection/create";
import CollectionDelete from "./Collection/delete";

import TasksComponent from "./Tasks";
import TaskPageComponent from "./Tasks/TaskPage";


import { registerDataType } from './DataTypes'

import { DamaContext } from "./store"

import DamaMap from './Collection/CollectionTypes/default/MapEditor/components/dms/MapComponent'

const DAMA_Wrapper = (Component, DAMA_ARGS) => {

  const {
    baseUrl = "/datasources",
    defaultPgEnv = "pan",
    useFalcor,
    useAuth
  } = DAMA_ARGS;
  const { falcor, falcorCache } = useFalcor();
  const user = {}//useAuth();


  return () => {
    return (
      <DamaContext.Provider value={ { pgEnv: defaultPgEnv, baseUrl, falcor, falcorCache, user } }>
        <Component />
      </DamaContext.Provider>
    )
  }
}

const DamaRoutes = DAMA_ARGS => {

  const {
    baseUrl = "/datasources", // old position 0 arg
    defaultPgEnv = "pan",     // old position 1 arg
    authLevel = -1,             // old position 2 arg,
    components = {},
    dataTypes = {},
    navSettings = {},
    useFalcor,
    useAuth
  } = DAMA_ARGS;

  const {
    Head = DataManagerHeader,
    List = SourceList,
    View = SourceView,
    Create =SourceCreate,
    Del = SourceDelete
  } = components

  const {
    sideNav = { size: "none"},
    topNav = { size: "none" }
  } = navSettings

  // register custom dataTypes for project
  Object.keys(dataTypes).forEach(type => registerDataType(type, dataTypes[type]));

  
  return [
    /**
     * SOURCES
     */
    // Source List (Filtered)
    {
      name: "Data Sources",
      path: `${baseUrl}/`,
      exact: true,
      authLevel,
      mainNav: false,
      Title: () => <Header baseUrl={baseUrl}/>,
      sideNav,
      topNav,
      Component: DAMA_Wrapper(List, DAMA_ARGS)
    },
    {
      name: "Data Sources",
      path: `${baseUrl}/cat/:cat1`,
      exact: true,
      authLevel,
      mainNav: false,
      Title: () => <Header baseUrl={baseUrl}/>,
      sideNav,
      topNav,
      component:  DAMA_Wrapper(List, DAMA_ARGS)
    },
    {
      name: "Data Sources",
      path: `${baseUrl}/cat/:cat1/:cat2`,
      exact: true,
      authLevel,
      mainNav: false,
      Title: () => <Header baseUrl={baseUrl}/>,
      sideNav,
      topNav,
      component:  DAMA_Wrapper(List, DAMA_ARGS)
    },
      // Source List (Full)
    {
      name: "Data Sources",
      path: `${baseUrl}/listall`,
      exact: true,
      authLevel,
      mainNav: false,
      Title: () => <Header baseUrl={baseUrl}/>,
      sideNav,
      topNav,
      component:  DAMA_Wrapper(List, DAMA_ARGS)
    },
    {
      name: "Data Sources",
      path: `${baseUrl}/listall/cat/:cat1`,
      exact: true,
      authLevel,
      mainNav: false,
      Title: () => <Header baseUrl={baseUrl}/>,
      sideNav,
      topNav,
      component:  DAMA_Wrapper(List, DAMA_ARGS)
    },
    {
      name: "Data Sources",
      path: `${baseUrl}/listall/cat/:cat1/:cat2`,
      exact: true,
      authLevel,
      mainNav: false,
      Title: () => <Header baseUrl={baseUrl}/>,
      sideNav,
      topNav,
      component:  DAMA_Wrapper(List, DAMA_ARGS)
    },
    // -- Source View
    {
      name: "View Source",
      path: `${baseUrl}/source/:sourceId`,
      exact: true,
      authLevel,
      mainNav: false,
      Title: () => <Header baseUrl={baseUrl}/>,
      sideNav,
      topNav,
      component:  DAMA_Wrapper(View, DAMA_ARGS)
    },
    {
      name: "View Source",
      path: `${baseUrl}/source/:sourceId/:page`,
      exact: true,
      authLevel,
      mainNav: false,
      Title: () => <Header baseUrl={baseUrl}/>,
      sideNav,
      topNav,
      component:  DAMA_Wrapper(View, DAMA_ARGS)
    }, {
      name: "View Source",
      path: `${baseUrl}/source/:sourceId/:page/:viewId`,
      exact: true,
      authLevel,
      mainNav: false,
      Title: () => <Header baseUrl={baseUrl}/>,
      sideNav,
      topNav,
      component:  DAMA_Wrapper(View, DAMA_ARGS)
    }, {
      name: "View Source",
      path: `${baseUrl}/source/:sourceId/:page/:viewId/:vPage`,
      exact: true,
      authLevel,
      mainNav: false,
      Title: () => <Header baseUrl={baseUrl}/>,
      sideNav,
      topNav,
      component:  DAMA_Wrapper(View, DAMA_ARGS)
    },
    // Source Create
    {
      name: "Create Source",
      path: `${baseUrl}/create/source`,
      exact: true,
      authLevel: false,
      mainNav: false,
      Title: () => <Header baseUrl={baseUrl}/>,
      sideNav,
      topNav,
      component:  DAMA_Wrapper(Create, DAMA_ARGS)
    },
    // Source Delete
    {
      name: "Delete Source",
      path: `${baseUrl}/delete/source/:sourceId`,
      exact: true,
      authLevel: true,
      mainNav: false,
      Title: () => <Header baseUrl={baseUrl}/>,
      sideNav,
      topNav,
      component:  DAMA_Wrapper(Del, DAMA_ARGS)
    },
    /**
     * COLLECTIONS
     */
    // Collection List
    {
      name: "Data Collections",
      path: `${baseUrl}/collections`,
      exact: true,
      authLevel,
      mainNav: false,
      Title: () => <Header baseUrl={baseUrl}/>,
      sideNav,
      topNav,
      component:  DAMA_Wrapper(CollectionList, DAMA_ARGS)
    },
    {
      name: "Data Collections",
      path: `${baseUrl}/collections/cat/:cat1`,
      exact: true,
      authLevel,
      mainNav: false,
      Title: () => <Header baseUrl={baseUrl}/>,
      sideNav,
      topNav,
      component: DAMA_Wrapper(CollectionList, DAMA_ARGS)
    },
    {
      name: "Data Collections",
      path: `${baseUrl}/collections/cat/:cat1/:cat2`,
      exact: true,
      authLevel,
      mainNav: false,
      Title: () => <Header baseUrl={baseUrl}/>,
      sideNav,
      topNav,
      component: DAMA_Wrapper(CollectionList, DAMA_ARGS)
    },
    // -- Collection View
    {
      name: "View Collection",
      path: `${baseUrl}/collection/:collectionId`,
      exact: true,
      authLevel,
      mainNav: false,
      Title: () => <Header baseUrl={baseUrl}/>,
      sideNav,
      topNav,
      component: DAMA_Wrapper(CollectionView, DAMA_ARGS)
    },
    {
      name: "View Collection",
      path: `${baseUrl}/collection/:collectionId/:page`,
      exact: true,
      authLevel,
      mainNav: false,
      Title: () => <Header baseUrl={baseUrl}/>,
      sideNav,
      topNav,
      component: DAMA_Wrapper(CollectionView, DAMA_ARGS)
    },
    {
      name: "View Symbology",
      path: `${baseUrl}/collection/:collectionId/:page/:symbologyId`,
      exact: true,
      authLevel,
      mainNav: false,
      Title: () => <Header baseUrl={baseUrl}/>,
      sideNav,
      topNav,
      component: DAMA_Wrapper(CollectionView, DAMA_ARGS)
    },
    {
      name: "View Symbology",
      path: `${baseUrl}/collection/:collectionId/:page/:symbologyId/:sPage`,
      exact: true,
      authLevel,
      mainNav: false,
      Title: () => <Header baseUrl={baseUrl}/>,
      sideNav,
      topNav,
      component: DAMA_Wrapper(CollectionView, DAMA_ARGS)
    },
    // Collection Create
    {
      name: "Create Collection",
      path: `${baseUrl}/create/collection`,
      exact: true,
      authLevel: false,
      mainNav: false,
      Title: () => <Header baseUrl={baseUrl}/>,
      sideNav,
      topNav,
      component: DAMA_Wrapper(CollectionCreate, DAMA_ARGS)
    },
    // Collection Delete
    {
      name: "Delete Collection",
      path: `${baseUrl}/delete/collection/:collectionId`,
      exact: true,
      authLevel: true,
      mainNav: false,
      Title: () => <Header baseUrl={baseUrl}/>,
      sideNav,
      topNav,
      component: DAMA_Wrapper(CollectionDelete, DAMA_ARGS)
    },
    { name: "Tasks",
      path: `${ baseUrl }/tasks`,
      exact: true,
      authLevel,
      mainNav: false,
      Title: () => <Header baseUrl={baseUrl}/>,
      sideNav,
      topNav,
      component: DAMA_Wrapper(TasksComponent, DAMA_ARGS)
    },
    { name: "Task",
      path: `${ baseUrl }/task/:etl_context_id`,
      exact: true,
      authLevel,
      mainNav: false,
      Title: () => <Header baseUrl={baseUrl}/>,
      sideNav,
      topNav,
      component: DAMA_Wrapper(TaskPageComponent, DAMA_ARGS)
    }
  ];
};


export default DamaRoutes;


export {
  DamaMap
}