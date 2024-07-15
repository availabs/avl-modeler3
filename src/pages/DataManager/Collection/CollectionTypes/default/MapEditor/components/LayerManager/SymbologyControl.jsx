import React, { useContext , useMemo, useCallback, Fragment, useRef} from 'react'
import { SymbologyContext } from '../../'
import { DamaContext } from "../../../../../../store"

import { Menu, Transition, Tab, Dialog } from '@headlessui/react'
import { useParams, useNavigate } from 'react-router-dom'
import { Fill, Line, Circle, Eye, EyeClosed, MenuDots , CaretDown} from '../icons'

import get from 'lodash/get'



export function Modal({open, setOpen, initialFocus, children}) {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-30" initialFocus={initialFocus} onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto" >
          <div 
            onClick={() =>  {setOpen(false);}} 
            className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0"
          >
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}


export function CreateSymbologyModal ({ open, setOpen})  {
  const cancelButtonRef = useRef(null)
  // const submit = useSubmit()
  const { pgEnv, falcor, baseUrl } = React.useContext(DamaContext)
  const { state } = React.useContext(SymbologyContext)
  const { collectionId } = useParams()
  const navigate = useNavigate()
  const [modalState, setModalState] = React.useState({
    name: '',
    loading: false
  })

  const createSymbologyMap = async () => {
    const newSymbology = {
      name: modalState.name,
      collection_id: collectionId,
      description: 'map',
      symbology: {
        layers: {}
      }
    }
    console.log('newSymbology', newSymbology)

    let resp = await falcor.call(
        ["dama", "symbology", "symbology", "create"],
        [pgEnv, newSymbology]
    )
    let symbology_id = Object.keys(get(resp, ['json','dama', pgEnv , 'symbologies' , 'byId'], {}))?.[0] || false
    await falcor.invalidate(["dama", pgEnv, "collections", "byId", collectionId, "symbologies", "length"])
    // await falcor.get()
    // await falcor.invalidate(["dama", pgEnv, "symbologies", "byId"])
    console.log('created symbology', resp, symbology_id)
    
    if(symbology_id) {
      setOpen(false)
      navigate(`${baseUrl}/collection/${collectionId}/mapeditor/${symbology_id}`)
    }
    

  }
  
  return (
    <Modal
      open={open}
      setOpen={setOpen}
      initialFocus={cancelButtonRef}
    >
      <div className="sm:flex sm:items-start">
        <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
          <i className="fad fa-layer-group text-blue-600" aria-hidden="true" />
        </div>
        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
          <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
            Create New Map
          </Dialog.Title>
          <div className="mt-2 w-full">
            <input
              value={modalState.name}
              onChange={e => setModalState({...state, name: e.target.value})} 
              className='p-2 bg-slate-100 text-lg font-medium w-full' placeholder={'Map Name'}/>
          </div>
        </div>
      </div>
      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
        <button
          type="button"
          disabled={modalState.loading || modalState.name?.length < 4}
          className="disabled:bg-slate-300 disabled:cursor-warning inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
          onClick={createSymbologyMap}
        >
          Creat{modalState.loading ? 'ing...' : 'e'}
        </button>
        <button
          type="button"
          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
          onClick={() => setOpen(false) }
          ref={cancelButtonRef}
        >
          Cancel
        </button>
      </div>
    </Modal>
  )

}



function SymbologyMenu({ button}) {
  const { state, setState, symbologies, collection } = React.useContext(SymbologyContext);
  const { baseUrl } = React.useContext(DamaContext)
  const [showCreate, setShowCreate] = React.useState(false)
  const navigate = useNavigate()

  return (
      <div>
      <CreateSymbologyModal open={showCreate} setOpen={setShowCreate}/>
      <Menu as="div" className="relative inline-block text-left">
        <Menu.Button>
          {button}
        </Menu.Button>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className='absolute z-40 -left-[238px]  w-[270px] origin-top-right divide-y divide-gray-100 bg-slate-100 shadow-lg ring-1 ring-black/5 focus:outline-none'>
            <div className="px-1 py-1 ">
              <Menu.Item>
                {({ active }) => (
                  <div 
                    onClick={() => setShowCreate(true)}
                    className={`${
                      active ? 'bg-blue-50 ' : ''
                    } group flex w-full items-center hover:bg-pink-100 text-slate-600 rounded-md px-2 py-2 text-sm`}>New Map</div>
                )}
              </Menu.Item>
              <div className='w-full border' />
              {symbologies.map(sym => (
                <Menu.Item key={sym.symbology_id}>
                  <div 
                    onClick={() => navigate(`${baseUrl}/collection/${collection.collection_id}/mapeditor/${sym.symbology_id}`)}
                    className={`group flex w-full items-center hover:bg-pink-100 text-slate-600 rounded-md px-2 py-2 text-sm`}>
                    {sym.name}
                  </div>
                
              </Menu.Item>))}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
      </div>
  )
} 


function SymbologyControlMenu({ button}) {
  const { state, setState  } = React.useContext(SymbologyContext);

  return (
      <Menu as="div" className="relative inline-block text-left">
        <Menu.Button>
          {button}
        </Menu.Button>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className='absolute right-0 w-36 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none'>
            <div className=" py-1 ">
              {/*<Menu.Item>
                {({ active }) => (
                  <div className={`${
                      active ? 'bg-blue-50 ' : ''
                    } group flex w-full items-center text-slate-600 rounded-md px-2 py-2 text-sm`}>Zoom to Fit</div>
                )}
              </Menu.Item>*/}
              <Menu.Item>
                {({ active }) => (
                  <div 
                    className={`${
                      active ? 'bg-pink-50 ' : ''
                    } group flex w-full items-center text-red-400 rounded-md px-2 py-2 text-sm`}
                    onClick={() => {
                      // setState(draft => {
                      //   delete draft.symbology.layers[layer.id]
                      //   Object.values(draft.symbology.layers)
                      //     .sort((a, b) => a.order - b.order)
                      //     .forEach((l,i) => l.order = i)
                      // })
                    }}
                  >Delete</div>
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
  )
} 

function SymbologyControl () {
  const { state, setState } = React.useContext(SymbologyContext);
  
  return (
    <div className='p-1'>
      <div className='flex bg-slate-100 border border-transparent hover:border-slate-300 group rounded-md shadow-sm ring-1 ring-inset ring-slate-100 focus-within:ring-2 focus-within:ring-inset focus-within:ring-pink-600 sm:max-w-md'>
          <input 
            type="text"
            className='block w-[220px] flex-1 outline-0  bg-transparent p-2 text-slate-800 placeholder:text-gray-400  focus:border-0  sm:leading-6'
            placeholder={'Select / Create New Map'}
            value={state.name}
            onChange={(e) => setState(draft => {
                draft.name = e.target.value
              })
            }
          />
          {
            state.symbology_id && <div className='flex items-center pt-1.5'>
              <SymbologyControlMenu button={
                <MenuDots className={`cursor-pointer fill-none group-hover:fill-gray-400 group-hover:hover:fill-pink-700`}/>
              } />
              </div>
          }
          <div className='flex items-center '>
            <SymbologyMenu
              button={<div className='flex items-center p-2  border-2 border-transparent h-10  hover fill-slate-400 hover:fill-slate-800 cursor-pointer'> <CaretDown  className=''/> </div>}
            />
          </div>
      </div>
    </div>

  )
}

export default SymbologyControl