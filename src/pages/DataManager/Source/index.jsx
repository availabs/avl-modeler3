import React, { useEffect, useMemo, useState } from "react";
import {  TopNav, SideNav } from "../../../modules/avl-components/src";


import get from "lodash/get";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Pages, damaDataTypes } from "../DataTypes";

import SourcesLayout from "./layout";

import { SourceAttributes, ViewAttributes, getAttributes } from "../../../pages/DataManager/Source/attributes";
import { DamaContext } from "../../../pages/DataManager/store";
import baseUserViewAccess  from "../utils/authLevel";
import { NoMatch } from "../utils/404";


const Source = ({}) => {
  const { sourceId, page, viewId } = useParams()
  const [ pages, setPages] = useState( Pages || [])
  const [ activeViewId, setActiveViewId ] = useState(viewId)
  const { pgEnv, baseUrl, falcor, falcorCache, user } = React.useContext(DamaContext)
  // console.log('source page: ');
  const userAuthLevel = user.authLevel;

  const Page = useMemo(() => {
    return page
      ? get(pages, `[${page}].component`, pages["overview"].component)
      : pages["overview"].component;
  }, [page, pages]);

  useEffect(() => {
    async function fetchData() {
      //console.time("fetch data");
      const lengthPath = ["dama", pgEnv, "sources", "byId", sourceId, "views", "length"];
      const resp = await falcor.get(lengthPath);
      let data = await falcor.get(
        [
          "dama", pgEnv, "sources", "byId", sourceId, "views", "byIndex",
          { from: 0, to: get(resp.json, lengthPath, 0) - 1 },
          "attributes", Object.values(ViewAttributes)
        ],
        [
          "dama", pgEnv, "sources", "byId", sourceId,
          "attributes", Object.values(SourceAttributes)
        ],
        [
          "dama", pgEnv, "sources", "byId", sourceId, "meta"
        ]
      );
      //console.timeEnd("fetch data");
      //console.log(data)
      return data;
    }

    fetchData();
  }, [sourceId, falcor, pgEnv]);

  const views = useMemo(() => {
    return Object.values(get(falcorCache, ["dama", pgEnv, "sources", "byId", sourceId, "views", "byIndex"], {}))
      .map(v => getAttributes(get(falcorCache, v.value, { "attributes": {} })["attributes"]));
  }, [falcorCache, sourceId, pgEnv]);


  useEffect(() => {
    if(activeViewId && activeViewId !== viewId) {
      // if active view is set and we get new param
      // update active view id
      setActiveViewId(viewId)
    }

    if(!activeViewId && views.length > 0) {
        let authViews = views.filter(v => v?.metadata?.authoritative).length > 0 ?
          views.filter(v => v?.metadata?.authoritative) :
          views


        setActiveViewId(authViews.sort((a,b) => a._created_timestamp - b._created_timestamp)[0].view_id)

    }

  },[views, viewId]);

  const source = useMemo(() => {
    let attributes = getAttributes(get(falcorCache, ["dama", pgEnv, "sources", "byId", sourceId], { "attributes": {} })["attributes"]);
    if (damaDataTypes[attributes.type]) {

      // check for pages to add
      let typePages = Object.keys(damaDataTypes[attributes.type]).reduce((a, c) => {
        if (damaDataTypes[attributes.type][c].path || c === 'overview') {
          a[c] = damaDataTypes[attributes.type][c];
        }
        return a;
      }, {});

      let allPages = { ...Pages, ...typePages };
      setPages(allPages);
    } else {
      setPages(Pages);
    }
    return attributes;
  }, [falcorCache, sourceId, pgEnv]);

  const sourceAuthLevel = baseUserViewAccess(source?.statistics?.access || {});

  const [searchParams, setSearchParams] = useSearchParams();

  const makeUrl = React.useCallback(d => {
    const params = [];
    searchParams.forEach((value, key) => {
      params.push(`${ key }=${ value }`);
    })
    return `${baseUrl}/source/${sourceId}${d.path}${activeViewId && d.path ? '/'+activeViewId : ''}${ params.length ? `?${ params.join("&") }` : "" }`
  }, [baseUrl, sourceId, activeViewId, searchParams])
 
  if(sourceAuthLevel > userAuthLevel) {
    return  <NoMatch />
  } 

  return (
     
        <SourcesLayout baseUrl={baseUrl}>
          {/*<div className='flex w-full p-2 border-b items-center'>
            <div className="text-2xl text-gray-700 font-medium overflow-hidden ">
              {source.display_name || source.name}
            </div>
            <div className='flex-1'></div>
            <div className='py-2'>
              { user && user.authLevel >= 10 ?
                <Link
                  className={"bg-red-100 border border-red-200 shadow hover:bg-red-400 hover:text-white p-2"}
                  to={`${baseUrl}/delete/source/${source.source_id}/`}>
                    <i className='fad fa-trash' />
                </Link> : ''
              }
            </div>
          </div>*/}
          <TopNav
            menuItems={Object.values(pages)
              .filter(d => {
                const authLevel = d?.authLevel || -1
                const userAuth = user.authLevel || -1
                return !d.hidden && (authLevel <= userAuth)
              })
              .sort((a,b) => (a?.authLevel || -1)  - (b?.authLevel|| -1))
              .map(d => {
                return {
                  name:d.name,
                  path: makeUrl(d)
                }

              })}
            themeOptions={{ size: "inline" }}
          />
          <div className='w-full flex-1 bg-white shadow'>
            <Page
              searchParams={ searchParams }
              setSearchParams={ setSearchParams }
              source={source}
              views={views}
              user={user}
              baseUrl={baseUrl}
              activeViewId={activeViewId}
            />
          </div>
        </SourcesLayout>
      
    )
};


export default Source;
