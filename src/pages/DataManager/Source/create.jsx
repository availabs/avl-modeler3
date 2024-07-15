import React, { useEffect, useMemo, useState } from 'react';

import { /*useFalcor,*//*TopNav,*/ Input /*withAuth, Input, Button*/ } from '../../../modules/avl-components/src'

import get from 'lodash/get'
// import { useParams } from 'react-router-dom'
import { damaDataTypes } from '../DataTypes'

import SourcesLayout from './layout'

import {SourceAttributes, /*ViewAttributes, getAttributes*/} from './attributes'
    
import { DamaContext } from "../store";

const SourceCreate = ({baseUrl}) => {
// prettier canary
  //const {falcor, falcorCache} = useFalcor()
  const [ source, setSource ] = useState( 
    Object.keys(SourceAttributes)
      .filter(d => !['source_id', 'metadata','statistics'].includes(d))
      .reduce((out,current) => {
        out[current] = ''
        return out
      }, {})
  )

  const [dataTypes, setDataTypes] = useState(null);

  const {pgEnv} = React.useContext(DamaContext)

  useEffect(() => {
    (async () => {
      const filteredDataTypeKeys = (
        await Promise.all(
          Object.keys(damaDataTypes).map(async (dt) => {
            

            if (damaDataTypes[dt].getIsAlreadyCreated) {
              const exclude = await damaDataTypes[dt].getIsAlreadyCreated(pgEnv);

              if (exclude) {
                return null;
              }
            }

            return dt;
          })
        )
      ).filter(Boolean);

      const filteredDataTypes = filteredDataTypeKeys.reduce((acc, dt) => {
        acc[dt] = damaDataTypes[dt];
        return acc;
      }, {});
      //console.log('testing',filteredDataTypes)
      setDataTypes(filteredDataTypes);
    })();
  }, [pgEnv]);

  const CreateComp = useMemo(() => get(dataTypes, `[${source.type}].sourceCreate.component`, () => <div />)
    ,[dataTypes, source.type])
  
  // console.log('new source', CreateComp)

  if (dataTypes === null) {
    return <div>Requesting data types statuses</div>;
  }

  // console.log('new source', CreateComp)
  
  return (
    <div>
      {/*<div className='fixed right-0 top-[170px] w-64 '>
          <pre>
            {JSON.stringify(source,null,3)}
          </pre>
      </div>*/}
      <SourcesLayout>
        
      <div className='p-4 font-medium'> Create New Source </div>
      
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-gray-200">
          {Object.keys(SourceAttributes)
            .filter(d => !['source_id','metadata','description', 'type','statistics', 'category', 'update_interval', 'categories', 'display_name'].includes(d))
            .map((attr,i) => {
              // let val = typeof source[attr] === 'object' ? JSON.stringify(source[attr]) : source[attr]
              return (
                <div key={i} className='flex justify-between group'>
                  <div  className="flex-1 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 py-5">{attr}</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                     
                        <div className='pt-3 pr-8'>
                          <Input 
                            className='w-full p-2 flex-1 px-2 shadow bg-grey-50 focus:bg-blue-100  border-gray-300 ' 
                            value={get(source, attr, '')} 
                            onChange={e => {
                              //console.log('hello', e, attr, {[attr]: e, ...source})
                              setSource({ ...source, [attr]: e,})
                            }}/>
                        </div> 
                       
                      
                    </dd>
                  </div>

                 
                </div>
              )
            })
          }
          <div  className='flex justify-between group'>
            <div  className="flex-1 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 py-5">Data Type</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
               
                  <div className='pt-3 pr-8'>
                    <select 
                      className='w-full bg-white p-3 flex-1 shadow bg-grey-50 focus:bg-blue-100  border-gray-300' 
                      value={get(source, 'type', '')} 
                      onChange={e => {
                        //console.log('hello', e, attr, {[attr]: e, ...source})
                        setSource({ ...source, type: e.target.value,})
                      }}>
                        <option value="" disabled >Select your option</option>
                        {Object.keys(dataTypes || [])
                          .filter(k => dataTypes[k].sourceCreate)
                          .map(k => <option key={k} value={k} className='p-2'>{k}</option>)
                        }
                    </select>
                  </div> 
                 
                
              </dd>
            </div>
          </div>
        </dl>
        <CreateComp source={source} baseUrl={baseUrl}/>
      </div>
  </SourcesLayout>
</div>
  )
}





export default SourceCreate;
