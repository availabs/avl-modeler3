import React, { useContext, Fragment, useRef} from 'react'
import { SymbologyContext } from '../../'
// import { DamaContext } from "../../../../../../store"
import { Menu, Transition, Tab, Dialog } from '@headlessui/react'
import { Fill, Line, Circle, Eye, EyeClosed, MenuDots , CaretDown} from '../icons'

import LegendPanel from './LegendPanel'
import LayerPanel from './LayerPanel'
import SymbologyControl from './SymbologyControl'
import SourceSelector from './SourceSelector'


function LayerManager () {
  const { state } = React.useContext(SymbologyContext);

  const tabs = ['Legend', 'Layers']
  return(
    <div className='p-4'>
      <div className='bg-white/95 w-[340px] rounded-lg drop-shadow-lg pointer-events-auto min-h-[400px] max-h-[calc(100vh_-_111px)] scroll-xs'>
        <SymbologyControl /> 
        {state.symbology_id && <Tab.Group>
          <div className='flex justify-between items-center border-b'>
            <Tab.List>
              {tabs.map(tabName => (
                <Tab  key={tabName} as={Fragment}>
                  {({ selected }) => (
                    <button
                      className={`
                        ${selected ? 
                          'text-slate-600 border-b font-medium border-slate-600' : 
                          'text-slate-400'} mx-1 text-sm p-2 cursor-pointer
                      `}
                    >
                      {tabName}
                    </button>
                  )}
                </Tab>
              ))}
            </Tab.List>
            <SourceSelector />
          </div>
          <Tab.Panels>
            <Tab.Panel><LegendPanel /></Tab.Panel>
            <Tab.Panel><LayerPanel /></Tab.Panel>
          </Tab.Panels>
        </Tab.Group>}
      </div>
    </div>
  )
}



export default LayerManager