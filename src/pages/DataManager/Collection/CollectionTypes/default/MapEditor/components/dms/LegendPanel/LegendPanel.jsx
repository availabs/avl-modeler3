import React, { useContext , useMemo, useCallback, Fragment, useRef} from 'react'
import { MapContext } from '../MapComponent'
// import { DamaContext } from "../../../../../../store"
// import SourceSelector from './SourceSelector'
import { DndList } from '../../../../../../../../../modules/avl-components/src'
import { Menu, Transition, Tab, Dialog } from '@headlessui/react'
import { useParams, useNavigate } from 'react-router-dom'
import { Fill, Line, Circle, Eye, EyeClosed, MenuDots , CaretDown} from '../../icons'
import get from 'lodash/get'
import set from 'lodash/get'
//import {LayerMenu} from './LayerPanel'



function VisibilityButton ({layer}) {
  const { state, setState  } = React.useContext(MapContext);
  const { activeLayer } = state.symbology;
  const visible = layer?.layers?.[0]?.layout.visibility === 'visible'
  return (
    <div onClick={() => {
        setState(draft => {
          draft.symbology.layers[layer.id].isVisible = !draft.symbology.layers[layer.id].isVisible
          draft.symbology.layers[layer.id].layers.forEach((d,i) => {
              let val = get(state, `symbology.layers[${layer.id}].layers[${i}].layout.visibility`,'') 
              let update = val === 'visible' ? 'none' : 'visible'
              // console.log('update?', update, val)
              // set(draft,`symbology.layers[${layer.id}].layers[${i}].layout` , { "visible": update}) 
              draft.symbology.layers[layer.id].layers[i].layout =  { "visibility": update }
          })
        })}}
      >
      {visible ? 
        <Eye 
          className={` ${activeLayer == layer.id ? 'fill-pink-100' : 'fill-white'} cursor-pointer group-hover:fill-gray-400 group-hover:hover:fill-pink-700`}
        /> : 
        <EyeClosed 
          className={` ${activeLayer == layer.id ? 'fill-pink-100' : 'fill-white'} cursor-pointer group-hover:fill-gray-400 group-hover:hover:fill-pink-700`}
        />
      }
    </div>
  )
}

const typeSymbols = {
  'fill': ({layer,color}) => {
      //let color = get(layer, `layers[1].paint['fill-color']`, '#ccc')
      return (
        <div className='pr-2'>
          <div className={'w-4 h-4 rounded '} style={{backgroundColor:color}} />
        </div>
      )
  },
  'circle': ({layer,color}) => {
      //let color = get(layer, `layers[0].paint['circle-color']`, '#ccc')
      let borderColor = get(layer, `layers[0].paint['circle-stroke-color']`, '#ccc')
      return (
        <div className='pl-0.5 pr-2'>
          <div className={'w-3 h-3 rounded-full '} style={{backgroundColor:color, borderColor}} />
        </div>
      )
  },
  'line': ({layer, color}) => {
      return (
        <div className='pr-2'>
          <div className={'w-4 h-1'} style={{backgroundColor:color}} />
        </div>
      )
  }
}

const typePaint = {
  'fill': (layer) => {

    return  get(layer, `layers[1].paint['fill-color']`, '#ccc')
  },
  'circle': (layer) => {
    return  get(layer, `layers[0].paint['circle-color']`, '#ccc')
      
  },
  'line': (layer) => {
    return get(layer, `layers[1].paint['line-color']`, '#ccc')
  }
}

function CategoryLegend({layer}) {
  // console.log('categoryLegend', layer)
  const Symbol = typeSymbols[layer.type] || typeSymbols['fill']
  let  legenddata = layer?.['legend-data'] || []
  let paintValue = typeof typePaint[layer.type](layer) === 'object' ? typePaint[layer.type](layer) : []
  const categories = legenddata || (paintValue || []).filter((d,i) => i > 2 )
    .map((d,i) => {
      if(i%2 === 0) {
        return {color: d, label: paintValue[i+2]}
      }
      return null
    })
    .filter(d => d)
  
  return (
    <div className='w-full max-h-[250px] overflow-auto'>
        {categories.map((d,i) => (
          <div key={i} className='w-full flex items-center hover:bg-pink-50'>
            <div className='flex items-center h-6 w-10 justify-center  '>
              {/*<div className='w-4 h-4 rounded border-[0.5px] border-slate-600' style={{backgroundColor:d.color}}/>*/}
              <Symbol color={d.color} />
            </div>
            <div className='flex items-center text-center flex-1 px-4 text-slate-500 h-6 text-sm truncate'>{d.label}</div>
          </div> 
        ))}
    </div>
  )
}

function StepLegend({layer}) {
  //console.log('StepLegend', layer)
  const { state, setState  } = React.useContext(MapContext);
  const { choroplethdata, legenddata } = useMemo(() => {
    return {
      choroplethdata: get(layer, `['choropleth-data']`, []), 
      legenddata: layer?.['legend-data'] || []
    }
  },[state])

  const Symbol = typeSymbols[layer.type] || typeSymbols['fill']
  let paintValue = typeof typePaint[layer.type](layer) === 'object' ? typePaint[layer.type](layer) : []
  const max = Math.max(...choroplethdata)
  // console.log('StepLegend', paintValue, choroplethdata, Math.min(...choroplethdata), )
  const categories = legenddata || [
    ...(paintValue || []).filter((d,i) => i > 2 )
    .map((d,i) => {
    
      if(i%2 === 1) {
        //console.log('test 123', d, i)
        return {color: paintValue[i+1], label: `${paintValue[i+2]} - ${paintValue[i+4] || max}`}
      }
      return null
    })
    .filter(d => d)
  ]

  return (
    <div className='w-full max-h-[250px] overflow-auto'>
        {categories.map((d,i) => (
          <div key={i} className='w-full flex items-center hover:bg-pink-50'>
            <div className='flex items-center h-6 w-10 justify-center  '>
              {/*<div className='w-4 h-4 rounded border-[0.5px] border-slate-600' style={{backgroundColor:d.color}}/>*/}
              <Symbol color={d.color} />
            </div>
            <div className='flex items-center text-center flex-1 px-4 text-slate-500 h-6 text-sm truncate'>{d.label}</div>
          </div> 
        ))}
    </div>
  )
}


function LegendRow ({ index, layer, i }) {
  const navigate = useNavigate();
  const  activeLayer  = null

  const Symbol = typeSymbols[layer.type] || typeSymbols['fill']
  let paintValue = typePaint[layer.type](layer)
  const type = layer['layer-type']

  //TODO -- how to get `baseUrl` when you don't have damaContext??
  const sourceUrl = `/datasources/source/${layer.source_id}`

  return (
    <div className={`${activeLayer == layer.id ? 'bg-pink-100' : ''} hover:border-pink-500 border border-transparent`}>
      <div className={`group/title w-full  p-2 py-1 flex items-center`}>
        {(type === 'simple' || !type) && <div className='px-1'><Symbol layer={layer} color={paintValue}/></div>}
        <div className='w-full text-sm text-slate-600 font-medium truncate flex justify-between flex-wrap'>
          {layer.name}
          <div 
            className="cursor-pointer text-white group-hover/title:text-black group/icon "
            onClick={(e) => {
              if (e.ctrlKey) {
                window.open(sourceUrl, "_blank");
              }
              else {
                navigate(sourceUrl);
              }
            }}
          >
            <span style={{fontFamily:"FontAwesome"}}className="mx-2 fa fa-square-info group-hover/icon:text-pink-800"/>
          </div>
        </div>
      </div>
      {type === 'categories' && <CategoryLegend layer={layer} />}
      {type === 'choropleth' && <StepLegend layer={layer} />}
    </div>
  )
}

function LegendPanel (props) {
  const { state, setState  } = React.useContext(MapContext);
  const layersBySymbology = useMemo(() => {
    return Object.values(state?.symbologies || {})
      .filter(symb => symb.isVisible)
      .map((symb) => {
        return { name: symb.name, symbology_id: symb.symbology_id, layers: { ...symb.symbology.layers } };
      });
  }, [state]);
  
  // console.log('legend layersBySymbology', layersBySymbology)
  
  // const droppedSection = React.useCallback((start, end) => {
  //   setState(draft => {
  //   const sections = Object.values(draft.symbology.layers)
        
  //   let listLen = Object.values(draft.symbology.layers).length - 1
  //   let orderStart =  listLen - start
  //   let orderEnd = listLen - end 

  //   const [item] = sections.splice(orderStart, 1);
  //   sections.splice(orderEnd, 0, item);

  //   sections.forEach((item, i) => {
  //       item.order = i
  //   })
    
  //   draft.symbology.layers = sections
  //       .reduce((out,sec) => {
  //         out[sec.id] = sec;
  //         return out 
  //       },{})
  //   })
  // }, [])

  return (
    <>
      {/* ------Layer Pane ----------- */}
      <div className='p-4'>
        <div className='min-h-20 relative bg-white/75 max-h-[calc(100vh_-_111px)] overflow-auto pointer-events-auto scrollbar-sm'>
          {layersBySymbology.map((symb) => (
            <div
              key={symb.symbology_id}
              className="m-2 p-2 rounded"
            >
              <div className="font-normal">{symb.name}</div>
              {Object.values(symb.layers)
                .sort((a,b) => b.order - a.order)
                .map((layer,i) => <LegendRow key={layer.id} layer={layer} i={i} />)}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default LegendPanel