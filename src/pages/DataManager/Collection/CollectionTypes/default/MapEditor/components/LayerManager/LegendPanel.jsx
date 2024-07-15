import React, { useContext , useMemo, useCallback, Fragment, useRef} from 'react'
import { SymbologyContext } from '../../'
import { DamaContext } from "../../../../../../store"
import SourceSelector from './SourceSelector'
import { DndList } from '../../../../../../../../modules/avl-components/src'
import { Menu, Transition, Tab, Dialog } from '@headlessui/react'
import { useParams } from 'react-router-dom'
import { Fill, Line, Circle, Eye, EyeClosed, MenuDots , CaretDown} from '../icons'
import get from 'lodash/get'
import set from 'lodash/get'
import {LayerMenu} from './LayerPanel'



function VisibilityButton ({layer}) {
  const { state, setState  } = React.useContext(SymbologyContext);
  const { activeLayer } = state.symbology;
  const visible = layer.isVisible

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
  const Symbol = typeSymbols[layer.type] || typeSymbols['fill']
  let  legenddata = layer?.['legend-data'] || []
  let paintValue = typeof typePaint[layer.type](layer) === 'object' ? typePaint[layer.type](layer) : []

  
  
  if(!legenddata || legenddata.length === 0 ) {
    legenddata = []
    // (paintValue || []).filter((d,i) => i > 2 )
    //   .map((d,i) => {
    //     if(i%2 === 0) {
    //       return {color: d, label: paintValue[i+2]}
    //     }
    //     return null
    //   })
    //   .filter(d => d)
  }

  
  return (
    <div className='w-full max-h-[250px] overflow-x-auto'>
        {legenddata.map((d,i) => (
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
  console.log('StepLegend', layer)
  const { state, setState  } = React.useContext(SymbologyContext);
  let { choroplethdata, legenddata } = useMemo(() => {
    return {
      choroplethdata: get(layer, `['choropleth-data']`, []),
      legenddata : get(layer, `['legend-data']`, []) 
    }
  },[state])

  const Symbol = typeSymbols[layer.type] || typeSymbols['fill']
  let paintValue = typeof typePaint[layer.type](layer) === 'object' ? typePaint[layer.type](layer) : []
  const max = Math.max(...choroplethdata)
  // console.log('StepLegend', paintValue, choroplethdata, Math.min(...choroplethdata), )
  if(!legenddata || legenddata.length === 0 ) {
    legenddata = [
      ...(paintValue || []).filter((d,i) => i > 2 )
      .map((d,i) => {
      
        if(i % 2 === 1) {
          return {color: paintValue[i+1], label: `${paintValue[i+2]} - ${paintValue[i+4] || max}`}
        }
        return null
      })
      .filter(d => d)
    ]
  }

  return (
    <div className='w-full max-h-[250px] overflow-x-auto scrollbar-sm'>
        {legenddata.map((d,i) => (
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
  const { state, setState  } = React.useContext(SymbologyContext);
  const { activeLayer } = state.symbology;
  const toggleSymbology = () => {
    setState(draft => {
        draft.symbology.activeLayer = activeLayer === layer.id ? '' : layer.id
    })
  }

  const Symbol = typeSymbols[layer.type] || typeSymbols['fill']
  let paintValue = typePaint[layer.type](layer)
  const type = layer['layer-type']
  //console.log('legend row type', type)

  return (
    <div onClick={toggleSymbology} className={`${activeLayer == layer.id ? 'bg-pink-100' : ''} hover:border-pink-500 group border`}>
      <div className={`w-full  p-2 py-1 flex border-blue-50/50 border  items-center`}>
        {(type === 'simple' || !type) && <div className='px-1'><Symbol layer={layer} color={paintValue}/></div>}
        <div  className='text-sm text-slate-600 font-medium truncate flex-1'>{layer.name}</div>
        {/*<div className='flex items-center text-xs text-slate-400'>{layer.order}</div>*/}
        <div className='text-sm pt-1 px-0.5 flex items-center'>
          <LayerMenu 
            layer={layer}
            button={<MenuDots className={` ${activeLayer == layer.id ? 'fill-pink-100' : 'fill-white'} cursor-pointer group-hover:fill-gray-400 group-hover:hover:fill-pink-700`}/>}
          />
        </div>
        <VisibilityButton layer={layer}/>
      </div>
      {type === 'categories' && <CategoryLegend layer={layer} />}
      {type === 'choropleth' && <StepLegend layer={layer} />}
    </div>
  )
}

function LayerManager (props) {
  const { state, setState  } = React.useContext(SymbologyContext);
  const layers = useMemo(() => state.symbology?.layers ||  {}, [state])
  //console.log('layers', layers)
  
  const droppedSection = React.useCallback((start, end) => {
    setState(draft => {
    const sections = Object.values(draft.symbology.layers)
        
    let listLen = Object.values(draft.symbology.layers).length - 1
    let orderStart =  listLen - start
    let orderEnd = listLen - end 

    const [item] = sections.splice(orderStart, 1);
    sections.splice(orderEnd, 0, item);

    sections.forEach((item, i) => {
        item.order = i
    })
    
    draft.symbology.layers = sections
        .reduce((out,sec) => {
          out[sec.id] = sec;
          return out 
        },{})
    })
  }, [])

  return (
    <>     
      {/* ------Layer Pane ----------- */}
      <div className='min-h-20 relative max-h-[calc(100vh_-_220px)] overflow-x-auto scrollbar-sm '>
        <DndList onDrop={droppedSection} offset={{x:16, y: 45}}>
        {Object.values(layers)
          .sort((a,b) => b.order - a.order)
          .map((layer,i) => <LegendRow key={layer.id} layer={layer} i={i} />)}
        </DndList>
      </div>
    </>
  )
}

export default LayerManager