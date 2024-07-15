import React, { useContext , useMemo, Fragment}from 'react'
import {SymbologyContext} from '../../'
import { Plus, Close, MenuDots, CaretDown } from '../icons'
import { Menu, Popover, Transition, Tab, Dialog } from '@headlessui/react'
import { toHex } from '../LayerManager/utils'
import get from 'lodash/get'
import set from 'lodash/set'

import { LayerMenu } from '../LayerManager/LayerPanel'
import typeConfigs from './typeConfigs'
import { wrapperTypes } from './ControlWrappers'
import { SelectControl } from './Controls'

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



function LegendEditor() {
  const { state, setState  } = React.useContext(SymbologyContext);
  
  let { legenddata, layertype } = useMemo(() => {
    return {
      legenddata : get(state, `symbology.layers[${state.symbology.activeLayer}]['legend-data']`, []),
      layertype : get(state, `symbology.layers[${state.symbology.activeLayer}]['type']`, 'fill') 
    }
  },[state])

  const Symbol = typeSymbols[layertype] || typeSymbols['fill']

  if(!legenddata || legenddata.length === 0 ) {
    return <div> No Legend Data </div>
  }

  
  return (
    <div className='w-full max-h-[550px] pb-4 overflow-auto'>
        {legenddata.map((d,i) => (
          <div key={i} className='w-full flex items-center hover:bg-pink-50'>
            <div className='flex items-center h-6 w-10 justify-center  '>
              {/*<div className='w-4 h-4 rounded border-[0.5px] border-slate-600' style={{backgroundColor:d.color}}/>*/}
              <Symbol color={d.color} />
            </div>
            <div className='flex items-center text-center flex-1 px-4 text-slate-500  text-sm truncate'>
              <input 
                type="text"
                className='block w-full border border-transparent hover:border-slate-200 outline-2 outline-transparent rounded-md bg-transparent py-1 px-2 text-slate-800 placeholder:text-gray-400 focus:outline-pink-300 sm:leading-6'
                placeholder={'Select / Create New Map'}
                value={legenddata[i].label}
                onChange={(e) => setState(draft => { 
                  //if(draft.symbology.activeLayer && draft.symbology.layers[draft.symbology.activeLayer].name){
                    draft.symbology.layers[draft.symbology.activeLayer]['legend-data'][i].label = e.target.value 
                  //}
                })}
              />
            </div>
          </div> 
        ))}
    </div>
  )
}


function LegendEditorContainer (props) {
  const { state, setState } = React.useContext(SymbologyContext);
  const activeLayer = useMemo(() => state.symbology?.layers?.[state.symbology.activeLayer] || null, [state])
  const config = useMemo(() => typeConfigs[activeLayer.type] || []
    ,[activeLayer.type])
  
  return activeLayer && (
    <div>
      <div className=''>
      <div className='font-bold tracking-wider text-sm text-slate-700 p-4'>Legend</div>
        <LegendEditor />
      </div>
    </div>
  )
} 

export default LegendEditorContainer