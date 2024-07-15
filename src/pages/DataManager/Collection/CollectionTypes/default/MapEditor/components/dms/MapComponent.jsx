import React, {useEffect, useMemo, useRef, createContext} from "react";
import get from "lodash/get";
import isEqual from "lodash/isEqual"
import { AvlMap } from "../../../../../../../../modules/avl-map-2/src"
import { PMTilesProtocol } from '../../../../../../../../pages/DataManager/utils/pmtiles/index.js'
import { useImmer } from 'use-immer';
import MapManager from './MapManager/MapManager'
import LegendPanel from './LegendPanel/LegendPanel'
import SymbologyViewLayer from '../SymbologyViewLayer'

//import { CMSContext } from "../../../../../../../../modules/dms/src/patterns/page/siteConfig";
const CMSContext = {} 
const isJson = (str)  => {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

export const MapContext = createContext(undefined);

const getData = async () => {
    return {}
}

const Edit = ({value, onChange, size}) => {
    // const {falcor, falcorCache} = useFalcor();
    const { falcor, falcorCache, pgEnv } = React.useContext(CMSContext)
    const mounted = useRef(false);
    const cachedData = typeof value === 'object' ? value : value && isJson(value) ? JSON.parse(value) : {};
    const [state,setState] = useImmer({
        tabs: cachedData.tabs || [{"name": "Layers", rows: []}],
        symbologies: cachedData.symbologies || {},
        isEdit: true
    })
    const [mapLayers, setMapLayers] = useImmer([])

    useEffect(() => {
        async function updateData() {
            //console.log('update data',state)
            onChange(state)
        }

        if(!isEqual(state, value)) {
          updateData()
        }
    },[state])

    useEffect(() => {
        // -----------------------
        // Update map layers on map
        // when state.symbology.layers update
        // -----------------------

        // console.log('symbology layers effect')
        const updateLayers = async () => {
            if(mounted.current) {
                
                let allLayers = (Object.values(state.symbologies).reduce((out,curr) => {
                    let ids = out.map(d => d.id)
                    let newValues = Object.keys(curr?.symbology?.layers)
                        .reduce((layerOut, layerKey) => {
                            if( !ids.includes(layerKey) ) {
                                layerOut[layerKey] = curr?.symbology?.layers[layerKey]
                            }
                            return layerOut
                        },{})
                        
                    return [...out,  ...Object.values(newValues)]
                    
                },[]))
                // console.log('allLayers', allLayers.length, mapLayers.length)
                //if(mapLayers.length === 0) {
                    setMapLayers(draftMapLayers => {

                        let currentLayerIds = draftMapLayers.map(d => d.id).filter(d => d)
                  
                        // let allLayers = (Object.values(state.symbologies).reduce((out,curr) => {
                        //     return [...out, ...Object.values(curr?.symbology?.layers || {})]
                        // },[]))

                        //console.log('allLayers', allLayers)
                        let newLayers = allLayers
                          .filter(d => d)
                          .filter(d => !currentLayerIds.includes(d.id))
                          .sort((a,b) => b.order - a.order)
                          .map(l => {
                            return new SymbologyViewLayer(l)
                          })

                        const oldIds = allLayers.map(d => d.id)
                        //console.log('old ids', oldIds)
                        let oldLayers = draftMapLayers.filter(d => {
                            //console.log(d.id)
                            return oldIds.includes(d.id)
                        })
                        
                        const out = [
                            // keep existing layers & filter
                            ...oldLayers, 
                            // add new layers
                            ...newLayers
                        ].sort((a,b) => b.order - a.order)
                        // console.log('update layers old:', oldLayers, 'new:', newLayers, 'out', out)
                        return out
                    })
                //}
            }
        }
        updateLayers()
    }, [state.symbologies])

    const layerProps = useMemo(() =>  {
        return Object.values(state.symbologies).reduce((out,curr) => {
            return {...out, ...(curr?.symbology?.layers || {})}
        },{}) 
    }, [state?.symbologies]);

  

    return (
        <MapContext.Provider value={{state, setState, falcor, falcorCache, pgEnv}}>
            <div id='dama_map_edit' className="w-full relative" style={{height:'calc(100vh - 51px)'}} ref={mounted}>
                <AvlMap
                  layers={ mapLayers }
                  layerProps = { layerProps }
                  hideLoading={true}
                  showLayerSelect={true}
                  mapOptions={{
                    center: [-76, 43.3],
                    zoom: 6,
                    protocols: [PMTilesProtocol],
                    styles: defaultStyles
                  }}
                  leftSidebar={ false }
                  rightSidebar={ false }
                />
                <div className={'absolute inset-0 flex pointer-events-none'}>
                    <div className=''><MapManager /></div>
                    <div className='flex-1'/>
                    <div className=''><LegendPanel /></div>
                </div>
            </div>
        </MapContext.Provider>
    )
}

Edit.settings = {
    hasControls: false,
    name: 'ElementEdit'
}

const View = ({value, size}) => {
    console.log('Dama Map: View')
    // const {falcor, falcorCache} = useFalcor();
    const { falcor, falcorCache, pgEnv } = React.useContext(CMSContext)
    const mounted = useRef(false);
    const cachedData = typeof value === 'object' ? value : value && isJson(value) ? JSON.parse(value) : {};
    console.log('cachedData', cachedData, value)
    const [state,setState] = useImmer({
        tabs: cachedData.tabs || [{"name": "Layers", rows: []}],
        symbologies: cachedData.symbologies || [],
    })
    const [mapLayers, setMapLayers] = useImmer([])


    console.log('render map component view', state)
    useEffect(() => {
        // -----------------------
        // Update map layers on map
        // when state.symbology.layers update
        // -----------------------
        const updateLayers = async () => {
            if(mounted.current) {
                
                let allLayers = (Object.values(state.symbologies).reduce((out,curr) => {
                    let ids = out.map(d => d.id)
                    let newValues = Object.keys(curr?.symbology?.layers)
                        .reduce((layerOut, layerKey) => {
                            if( !ids.includes(layerKey) ) {
                                layerOut[layerKey] = curr?.symbology?.layers[layerKey]
                            }
                            return layerOut
                        },{})
                        
                    return [...out,  ...Object.values(newValues)]
                    
                },[]))
                //if(mapLayers.length === 0) {
                    setMapLayers(draftMapLayers => {

                        let currentLayerIds = draftMapLayers.map(d => d.id).filter(d => d)
                  
                        // let allLayers = (Object.values(state.symbologies).reduce((out,curr) => {
                        //     return [...out, ...Object.values(curr?.symbology?.layers || {})]
                        // },[]))

                        //console.log('allLayers', allLayers)
                        let newLayers = allLayers
                          .filter(d => d)
                          .filter(d => !currentLayerIds.includes(d.id))
                          .sort((a,b) => b.order - a.order)
                          .map(l => {
                            return new SymbologyViewLayer(l)
                          })

                        const oldIds = allLayers.map(d => d.id)
                        //console.log('old ids', oldIds)
                        let oldLayers = draftMapLayers.filter(d => {
                            //console.log(d.id)
                            return oldIds.includes(d.id)
                        })
                        
                        const out = [
                            // keep existing layers & filter
                            ...oldLayers, 
                            // add new layers
                            ...newLayers
                        ].sort((a,b) => b.order - a.order)
                        // console.log('update layers old:', oldLayers, 'new:', newLayers, 'out', out)
                        return out
                    })
                //}
            }
        }
        updateLayers()
    }, [state.symbologies])

    const layerProps = useMemo(() =>  {
        return Object.values(state.symbologies).reduce((out,curr) => {
            return {...out, ...(curr?.symbology?.layers || {})}
        },{}) 
    }, [state?.symbologies]);

    return (
        <MapContext.Provider value={{state, setState, falcor, falcorCache, pgEnv}}>
            <div id='dama_map_view' className="w-full relative" style={{height:'calc(100vh - 51px)'}} ref={mounted}>
                <AvlMap
                  layers={ mapLayers }
                  layerProps = { layerProps }
                  hideLoading={true}
                  showLayerSelect={true}
                  mapOptions={{
                    center: [-76, 43.3],
                    zoom: 6,
                    protocols: [PMTilesProtocol],
                    styles: defaultStyles
                  }}
                  leftSidebar={ false }
                  rightSidebar={ false }
                />
                <div className={'absolute inset-0 flex pointer-events-none'}>
                    <div className=''><MapManager /></div>
                    <div className='flex-1'/>
                    <div className=''><LegendPanel /></div>
                </div>
            </div>
        </MapContext.Provider>
    )
}

// const View = ({value}) => {
//     const mounted = useRef(false);
//     return (
//         <div id='dama_map_view' className="w-full relative" style={{height:'calc(100vh - 51px)'}} ref={mounted}>
//             <AvlMap
//               layers={ [] }
//               layerProps = { {} }
//               mapOptions={{
//                 center: [-76, 43.3],
//                 zoom: 6,
//                 protocols: [PMTilesProtocol],
//                 styles: defaultStyles
//               }}
//               leftSidebar={ false }
//               rightSidebar={ false }
//             />
//             <div className={'absolute inset-0 flex pointer-events-none'}>
//               <div className='p-2'><div className='bg-white'>Left Sidebar</div></div>
//               <div className='flex-1'/>
//               <div className='p-2'><div className='bg-white'>Right Sidebar</div></div>
//             </div>
//         </div>
//     )
// }


export default {
    "name": 'Map: Dama',
    "type": 'Map',
    "variables": 
    [       
        {
            name: 'geoid',
            default: '36'
        }
    ],
    getData,

    "EditComp": Edit,
    "ViewComp": View
}

const defaultStyles =  [
              {
                name: "Default",
                style: "https://api.maptiler.com/maps/dataviz/style.json?key=mU28JQ6HchrQdneiq6k9"
              },
              { name: "Satellite",
                style: "https://api.maptiler.com/maps/hybrid/style.json?key=mU28JQ6HchrQdneiq6k9",
              },
              { name: "Streets",
                style: "https://api.maptiler.com/maps/streets-v2/style.json?key=mU28JQ6HchrQdneiq6k9",
              },
             
              { name: "Light",
                style: "https://api.maptiler.com/maps/dataviz-light/style.json?key=mU28JQ6HchrQdneiq6k9"
              },
              { name: "Dark",
                style: "https://api.maptiler.com/maps/dataviz-dark/style.json?key=mU28JQ6HchrQdneiq6k9"
              },
              // {
              //   name: 'Sattelite 3d ',
              //   style: terrain_3d_source
              // }
]