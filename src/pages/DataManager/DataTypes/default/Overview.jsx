import React, {useEffect, /*useMemo,*/ useState} from 'react';
import {Input, Button} from "../../../../modules/avl-components/src"
import get from 'lodash/get'
import {SourceAttributes} from '../../../../pages/DataManager/Source/attributes'
import {DamaContext} from "../../../../pages/DataManager/store"
import Versions from './Version/list'
import {VersionEditor, VersionDownload} from './Version/version'
import SourceCategories from "./SourceCategories"
import Metadata from './Metadata/basic.jsx'

const Edit = ({
                  startValue, attr, sourceId, type = 'text', cancel = () => {
    }
              }) => {
    const [value, setValue] = useState('')
    //console.log('what is the value :', )
    const {pgEnv, baseUrl, falcor} = React.useContext(DamaContext);
    /*const [loading, setLoading] = useState(false)*/

    useEffect(() => {
        setValue(startValue)
    }, [startValue])

    const save = (attr, value) => {
        if (sourceId) {
            falcor.set({
                paths: [
                    ['dama', pgEnv, 'sources', 'byId', sourceId, 'attributes', attr]
                ],
                jsonGraph: {
                    dama: {
                        [pgEnv]: {
                            sources: {
                                byId: {
                                    [sourceId]: {
                                        attributes: {[attr]: value}
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
          <textarea
              className='flex-1 w-full px-2 shadow bg-blue-100 min-h-[200px] focus:ring-blue-700 focus:border-blue-500  border-gray-300 rounded-none rounded-l-md'
              onChange={e => setValue(e.target.value)}>
            {value}
          </textarea>
                </div>
                <div className='flex py-2'>
                    <div className='flex-1'/>
                    <Button themeOptions={{size: 'sm', color: 'primary'}}
                            onClick={e => save(attr, value)}> Save </Button>
                    <Button themeOptions={{size: 'sm', color: 'cancel'}} onClick={e => cancel()}> Cancel </Button>
                </div>
            </div>) : (
            <div className='w-full flex flex-1'>
                <Input
                    className='flex-1 px-2 shadow bg-blue-100 focus:ring-blue-700 focus:border-blue-500  border-gray-300 rounded-none rounded-l-md'
                    value={value} onChange={e => setValue(e)}/>
                <Button themeOptions={{size: 'sm', color: 'primary'}} onClick={e => save(attr, value)}> Save </Button>
                <Button themeOptions={{size: 'sm', color: 'cancel'}} onClick={e => cancel()}> Cancel </Button>
            </div>
        )
    )
}

const RenderPencil = ({user, editing, setEditing, attr}) => {
    if (user?.authLevel <= 5) return null;

    return (
        <div className='hidden group-hover:block text-blue-500 cursor-pointer'
             onClick={e => editing === attr ? setEditing(null) : setEditing(attr)}>
            <i className="fad fa-pencil absolute -ml-12 mt-3 p-2.5 rounded hover:bg-blue-500 hover:text-white "/>
        </div>
    )
}

const OverviewEdit = ({source, views, activeViewId}) => {
    const [editing, setEditing] = React.useState(null);
    const stopEditing = React.useCallback(e => {
        e.stopPropagation();
        setEditing(null);
    }, []);

    const {pgEnv, baseUrl, user} = React.useContext(DamaContext);
    const activeView = activeViewId || views[0]?.view_id;
    const latestView = views[views?.length - 1]?.view_id;
    const dateOptions = {year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "numeric"}
    const createdTimeStamp = new Date(views.filter(d => d.view_id === activeView)?.[0]?.['_created_timestamp'] || '').toLocaleDateString(undefined, dateOptions);
    const updatedTimeStamp = new Date(views.filter(d => d.view_id === latestView)?.[0]?.['_modified_timestamp'] || '').toLocaleDateString(undefined, dateOptions);

    const attrNameMap = {
        'update_interval': 'update interval'
    }
    const numCols = get(source, ["metadata", "columns"], get(source, "metadata", []))?.length;

    return (
        <div className='p-4'>
            <div className="flex flex-col md:flex-row">
                <div className='flex flex-col w-full md:w-[70%]'>
                    <div className='flex justify-between group'>
                        <div className="flex-1">
                            <dd className="mt-1 text-2xl text-blue-600 font-medium overflow-hidden sm:mt-0 sm:col-span-3">
                                {editing === 'name' ?
                                    <div className='pt-3 pr-8'>
                                        <Edit
                                            startValue={source['name']}
                                            attr={'name'}
                                            sourceId={source.source_id}
                                            cancel={stopEditing}
                                        />
                                    </div> :
                                    <div className='py-2 px-2'>{source['name']}</div>
                                }
                            </dd>
                        </div>
                        <RenderPencil attr={'name'} user={user} editing={editing} setEditing={setEditing}/>
                    </div>

                    <div className="w-full pl-4 py-2 sm:pl-6 flex justify-between group">
                        <div className="flex-1">
                            <div className='text-sm text-gray-500 pr-14'>
                                {editing === 'description' ?
                                    <Edit
                                        startValue={get(source, 'description', '')}
                                        attr={'description'}
                                        type='textarea'
                                        sourceId={source?.source_id}
                                        cancel={stopEditing}/> :
                                    get(source, 'description', false) || 'No Description'}
                            </div>
                        </div>
                        <RenderPencil attr={'description'} user={user} editing={editing} setEditing={setEditing}/>

                    </div>
                    <div className={'ml-4'}>
                        <VersionEditor
                            view={views.filter(d => d.view_id === activeView)?.[0] || {}}
                            columns={['publisher', 'source_url']}
                            flexDir={'col'}
                        />
                    </div>
                </div>

                <div className={'w-full md:w-[30%]'}>
                    <div className={'mt-2 flex flex-col px-6 text-sm text-gray-600'}>
                        Created
                        <span className={'text-l font-medium text-blue-600 '}>{createdTimeStamp}</span>
                    </div>

                    <div className={'mt-2 flex flex-col px-6 text-sm text-gray-600'}>
                        Updated
                        <span className={'text-l font-medium text-blue-600 '}>{updatedTimeStamp}</span>
                    </div>

                    <div key={'categories'} className='flex justify-between group'>
                        <div className="flex-1 sm:grid sm:grid-cols-2 sm:gap-1 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500 mt-1.5">{'Categories'}</dt>
                            <dd className="text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                <div className="pb-2 px-2 relative">
                                    <SourceCategories source={source}
                                                      editingCategories={editing === 'categories'}
                                                      stopEditingCategories={stopEditing}/>
                                </div>
                            </dd>
                        </div>
                        <RenderPencil attr={'categories'} user={user} editing={editing} setEditing={setEditing}/>
                    </div>

                    <div className="mx-5">
                        <div className="flex flex-row w-full">
                            {Object.keys(SourceAttributes)
                                .filter(d => ['type', 'update_interval'].includes(d))
                                .map((attr, i) => {
                                    let val = typeof source[attr] === 'object' ? JSON.stringify(source[attr]) : source[attr]
                                    return (
                                        <div key={attr}
                                             className='w-1/2 flex justify-between group hover:bg-blue-50 rounded-lg'>
                                            <div className="w-full flex flex-col space-between items-left">
                                                <div
                                                    className="text-sm font-medium text-gray-500 px-1 capitalize">{attrNameMap[attr] || attr}</div>
                                                <div className="text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                                    {editing === attr ?
                                                        <div className='pt-3 pr-8'>
                                                            <Edit
                                                                startValue={val}
                                                                attr={attr}
                                                                sourceId={source.source_id}
                                                                cancel={stopEditing}
                                                            />
                                                        </div> :
                                                        <div
                                                            className='py-2 px-2 font-semibold text-ellipsis uppercase'>{val || 'N/A'}</div>
                                                    }
                                                </div>
                                            </div>
                                            <RenderPencil attr={attr} user={user} editing={editing}
                                                          setEditing={setEditing}/>
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </div>
                </div>
            </div>

            <div className={'flex items-center p-2 mx-4 text-blue-600 hover:bg-blue-50 rounded-md'}
            >
                Columns
                <span className={'bg-blue-200 text-blue-600 text-xs p-1 ml-2 shrink-0 grow-0 rounded-lg flex items-center justify-center border border-blue-300'}>
                    {numCols}
                </span>
            </div>

            <Metadata source={source}/>

            <div className='py-5 pr-2'>
                <div className='p-2 mx-4 text-blue-600 hover:bg-blue-50 rounded-md'>Versions</div>
                <div className='px-5'>
                    <Versions source={source} views={views}/>
                </div>
            </div>
        </div>
    )
}


export default OverviewEdit
