import React, { useReducer, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { DamaContext } from "../../../../../../pages/DataManager/store"
import { DAMA_HOST } from "../../../../../../config";
import { reducer } from "./components/reducer";

import UploadFileComp from "./uploadFile";
import SelectLayerComp from "./selectLayer";
import SchemaEditorComp from "./schemaEditor";
import PublishComp from "./publish";

const BlankComponent = () => <></>;

export default function UploadGisDataset({
  source = {},
  user = {},
  dataType = "gis_dataset",
  CustomAttributes = BlankComponent,
  tippecanoeOptions = {},
  customRules = {},
  databaseColumnNames = null,
}) {

  // console.log('tippecanoeOptions', tippecanoeOptions)
  const { name: damaSourceName, source_id: sourceId, type } = source;
  const { pgEnv, baseUrl, falcor } = React.useContext(DamaContext);

  const navigate = useNavigate()
 
  const [state, dispatch] = useReducer(reducer, {
    damaSourceId: sourceId,
    databaseColumnNames: databaseColumnNames ? 
      databaseColumnNames : 
      (source?.metadata?.columns || source?.metadata || []).map(d => d.name),
    damaSourceName: damaSourceName,
    userId: 7,
    etlContextId: null,
    customViewAttributes: { years: [] },
    dataType: dataType,
    // maxSeenEventId: null,
    damaServerPath: `${DAMA_HOST}/dama-admin/${pgEnv}`,

    // uploadFile state
    gisUploadId: null,
    fileUploadStatus: null,
    uploadedFile: null,
    uploadErrMsg: null,
    polling: false,
    pollingInterval: null,

    // selectLayer state
    layerNames: null,
    layerName: null,
    lyrAnlysErrMsg: null,
    layerAnalysis: null,

    // schemaEditor state
    
    tableDescriptor: null,
    mbtilesOptions: { preserveColumns: {}, ...tippecanoeOptions },

    // publish state
    publishStatus: "AWAITING",
    publishErrMsg: null,

    // source
    sourceType: type,
  });

  useEffect(() => {
    dispatch({ type: "update", payload: { damaSourceName } });
  }, [damaSourceName]);

  useEffect(() => {
    dispatch({ type: "update", payload: { sourceType: type } });
  }, [type]);

  useEffect(() => {
    if (state.publishStatus === "PUBLISHED") {
      if (state.damaSourceId && state.etlContextId) {
        falcor.invalidate([
          "dama",
          pgEnv,
          "sources",
          "byId",
          state.damaSourceId,
          "views",
          "length",
        ]);
      } else {
        falcor.invalidate(["dama", pgEnv, "sources", "length"]);
      }
      console.log('publish done', state, state.damaSourceId)
      navigate(`${baseUrl}/source/${state.damaSourceId}/uploads/${state.etlContextId}`);
    }
  }, [state.publishStatus, state.damaSourceId, pgEnv, navigate]);

  useEffect(() => {
    // on page load get etl context
    // TODO :: probably want to move this to on file upload
    // currently it runs every refresh leaving orphaned contextIds
    
    async function getContextId () {
      const newEtlCtxRes = await fetch(
        `${state.damaServerPath}/etl/new-context-id`
      );
      const newEtlCtxId = +(await newEtlCtxRes.text());
      dispatch({ type: "update", payload: { etlContextId: newEtlCtxId } });
    };

    getContextId()
  }, [pgEnv, state.damaServerPath]);

  if (!sourceId && !damaSourceName) {
    return <div> Please enter a datasource name.</div>;
  }

  const canUpload = Object.keys(customRules)?.reduce((out, ruleKey) => {
    if (customRules[ruleKey](state) !== "canUpload") {
      out = customRules[ruleKey](state);
    }
    return out;
  }, "canUpload");

  return (
    <div>
      <CustomAttributes state={state} dispatch={dispatch} />

      {canUpload === "canUpload" ? (
        <UploadFileComp state={state} dispatch={dispatch} />
      ) : (
        canUpload
      )}

      <SelectLayerComp state={state} dispatch={dispatch} />
      <SchemaEditorComp state={state} dispatch={dispatch} />
      <PublishComp state={state} dispatch={dispatch} />
    </div>
  );
}
