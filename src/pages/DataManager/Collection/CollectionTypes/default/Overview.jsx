import React, { useEffect, /*useMemo,*/ useState } from 'react';
import { Link } from "react-router-dom";
import { Input, Button } from "../../../../../modules/avl-components/src"
import get from 'lodash/get'
import { CollectionAttributes } from '../../../../../pages/DataManager/Collection/attributes'
import { DamaContext } from "../../../../../pages/DataManager/store"
//import Symbologies from './Symbology/list'
// import { VersionEditor, VersionDownload } from './Version/version'

import SourceCategories from "./SourceCategories"

const Edit = ({startValue, attr, collectionId, type='text',cancel=()=>{}}) => {
  const [value, setValue] = useState('')
  //console.log('what is the value :', )
  const {pgEnv, baseUrl, falcor} = React.useContext(DamaContext);
  /*const [loading, setLoading] = useState(false)*/

  useEffect(() => {
    setValue(startValue)
  },[startValue])

  const save = (attr, value) => {
    if(collectionId) {
      falcor.set({
          paths: [
            ['dama',pgEnv,'collections','byId',collectionId,'attributes', attr ]
          ],
          jsonGraph: {
            dama:{
              [pgEnv] : {
                collections: {
                  byId:{
                    [collectionId] : {
                        attributes : {[attr]: value}
                    }
                  }
                }
              }
            }
          }
      }).then(d => {
        cancel()
      })
    }
  }

  return (
    type === 'textarea' ? (
      <div className='w-full flex flex-col h-full border border-lime-300'>
        <div>
          <textarea className='flex-1 w-full px-2 shadow bg-blue-100 min-h-[200px] focus:ring-blue-700 focus:border-blue-500  border-gray-300 rounded-none rounded-l-md' onChange={e => setValue(e.target.value)} >
            {value}
          </textarea>
        </div>
        <div className='flex py-2'>
          <div className='flex-1'/>
          <Button themeOptions={{size:'sm', color: 'primary'}} onClick={e => save(attr,value)}> Save </Button>
          <Button themeOptions={{size:'sm', color: 'cancel'}} onClick={e => cancel()}> Cancel </Button>
        </div>
      </div>) : (
      <div className='w-full flex flex-1'>
        <Input className='flex-1 px-2 shadow bg-blue-100 focus:ring-blue-700 focus:border-blue-500  border-gray-300 rounded-none rounded-l-md' value={value} onChange={e => setValue(e)}/>
        <Button themeOptions={{size:'sm', color: 'primary'}} onClick={e => save(attr,value)}> Save </Button>
        <Button themeOptions={{size:'sm', color: 'cancel'}} onClick={e => cancel()}> Cancel </Button>
      </div>
      )
  )
}



const OverviewPage = ({collection, symbologies, activeViewId}) => {
  const [editing, setEditing] = React.useState(null);

  const stopEditing = React.useCallback(e => {
    e.stopPropagation();
    setEditing(null);
  }, []);

  // console.log("OverviewEdit::editing:", editing)

  const {pgEnv, baseUrl, user} = React.useContext(DamaContext);

  return (
    <div className='p-4'>
      <div className=" flex flex-col md:flex-row">
        <div className='flex-1'>
          <div className='flex justify-between group'>
            <div  className="flex-1 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dd className="mt-1 text-2xl text-gray-700 font-medium overflow-hidden sm:mt-0 sm:col-span-3">
                {editing === 'name' ?
                  <div className='pt-3 pr-8'>
                    <Edit
                      startValue={collection['name']}
                      attr={'name'}
                      collectionId={collection.collection_id}
                      cancel={stopEditing}
                    />
                  </div> :
                  <div className='py-2 px-2'>{collection['name']}</div>
                }
              </dd>
            </div>
            {user.authLevel > 5 ?
            <div className='hidden group-hover:block text-blue-500 cursor-pointer' onClick={e => editing === 'name' ? setEditing(null): setEditing('name')}>
              <i className="fad fa-pencil absolute -ml-12 mt-3 p-2.5 rounded hover:bg-blue-500 hover:text-white "/>
            </div> : ''}
          </div>
          <div className="w-full pl-4 py-6 hover:py-6 sm:pl-6 flex justify-between group">
            <div className="flex-1">
              <div className='mt-1 text-sm text-gray-500 pr-14'>
              {editing === 'description' ?
                <Edit
                  startValue={get(collection,'description', '')}
                  attr={'description'}
                  type='textarea'
                  collectionId={collection?.collection_id}
                  cancel={stopEditing}/> :
                get(collection,'description', false) || 'No Description'}
              </div>
            </div>
            {user.authLevel > 5 ?
            <div className='hidden group-hover:block text-blue-500 cursor-pointer' onClick={e => setEditing('description')}>
                <i className="fad fa-pencil absolute -ml-12  p-2 hover:bg-blue-500 rounded focus:bg-blue-700 hover:text-white "/>
            </div> : '' }
          </div>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            {Object.keys(CollectionAttributes)
              .filter(d => !['collection_id','metadata','description', 'statistics', 'category', 'display_name','name'].includes(d))
              .map((attr,i) => {
                let val = typeof collection[attr] === 'object' ? JSON.stringify(collection[attr]) : collection[attr]
                if (attr === "categories") {
                  return (
                    <div key={attr} className='flex justify-between group'>
                      <div  className="flex-1 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500 py-5">{attr}</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          <div className="py-5 px-2 relative">
                            {/* <SourceCategories source={ source }
                              editingCategories={ editing === attr }
                              stopEditingCategories={ stopEditing }/> */}
                          </div>
                        </dd>
                      </div>
                      { user.authLevel > 5 && (editing !== attr) ?
                        <div className='hidden group-hover:block text-blue-500 cursor-pointer'
                          onClick={ e => setEditing(attr) }
                        >
                          <i className="fad fa-pencil absolute -ml-12 mt-3 p-2.5 rounded hover:bg-blue-500 hover:text-white "/>
                        </div> : null
                      }
                    </div>
                  )
                }
                return (
                  <div key={attr} className='flex justify-between group'>
                    <div  className="flex-1 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500 py-5">{attr}</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {editing === attr ?
                          <div className='pt-3 pr-8'>
                            <Edit
                              startValue={val}
                              attr={attr}
                              collectionId={collection.collection_id}
                              cancel={stopEditing}
                            />
                          </div> :
                          <div className='py-5 px-2'>{val}</div>
                        }
                      </dd>
                    </div>
                    {user.authLevel > 5 ?
                    <div className='hidden group-hover:block text-blue-500 cursor-pointer' onClick={e => editing === attr ? setEditing(null): setEditing(attr)}>
                      <i className="fad fa-pencil absolute -ml-12 mt-3 p-2.5 rounded hover:bg-blue-500 hover:text-white "/>
                    </div> : ''}
                  </div>
                )
              })
            }
            {/* <VersionEditor
              view={views.filter(d => d.view_id === activeViewId )?.[0] || {}}
              columns={['collection_url', 'publisher','_created_timestamp']}
            /> */}
          </dl>
        </div>

      </div>
      {/* <div className='py-10 px-2'>
          <div className='text-gray-500 py-8 px-5'>Versions</div>
          <div className=''>
            <Versions collection={collection} views={views} />
          </div>
        </div> */}
        <div className="grid gap-4 grid-cols-6 items-center  px-4 py-5 mr-5 sm:p-0">
          <div className="col-span-1 text-xl text-gray-700 font-medium">
            Symbologies:
          </div>
          <div className="col-end-7">
            <Link 
              className="flex items-center p-1 text-center bg-green-300 border border-green-200 shadow hover:bg-green-500 hover:text-white"
              to={`${baseUrl}/create/collection`}
            >
              Create new symbology
              <i className="ml-1 fad fa-plus fa-2x" />
            </Link>
          </div>
          <div className="col-span-6">
            {/*<Symbologies collection={collection} symbologies={symbologies} />*/}
          </div>

        </div>
    </div>
  )
}


export default OverviewPage
