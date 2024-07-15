import React, { useEffect, useContext , useMemo } from 'react'
import { MapContext } from '../MapComponent'
import cloneDeep from 'lodash/cloneDeep'
import get from 'lodash/get'
import set from 'lodash/set'
// import { getLayer } from './utils'
import { Plus, Close } from '../../icons'


import { CollectionAttributes, SymbologyAttributes, getAttributes } from "../../../../.././../../Collection/attributes"


let iconList = [
  'fad fa-wrench',
  'fad fa-train',
  'fad fa-subway',
  'fad fa-traffic-light',
  'fad fa-traffic-cone',
  'fad fa-ship',
  'fad fa-route',
  'fad fa-road',
  'fad fa-plane-alt',
  'fad fa-parking',
  'fad fa-map-signs',
  'fad fa-map-pin',
  'fad fa-map-marker',
  'fad fa-map-marker-alt',
  'fad fa-map',
  'fad fa-location-circle',
  'fad fa-location-arrow',
  'fad fa-location',
  'fad fa-info',
  'fad fa-info-circle',
  'fad fa-industry-alt',
  'fad fa-globe',
  'fad fa-directions',
  'fad fa-car',
  'fad fa-bicycle',
  'fad fa-layer-group'
]


function SymbologySelector ({index, tab}) {
  const { state, setState, falcor, falcorCache, pgEnv } = React.useContext(MapContext);
  // const { pgEnv, baseUrl, falcor, falcorCache } = React.useContext(DamaContext)

  const [collection, setCollection] = React.useState({
    add: false,
    collectionId: null,
    symbologyId: null
  })
  
  // ---------------------------------
  // -- get Collections to list
  // ---------------------------------
  useEffect(() => {
    async function fetchData() {
      // console.log('pgEnv', pgEnv)
      const lengthPath = ["dama", pgEnv, "collections", "length"];
      const resp = await falcor.get(lengthPath);
      // console.log('test',get(resp.json, lengthPath, 0) , resp)
      await falcor.get([
        "dama", pgEnv, "collections", "byIndex",
        { from: 0, to: get(resp.json, lengthPath, 0) - 1 },
        "attributes", Object.values(CollectionAttributes)
      ]);
    }
    fetchData();
  }, [falcor, pgEnv]);

  const collections = useMemo(() => {
    return Object.values(get(falcorCache, ["dama", pgEnv, "collections", "byIndex"], {}))
      .map(v => getAttributes(get(falcorCache, v.value, { "attributes": {} })["attributes"]));
  }, [falcorCache, pgEnv]);

  //----------------------------------
  // -- get selected collection symbologies
  // ---------------------------------
  useEffect(() => {
    async function fetchData() {
      //console.time("fetch data");
      const {collectionId} = collection
      const lengthPath = ["dama", pgEnv, "collections", "byId", collectionId, "symbologies", "length"];
      const resp = await falcor.get(lengthPath);
      return await falcor.get([
        "dama", pgEnv, "collections", "byId", collectionId, "symbologies", "byIndex",
        { from: 0, to: get(resp.json, lengthPath, 0) - 1 },
        "attributes", Object.values(SymbologyAttributes)
      ]);
    }
    if(collection.collectionId) {
      fetchData();
    }
  }, [collection.collectionId, falcor, pgEnv]);

  const symbologies = useMemo(() => {
    setCollection({...collection, symbologyId: null})
    // cobsole.log('get symbologies')
    return Object.values(get(falcorCache, ["dama", pgEnv, "collections", "byId", collection.collectionId, "symbologies", "byIndex"], {}))
      .map(v => getAttributes(get(falcorCache, v.value, { "attributes": {} })["attributes"]));
  }, [falcorCache, collection.collectionId, pgEnv]);


  const layers = useMemo(() => state.symbology?.layers || [], [state.symbology])

  const addLayer = () => {
    // console.log('newLayer', newLayer)
    const { symbologyId } = collection 
    setState(draft => {
      let newSymbology = cloneDeep(symbologies.filter(d => +d.symbology_id === +symbologyId)[0])
      newSymbology.isVisible = false;
      Object.keys(newSymbology.symbology.layers).forEach(layerId => {
        newSymbology.symbology.layers[layerId].layers.forEach((d,i) => {
          newSymbology.symbology.layers[layerId].layers[i].layout =  { "visibility": 'none' }
        })
      })

      draft.symbologies[''+symbologyId] = newSymbology
      // if(!draft?.tabs?.[+index]?.rows) {
      //   set(draft, `tabs[${index}].rows`, [])
      // }
      console.log('tabs', state.tabs, index, state.tabs[index])
      draft.tabs[index].rows = [...draft.tabs[index].rows, {
        type: 'symbology', 
        name: newSymbology.name,
        symbologyId: newSymbology.symbology_id 
      }]
      //set(draft, `symbology.layers[${layerId}]`,newLayer)
    })
    setCollection({ add: false, collectionId: null, symbologyId: null})
  }
  // console.log('symbologies', symbologies)

  return (
    <div className='relative'>
      <div className='w-[28px]  h-[28px] justify-center cursor-pointer rounded hover:bg-slate-100 flex items-center m-1' onClick={() => setCollection({...collection, add: !collection.add})}>
        {collection.add ? 
          <Close className='fill-slate-500' /> :
          <Plus className='fill-slate-500' />
        }
        {/*<i 
          className={`${collection.add ? 'fa fa-x' : 'fa fa-plus'} cursor-pointer text-slate-400 hover:text-slate-900 h-4 w-4 fa-fw  flex items-center justify-center rounded`}
        />*/}
      </div>
      {collection.add && <div className='absolute z-20 -left-[248px] p-2 top-[37px] border w-[280px] bg-white'>
        <div className='w-full p-1 text-sm font-bold text-blue-500'>select collection:</div>
        <select 
          onChange={(e) => setCollection({...collection, collectionId: e.target.value})}
          className='p-2 w-full bg-slate-100'>
          <option value={null}>---select collection---</option>
          {collections.map((collection) => (
            <option key={collection.collection_id} className='p-1 hover:bg-blue-100' value={collection.collection_id}>
              {collection.display_name || collection.name}
            </option>)
          )}
        </select>
        {collection.collectionId && 
          <>
            <div className='w-full p-1 text-sm font-bold text-blue-500'>select view:</div>
            <select 
              onChange={(e) => setCollection({...collection, symbologyId: e.target.value})}
              className='p-2 w-full bg-slate-100'>
              <option value={null}>---select view---</option>
              {symbologies.map((symbology) => (
                <option key={symbology.symbology_id} className='p-1 hover:bg-blue-100' value={symbology.symbology_id}>
                  {symbology.name || symbology.symbology_id}
                </option>)
              )}
            </select>
            <div className='w-full flex justify-end p-2'>
              <div 
                onClick={() => collection.symbologyId ? addLayer() : null}
                className={`${ collection.symbologyId ? 
                  'inline-flex w-32 justify-center rounded-lg cursor-pointer text-sm font-semibold py-1 px-1 bg-blue-600 text-white hover:bg-blue-500 shadow-lg border border-b-4 border-blue-800 hover:border-blue-700 add:border-b-2 add:mb-[2px] add:shadow-none':
                  'inline-flex w-32 justify-center rounded-lg cursor-not-allowed text-sm font-semibold py-1 px-1 bg-slate-300 text-white shadow border border-slate-400 border-b-4'
                }`}
              >
                <span className='flex items-center'>
                  <span className='pr-2'>add layer</span>
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
            </div>
          </>
        }
        </div> 
      }
    </div>
  )
}



export default SymbologySelector