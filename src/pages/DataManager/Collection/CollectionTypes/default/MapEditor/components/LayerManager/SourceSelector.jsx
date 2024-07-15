import React, { useEffect, useContext , useMemo } from 'react'
import {SymbologyContext} from '../../'
import { DamaContext } from "../../../../../../store";
import get from 'lodash/get'
import set from 'lodash/set'
import { getLayer } from './utils'
import { Plus, Close } from '../icons'


import { SourceAttributes, ViewAttributes, getAttributes } from "../../../../../../Source/attributes"

function SourceSelector (props) {
  const { state, setState  } = React.useContext(SymbologyContext);
  const {pgEnv, baseUrl, falcor, falcorCache} = React.useContext(DamaContext)

  const [source, setSource] = React.useState({
    active: false,
    sourceId: null,
    viewId: null
  })
  
  // ---------------------------------
  // -- get sources to list
  // ---------------------------------
  useEffect(() => {
    async function fetchData() {
      const lengthPath = ["dama", pgEnv, "sources", "length"];
      const resp = await falcor.get(lengthPath);
      await falcor.get([
        "dama", pgEnv, "sources", "byIndex",
        { from: 0, to: get(resp.json, lengthPath, 0) - 1 },
        "attributes", Object.values(SourceAttributes)
      ]);
    }
    fetchData();
  }, [falcor, pgEnv]);

  const sources = useMemo(() => {
    return Object.values(get(falcorCache, ["dama", pgEnv, "sources", "byIndex"], {}))
      .map(v => getAttributes(get(falcorCache, v.value, { "attributes": {} })["attributes"]));
  }, [falcorCache, pgEnv]);

  //----------------------------------
  // -- get selected source views
  // ---------------------------------
  useEffect(() => {
    async function fetchData() {
      //console.time("fetch data");
      const {sourceId} = source
      const lengthPath = ["dama", pgEnv, "sources", "byId", sourceId, "views", "length"];
      const resp = await falcor.get(lengthPath);
      return await falcor.get([
        "dama", pgEnv, "sources", "byId", sourceId, "views", "byIndex",
        { from: 0, to: get(resp.json, lengthPath, 0) - 1 },
        "attributes", Object.values(ViewAttributes)
      ]);
    }
    if(source.sourceId) {
      fetchData();
    }
  }, [source.sourceId, falcor, pgEnv]);

  const views = useMemo(() => {
    setSource({...source, viewId: null})
    // cobsole.log('get views')
    return Object.values(get(falcorCache, ["dama", pgEnv, "sources", "byId", source.sourceId, "views", "byIndex"], {}))
      .map(v => getAttributes(get(falcorCache, v.value, { "attributes": {} })["attributes"]));
  }, [falcorCache, source.sourceId, pgEnv]);


  const layers = useMemo(() => state.symbology?.layers || [], [state.symbology])

  const addLayer = () => {
    const newSource = sources.filter(d => d.source_id === +source.sourceId)?.[0] || {}
    const view = views.filter(d => d.view_id === +source.viewId)?.[0] || {}

    const layerId = Math.random().toString(36).replace(/[^a-z]+/g, '')
    const viewLayer = view?.metadata?.tiles?.layers?.[0]
    // console.log('newSource', newSource)
    //--------------------------------------------
    // Format for adding a layer
    // -------------------------------------------
    const newLayer = {
      // generated unique Id 
      id: layerId,
      // meta data
      name: `${newSource.display_name || newSource.name} ${view.version || view.view_id}`,
      // isDynamic: true,
      source_id: newSource.source_id,
      view_id: source.viewId,
      "layer-type": 'simple',
      type: viewLayer.type,
      // mapbox sources and layers
      sources: (view?.metadata?.tiles?.sources || []).map(s => {
        s.id = `${s.id}_${layerId}`
        return s
      }),
      layers: getLayer(layerId, viewLayer),
      // state data about the layer on the map
      isVisible: true,
      order: Object.keys(state?.symbology?.layers || {})?.length || 0
    }

    //console.log('newLayer', newLayer)
    setState(draft => {
      if(!draft?.symbology){
        draft.symbology = { }
      }
      if(!draft?.symbology?.layers) {
        draft.symbology.layers = {}
      }
      set(draft, `symbology.layers[${layerId}]`,newLayer)
    })
    setSource({ add: false, sourceId: null, viewId: null})
  }

  return (
    <div className='relative'>
      <div className='p-1 rounded hover:bg-slate-100 m-1' onClick={() => setSource({...source, add: !source.add})}>
        {source.add ? 
          <Close className='fill-slate-500' /> :
          <Plus className='fill-slate-500' />
        }
        {/*<i 
          className={`${source.add ? 'fa fa-x' : 'fa fa-plus'} cursor-pointer text-slate-400 hover:text-slate-900 h-4 w-4 fa-fw  flex items-center justify-center rounded`}
          
        />*/}
      </div>
      {source.add && <div className='absolute z-20 -left-[244px] p-2 top-[37px] border w-[280px] bg-white'>
        <div className='w-full p-1 text-sm font-bold text-blue-500'>select source:</div>
        <select 
          onChange={(e) => setSource({...source, sourceId: e.target.value})}
          className='p-2 w-full bg-slate-100'>
          <option value={null}>---select source---</option>
          {sources.map((source) => (
            <option key={source.source_id} className='p-1 hover:bg-blue-100' value={source.source_id}>
              {source.display_name || source.name}
            </option>)
          )}
        </select>
        {source.sourceId && 
          <>
            <div className='w-full p-1 text-sm font-bold text-blue-500'>select view:</div>
            <select 
              onChange={(e) => setSource({...source, viewId: e.target.value})}
              className='p-2 w-full bg-slate-100'>
              <option value={null}>---select view---</option>
              {views.map((view) => (
                <option key={view.view_id} className='p-1 hover:bg-blue-100' value={view.view_id}>
                  {view.version || view.view_id}
                </option>)
              )}
            </select>
            <div className='w-full flex justify-end p-2'>
              <div 
                onClick={() => source.viewId ? addLayer() : null}
                className={`${ source.viewId ? 
                  'inline-flex w-32 justify-center rounded-lg cursor-pointer text-sm font-semibold py-1 px-1 bg-blue-600 text-white hover:bg-blue-500 shadow-lg border border-b-4 border-blue-800 hover:border-blue-700 active:border-b-2 active:mb-[2px] active:shadow-none':
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



export default SourceSelector