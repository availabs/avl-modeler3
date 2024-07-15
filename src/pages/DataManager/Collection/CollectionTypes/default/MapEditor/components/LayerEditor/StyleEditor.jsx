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
import { controlTypes } from './Controls'


const layerTypeNames = {
  'fill': 'Polygons',
  'line': 'Lines',
  'circle': 'Points'
}

function StyleEditor (props) {
  const { state, setState } = React.useContext(SymbologyContext);
  const activeLayer = useMemo(() => state.symbology?.layers?.[state.symbology.activeLayer] || null, [state])
  const config = useMemo(() => typeConfigs[activeLayer.type] || []
    ,[activeLayer.type])
  
  return activeLayer && (
    <div>
      <div className='p-4'>
      <div className='font-bold tracking-wider text-sm text-slate-700'>{layerTypeNames[activeLayer.type]}</div>
      {config
        .filter(c => {
          if(!c.conditional) {
            return true
          } else {
            // console.log('has conditional')
            const condValue = get(state, `symbology.layers[${state.symbology.activeLayer}].${c.conditional.path}`, '-999')
            // console.log('has conditional',c.conditional, condValue)
            return c.conditional.conditions.includes(condValue)
          }
        })
        .map((control,i) => {
          let ControlWrapper = wrapperTypes[control.type] || wrapperTypes['inline']
          return (
            <div className='flex ' key={i}>
              <div className='w-16 text-slate-500 text-[14px] tracking-wide min-h-[32px] flex items-center'>{control.label}</div>
              <div className='flex-1 flex items-center'>
                <ControlWrapper
                  label={control.label}
                  controls={control.controls}
                />
              </div>
            </div>
        )
      })}

    </div>
    </div>
  )
} 

export default StyleEditor