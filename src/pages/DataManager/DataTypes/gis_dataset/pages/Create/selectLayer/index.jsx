import React, {useEffect} from "react";
import { LayerAnalysisSection } from './components'

export default function SelectLayer({state, dispatch}) {
  
  const { 
    damaServerPath,
    gisUploadId, 
    uploadedFile, 
    layerNames, 
    layerName
  } = state

  useEffect(() => {
    // get Layer Names ater file is successfully uploaded
    if (gisUploadId && uploadedFile) {
      try {
        const fetchData = async (gisUploadId) => {
          const url = `${damaServerPath}/gis-dataset/${gisUploadId}/layerNames`;
          const layerNamesRes = await fetch(url);
          const layerNames = await layerNamesRes.json();
          // set all layernames && select first layerName
          dispatch({type: 'update', payload: {layerNames, layerName: layerNames[0]}});
        }
        fetchData(gisUploadId)
      } catch (err) {
        // console.log('got an error', error)
        // console.error(err);
        dispatch({type: 'update', payload: {lyrAnlysErrMsg: err.message}});
      }
    }
  }, [ gisUploadId, uploadedFile, damaServerPath, dispatch ]);

  useEffect(() => {
    // when layer is selected get analysis of layer
    if (gisUploadId && layerName) {
      try {
        const fetchData = async (gisUploadId, layerName) => {
          const lyrAnlysRes = await fetch(
            `${damaServerPath}/gis-dataset/${gisUploadId}/${layerName}/layerAnalysis`
          );
          const lyrAnlys = await lyrAnlysRes.json();
          dispatch({type: 'update', payload: {layerAnalysis: lyrAnlys}});
        }
        fetchData(gisUploadId, layerName)
      } catch (err) {
        dispatch({type: 'update', payload: {lyrAnlysErrMsg: err.message}});
      }
    }
  }, [gisUploadId, layerName, damaServerPath, dispatch]);

  if (!layerNames) {
    return "";
  }  

  return (
    <div className='border-t border-gray-200 w-full'>
      <table className="w-full ">
        <tbody>
          <tr>
            <td className="py-4 text-left">Select Layer</td>
            <td className="py-4 text-center">
              <select
                className="text-center w-1/2 bg-white p-2 shadow bg-grey-50 focus:bg-blue-100 border-gray-300"
                value={layerName || ""}
                onChange={(e) => dispatch({type:'update', payload: {layerName: e.target.value}})}
              >
                {["", ...layerNames].map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </td>
          </tr>
          </tbody>
      </table>
      <LayerAnalysisSection state={state} />
    </div>
  );
}
