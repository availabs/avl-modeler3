import React, { useEffect, useMemo, useState } from "react";
import {  TopNav, SideNav } from "../../../modules/avl-components/src";


import get from "lodash/get";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Pages as CollectionPages, damaCollectionTypes } from "./CollectionTypes";

import CollectionsLayout from "../Source/layout";

import { CollectionAttributes, SymbologyAttributes, getAttributes } from "../../../pages/DataManager/Collection/attributes";
import { DamaContext } from "../../../pages/DataManager/store";
import baseUserViewAccess  from "../utils/authLevel";
import { NoMatch } from "../utils/404";


const Collection = ({}) => {
  const { collectionId, page, symbologyId } = useParams()
  const [ pages, setPages] = useState( CollectionPages || [])
  const [ activeSymbologyId, setActiveSymbologyId ] = useState(symbologyId)
  const { pgEnv, baseUrl, falcor, falcorCache, user } = React.useContext(DamaContext)

  const userAuthLevel = user.authLevel;

  const Page = useMemo(() => {
    return page
      ? get(pages, `[${page}].component`, pages["overview"].component)
      : pages["overview"].component;
  }, [page, pages]);

  const fullWidth = useMemo(() => {
    return page ? get(pages, `[${page}].fullWidth`, false) : false
  }, [page, pages]);

  const hideBreadcrumbs = useMemo(() => {
    return page ? get(pages, `[${page}].hideBreadcrumbs`, false) : false
  }, [page, pages]);


  
  useEffect(() => {
    async function fetchData() {
      const lengthPath = ["dama", pgEnv, "collections", "byId", collectionId, "symbologies", "length"];
      const resp = await falcor.get(lengthPath);

      let data = await falcor.get(
        [
          "dama", pgEnv, "collections", "byId", collectionId, "symbologies", "byIndex",
          { from: 0, to: get(resp.json, lengthPath, 0) - 1 },
          "attributes", Object.values(SymbologyAttributes)
        ],
        [
          "dama", pgEnv, "collections", "byId", collectionId,
          "attributes", Object.values(CollectionAttributes)
        ],
        [
          "dama", pgEnv, "collections", "byId", collectionId, "meta"
        ]
      );
      return data;
    }

    fetchData();
  }, [collectionId, falcor, pgEnv]);

  const symbologyIds = useMemo(() => {
    return  Object.keys(get(falcorCache, ["dama", pgEnv, "symbologies", "byId"], {}));
  }, [falcorCache, collectionId, pgEnv]);

  useEffect(() => {
    async function fetchSymbologyData() {
      // console.log('fetchSymbologyData ids', symbologyIds)
      const symbologyPath = ["dama", pgEnv, "symbologies", "byId", symbologyIds.filter(d => d && d !== 'undefined') , "attributes", Object.values(SymbologyAttributes)];
      await falcor.get(symbologyPath);
    };

    if(symbologyIds?.filter(d => d && d !== 'undefined')?.length){
      fetchSymbologyData();
    }

  }, [symbologyIds, collectionId, pgEnv])

  const symbologies = useMemo(() => {
    const cacheSymbologies = (get(falcorCache, ["dama", pgEnv, "symbologies", "byId"], {}))
    // console.log('Collections updating symbologies', cacheSymbologies, falcorCache)
    return Object.values(cacheSymbologies)
      .map((v) => {
        // if symbology is created by call it returns in value
        let curVal = v.attributes?.value ? v.attributes?.value : v.attributes
        const newVal = { ...curVal};
        Object.keys(v.attributes).forEach((key) => {
          newVal[key] = v.attributes[key]?.value || v.attributes[key];
        });
        return newVal;
      })
      .filter((symb) => symb.collection_id === parseInt(collectionId));
  }, [falcorCache, collectionId, pgEnv]);

  useEffect(() => {
    if(activeSymbologyId && activeSymbologyId !== symbologyId) {
      // if active view is set and we get new param
      // update active view id
      setActiveSymbologyId(symbologyId)
    }

    if(!activeSymbologyId && symbologies.length > 0) {
      let authViews = symbologies.filter(v => v?.metadata?.authoritative).length > 0 ?
          symbologies.filter(v => v?.metadata?.authoritative) :
          symbologies;

      setActiveSymbologyId(authViews.sort((a,b) => a._created_timestamp - b._created_timestamp)[0].symbology_id)
    }
  },[symbologies, symbologyId]);

  const collection = useMemo(() => {
    let attributes = getAttributes(get(falcorCache, ["dama", pgEnv, "collections", "byId", collectionId], { "attributes": {} })["attributes"]);
    if (damaCollectionTypes[attributes.type]) {

      // check for pages to add
      let typePages = Object.keys(damaCollectionTypes[attributes.type]).reduce((a, c) => {
        if (damaCollectionTypes[attributes.type][c].path || c === 'overview') {
          a[c] = damaCollectionTypes[attributes.type][c];
        }
        return a;
      }, {});
      let allPages = { ...CollectionPages, ...typePages };
      setPages(allPages);
    } else {
      setPages(CollectionPages);
    }
    return attributes;
  }, [falcorCache, collectionId, pgEnv]);

  const collectionAuthLevel = baseUserViewAccess(collection?.statistics?.access || {});

  const [searchParams, setSearchParams] = useSearchParams();

  const makeUrl = React.useCallback(d => {
    const params = [];
    searchParams.forEach((value, key) => {
      params.push(`${ key }=${ value }`);
    })
    return `${baseUrl}/collection/${collectionId}${d.path}${activeSymbologyId && d.path ? '/'+activeSymbologyId : ''}${ params.length ? `?${ params.join("&") }` : "" }`
  }, [baseUrl, collectionId, activeSymbologyId, searchParams])
 
  if(collectionAuthLevel > userAuthLevel) {
    return  <NoMatch />
  } 

  return (
      <CollectionsLayout 
        baseUrl={baseUrl} 
        fullWidth={fullWidth} 
        hideBreadcrumbs={hideBreadcrumbs}
      >
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
            collection={collection}
            symbologies={symbologies}
            user={user}
            baseUrl={baseUrl}
            activeSymbologyId={activeSymbologyId}
          />
        </div>
      </CollectionsLayout>
    )
};


export default Collection;
