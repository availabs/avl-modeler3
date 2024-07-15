import React, { useEffect, useRef } from "react"
import get from "lodash/get"
import isEqual from "lodash/isEqual"
import cloneDeep from "lodash/cloneDeep"
import { AvlLayer, hasValue } from "../../../../../../../modules/avl-map-2/src"
import { usePrevious, getValidSources } from './LayerManager/utils'
import {DAMA_HOST} from '../../../../../../../config'
import { DamaContext } from "../../../../../store"
//import { CMSContext } from '../../../../../../../modules/dms/src'
const CMSContext = {}
const ViewLayerRender = ({
  maplibreMap,
  layer,
  layerProps,
  allLayerProps
}) => {
  
  // ------------
  // avl-map doesn't always automatically remove layers on unmount
  // so do it here
  // ---------------
  useEffect(() => {  
    return () => { 
      //console.log('unmount', layer.id, layerProps.name, layer)
      layer.layers.forEach(l => {
        try {
          if (maplibreMap && maplibreMap.getLayer(l.id)) {
            maplibreMap.removeLayer(l.id)
          }
        } catch (e) {
          console.log('catch', e)
        }
      })
    }
  }, [])
  
  // to detect changes in layerprops
  const prevLayerProps = usePrevious(layerProps);
  
  // - On layerProps change
  useEffect(() => {
    // console.log('update layer props', layerProps)
    

   
    // ------------------------------------------------------
    // Change Source to Update feature properties dynamically
    // ------------------------------------------------------
    //TODO question -- is tile URL guaranteed to already have `?col=`
    if(layerProps?.['data-column'] !== (prevLayerProps?.['data-column']) || layerProps?.filter !== (prevLayerProps?.['filter'])) {
      //console.log('data-column update')
      if(maplibreMap.getSource(layerProps?.sources?.[0]?.id)){
        let newSource = cloneDeep(layerProps.sources?.[0])

        let tileBase = newSource.source.tiles?.[0];
        //newSource.source.tiles[0] += `?cols=${layerProps?.['data-column']}`
        //newSource.source.tiles[0] = newSource.source.tiles[0].replace('https://graph.availabs.org', 'http://localhost:4444')
        
        //console.log('change source columns', newSource.source.tiles[0], layerProps?.sources?.[0].id, newSource.id)
        
        if(layerProps.filter){
          Object.keys(layerProps.filter).forEach(filterCol => {
            tileBase += `,${filterCol}`
          })
        }

        if(tileBase){
          newSource.source.tiles = [tileBase];
        }


        layerProps?.layers?.forEach(l => {
          if(maplibreMap.getLayer(l?.id) && maplibreMap.getLayer(l?.id)){
            maplibreMap.removeLayer(l?.id) 
          }
        })
        // consol
        maplibreMap.removeSource(newSource.id)
        if(!maplibreMap.getSource(newSource.id)){
          maplibreMap.addSource(newSource.id, newSource.source)
        } else {
          console.log('cant add',maplibreMap.getSource(newSource.id))
        }

        let beneathLayer = Object.values(allLayerProps).find(l => l.order === (layerProps.order+1))
        layerProps?.layers?.forEach(l => {
            if(maplibreMap.getLayer(beneathLayer?.id)){
              maplibreMap.addLayer(l, beneathLayer?.id) 
            } else {
              maplibreMap.addLayer(l) 
            }
        })
      }
    }

    // -------------------------------
    // Reorder Layers
    // to do: STILL BUGGY
    // -------------------------------
    if(layerProps?.order < (prevLayerProps?.order || -1)) {
      let beneathLayer = Object.values(allLayerProps).find(l => l.order === (layerProps.order+1))
      layerProps?.layers?.forEach(l => {
        if(maplibreMap.getLayer(l?.id) && maplibreMap.getLayer(l?.id)){
          maplibreMap.moveLayer(l?.id, beneathLayer?.id) 
        }
      })
    }

    // -------------------------------
    // update paint Properties
    // -------------------------------
    layerProps?.layers?.forEach((l,i) => {
      if(maplibreMap.getLayer(l.id)){
        Object.keys(l.paint).forEach(paintKey => {
          if(!isEqual(prevLayerProps?.layers?.[i]?.paint?.[paintKey], l?.paint?.[paintKey])) {
            //  console.log('update paintKey', l.id, paintKey, prevLayerProps?.layers?.[i]?.paint?.[paintKey], l?.paint?.[paintKey])
            maplibreMap.setPaintProperty(l.id, paintKey, l.paint[paintKey])
          }
        })
      }
    })

    // -------------------------------
    // update layout Properties
    // -------------------------------
    layerProps?.layers?.forEach((l,i) => {
      if(maplibreMap.getLayer(l.id)){
        Object.keys(l?.layout || {}).forEach(layoutKey => {
          if(!isEqual(prevLayerProps?.layers?.[i]?.layout?.[layoutKey], l?.layout?.[layoutKey])) {
            // console.log('update layoutKey', l.id, layoutKey, prevLayerProps?.layers?.[i]?.paint?.[layoutKey], l?.paint?.[layoutKey])
            maplibreMap.setLayoutProperty(l.id, layoutKey, l.layout[layoutKey])
          }
        })
      }
    })
    

    // -------------------------------
    // Apply filters
    // -------------------------------
    const { filter: layerFilter } = layerProps;
    layerProps?.layers?.forEach((l,i) => {
      if(maplibreMap.getLayer(l.id)){
        if(layerFilter){
          const mapLayerFilter = Object.keys(layerFilter).map(
            (filterColumnName) => {
              let mapFilter = [];
              const filterOperator = layerFilter[filterColumnName].operator;
              const getFilterCol = ["get", filterColumnName];
              const filterValue = layerFilter[filterColumnName].value;
              if( filterOperator === 'between'){
                mapFilter = [
                  "all",
                  [">=", ["to-string", getFilterCol], ["to-string", filterValue?.[0]]],
                  ["<=", ["to-string", getFilterCol], ["to-string", filterValue?.[1]]],
                ]
              }
              else{
                mapFilter = [
                  filterOperator,
                  ["to-string", getFilterCol],
                  ["to-string", filterValue]
                ];
              }

              return mapFilter;
            }
          );
          maplibreMap.setFilter(l.id, ["all", ...mapLayerFilter]);
        }
      }
    });
  }, [layerProps])
}

class ViewLayer extends AvlLayer { 
  // constructor makes onHover not work??
  // constructor(layer, view) { 
  //   super();

  //   this.id = layer.id;
  //   // this.name = `Layer ${ layer.layerId }`;
  //   //console.log('sources', layer.layers)
  //   //this.startActive = true;
  //   //this.viewId = layer.view_id;
  //   this.sources = layer.sources.map(s => {
  //     let newSource = cloneDeep(s)
  //     newSource.id = `${layer.id}_${newSource.id}`
  //     return newSource
  //   })
  //   this.layers = layer.layers.map(l => {
  //     let newLayer = cloneDeep(l)
  //     newLayer.source = `${layer.id}_${l.source}`
  //     return newLayer
  //   })
    
  // }

  onHover = {
    layers: this.layers
      .filter(d => d?.id?.indexOf('_case') === -1)
      .map((d) => d.id),
    callback: (layerId, features, lngLat) => {

      //console.log('hover callback')
      let feature = features[0];

      let data = [feature.id, layerId, (features[0] || {}).properties];

      return data;
    },
    Component: HoverComp,
    // Component: ({ data, layer }) => { 
    //   if(!layer.props.hover) return
    //   return (
    //     <div className='p-2 bg-white'>
    //       <pre>{JSON.stringify(data,null,3)}</pre>
    //     </div>
    //   )
    // },
    isPinnable: this.isPinnable || true
  };
  
  RenderComponent = ViewLayerRender;
}

export default ViewLayer;




const HoverComp = ({ data, layer }) => {
  const { source_id, view_id } = layer;
  const dctx = React.useContext(DamaContext);
  const cctx = {} //React.useContext(CMSContext);
  const ctx = dctx?.falcor ? dctx : cctx;
  const { pgEnv, falcor, falcorCache } = ctx;
  const id = React.useMemo(() => get(data, "[0]", null), [data]);
  
  // console.log(source_id, view_id, id)

  const hoverColumns = React.useMemo(() => {
    return layer.props['hover-columns'];
  }, [layer]);

  useEffect(() => {
    if(source_id && !hoverColumns) {
      falcor.get([
          "dama", pgEnv, "sources", "byId", source_id, "attributes", "metadata"
      ]);
    }
  }, [source_id, hoverColumns]);

  const attributes = React.useMemo(() => {
    if (!hoverColumns) {
      let out = get(falcorCache, [
        "dama", pgEnv, "sources", "byId", source_id, "attributes", "metadata", "value", "columns"
      ], [])
      if(out.length === 0) {
          out = get(falcorCache, [
            "dama", pgEnv, "sources", "byId", source_id, "attributes", "metadata", "value"
          ], [])
        }
      return out
    }
    else {
      return hoverColumns;
    }

  }, [source_id, falcorCache, hoverColumns]);

  let getAttributes = (typeof attributes?.[0] === 'string' ?
    attributes : attributes.map(d => d.name || d.column_name)).filter(d => !['wkb_geometry'].includes(d))

  React.useEffect(() => {
    falcor.get([
      "dama",
      pgEnv,
      "viewsbyId",
      view_id,
      "databyId",
      id,
      getAttributes
    ])
    //.then(d => console.log('got attributes', d));
  }, [falcor, pgEnv, view_id, id, attributes]);

  const attrInfo = React.useMemo(() => {
    return get(
      falcorCache,
      ["dama", pgEnv, "viewsbyId", view_id, "databyId", id],
      {}
    );
  }, [id, falcorCache, view_id, pgEnv]);

  if(!layer.props.hover) return
  

  return (
    <div className="bg-white p-4 max-h-64 max-w-lg scrollbar-xs overflow-y-scroll">
      <div className="font-medium pb-1 w-full border-b ">
        {layer?.name || ''}
      </div>
      {Object.keys(attrInfo).length === 0 ? `Fetching Attributes ${id}` : ""}
      {Object.keys(attrInfo)
        .filter((k) => typeof attrInfo[k] !== "object")
        .map((k, i) => {
          const hoverAttr = attributes.find(attr => attr.name === k || attr.column_name === k) || {};
          if ( !(hoverAttr.name || hoverAttr.display_name) ) {
            return <></>;
          }
          else {
            return (
              <div className="flex border-b pt-1" key={i}>
                <div className="flex-1 font-medium text-xs text-slate-400 pl-1">{hoverAttr.name || hoverAttr.display_name}</div>
                <div className="flex-1 text-right text-sm font-thin pl-4 pr-1">
                  {attrInfo?.[k] !== "null" ? attrInfo?.[k] : ""}
                </div>
              </div>
            );
          }
        })}
    </div>
  );
};