import React, { useEffect, /*useMemo,*/ useState } from 'react';
import { Button } from "../../../../../modules/avl-components/src"
import { DamaContext } from "../../../../../pages/DataManager/store"
import { useParams, Link } from "react-router-dom";
import TaskList from "../../../../../pages/DataManager/Tasks/TaskList"

const AdminPage = ({source, views, activeViewId, }) => {
  const currentKeys = ['Guest User', 'Public User', 'Agency User'];
  const currentRoles = ['view', 'download'];

  const currentAccess = Object.assign({}, ...currentKeys.map((key) => {
    return {
      [key]: Object.assign({}, ...currentRoles.map((role) => { return { [role]: false} }))
    };
  }));

  const [editing, setEditing] = React.useState(currentAccess);
  const { sourceId } = useParams();
  const {pgEnv, baseUrl, user, falcor} = React.useContext(DamaContext);
  const {visibility = 'visible'} = source?.statistics || {};
  const {access = currentAccess} = source?.statistics || {};

  const updateVisibilityData = async() => {
    const sourceStatistics = source?.statistics || {};
    sourceStatistics['visibility'] = visibility == 'hidden' ? 'visible' : 'hidden';

    await falcor.set({
      paths: [['dama', pgEnv, 'sources', 'byId', sourceId, 'attributes', "statistics"]], jsonGraph: {
          dama: {
              [pgEnv]: {
                  sources: {
                      byId: {
                          [sourceId]: {
                              attributes: {statistics: JSON.stringify(sourceStatistics)}
                          }
                      }
                  }
              }
          }
      }
    })
  };

  const updateAccess = async(group, control, event) => {
    const ca = JSON.parse(JSON.stringify(access));
    ca[group][control] = event.target.checked;
    const sourceStatistics = source?.statistics || {};
    sourceStatistics['access'] = ca;
    
    await falcor.set({
      paths: [['dama', pgEnv, 'sources', 'byId', sourceId, 'attributes', "statistics"]], jsonGraph: {
          dama: {
              [pgEnv]: {
                  sources: {
                      byId: {
                          [sourceId]: {
                              attributes: {statistics: JSON.stringify(sourceStatistics)}
                          }
                      }
                  }
              }
          }
      }
    });
  }

  return (
    <div>
      <div className=" flex flex-col md:flex-row">
        <div className='flex-1'>
          <div className='flex justify-between group'>
            <div  className="flex-1 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              {/*<dt className="text-sm font-medium text-gray-500 py-5">name</dt>*/}
              <dd className="mt-1 text-2xl text-gray-700 font-medium overflow-hidden sm:mt-0 sm:col-span-3">
                Admin
              </dd>
            </div>
          </div>
          <div className='flex-1 border-b-2 '>
            <div className="py-4">
              <div className="flex items-center border-t-2 ">
                <div className='py-3 px-6 text-blue-500 font-medium text-lg'> Access Controls</div>
              </div>
            </div>
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-center" style={{ paddingRight: "40px" }}>
                      
                    </th>
                    <th className="text-center">
                      Show
                    </th>
                    <th className="text-center">
                      Download
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentKeys.map((key, i) => {
                    return (
                      <tr key={i} className='border-b-2 '>
                        <td className='p-2'>{key}</td>
                        <td className="text-center">
                          <input
                            type='checkbox'
                            checked={access[key]['view']}
                            onChange={(e) => updateAccess(key, 'view', e)}  
                          />
                        </td>
                        <td className="text-center">
                          <input
                            type='checkbox'
                            checked={access[key]['download']}
                            onChange={(e) => updateAccess(key, 'download', e)}
                          />
                        </td>
                      </tr>
                    )
                  })}
                  
                </tbody>
              </table>
            </div>
        </div>
        <div className="w-72 ">
          <div> Admin Actions </div>
          <div className="w-full p-1 flex">
            <Link 
                className={"w-full flex-1 text-center border shadow hover:bg-blue-100 p-4"}
                to={`${baseUrl}/source/${source.source_id}/meta_advanced`}>
                  Advanced Metadata <i className='fa fa-circle-info' />
            </Link>
          </div>
            <div className="w-full p-1 flex">
            <Link
                className={"w-full flex-1 text-center border shadow hover:bg-blue-100 p-4"}
                to={`${baseUrl}/source/${source.source_id}/add_version`}>
                  Add Version <i className='fad fa-upload' />
            </Link>
          </div>
          <div className='flex w-full p-1'>
              <Link onClick={updateVisibilityData}
                  className={"w-full flex-1 text-center border shadow hover:bg-blue-100 p-4"}
                  style={{backgroundColor: visibility == 'visible'?'lightgreen': '#FF7276'}}
                  > 
                    Visibile {visibility == 'visible'? "ON" : "OFF"}
              </Link>
              
          </div>
          <div className="w-full p-1 flex">
            <Link 
                className={"w-full flex-1 text-center bg-red-100 border border-red-200 shadow hover:bg-red-400 hover:text-white p-4"}
                to={`${baseUrl}/delete/source/${source.source_id}`}> 
                  Delete <i className='fad fa-trash' />
            </Link>
          </div>
          
          
          
        </div>

      </div>
      <div className='py-10 px-2'>
        <TaskList sourceId={sourceId}/>
      </div>
    </div>
  )
}


export default AdminPage    
