import React, { useEffect, useMemo, useState } from "react";
import { DAMA_HOST } from "../../../../../config";
import get from "lodash/get";
import { DamaContext } from "../../../../../pages/DataManager/store";

const GIS_DATASET_EVENT_TYPE = "gis-dataset";
const OGR_EVENT_TYPE = `${GIS_DATASET_EVENT_TYPE}:ogr_data`;

const UPLOAD_EVENT_TYPE = 'upload';
const GIS_FILE_UPLOAD_PROGRESS_EVENT_TYPE = `${UPLOAD_EVENT_TYPE}:GIS_FILE_UPLOAD_PROGRESS`;

const FINAL_EVENT_TYPE = "final";
const PROGRESS_EVENTS = [GIS_FILE_UPLOAD_PROGRESS_EVENT_TYPE,OGR_EVENT_TYPE]
const GIS_DATASET_SOURCE_TYPE = "gis_dataset";

export default function Upload({ ctxId }) {
  const { pgEnv, falcor, falcorCache } = React.useContext(DamaContext);

  const damaServerPath = `${DAMA_HOST}/dama-admin/${pgEnv}`
  const [polling, setPolling ] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(false);
  const [progress, setProgress] = useState();

  useEffect(() => {
    async function getCtxById() {
      await falcor.get(["dama", pgEnv, "etlContexts", "byEtlContextId", ctxId]);
    }
    getCtxById();
  }, [falcor, pgEnv, ctxId]);
  const ctx = useMemo(() => {
    return get(falcorCache, [
      "dama",
      pgEnv,
      "etlContexts",
      "byEtlContextId",
      ctxId,
      "value",
    ]);
  }, [falcorCache]);

  useEffect(() => {
    async function getSource() {
      if (ctx?.meta?.source_id) {
        return await falcor.get([
          "dama",
          pgEnv,
          "sources",
          "byId",
          ctx?.meta?.source_id,
          "attributes",
          "type"
        ]);
      } else {
        return null;
      }
    }
    getSource();
  }, [falcor, pgEnv, ctx?.meta?.source_id]);
  const source = useMemo(() => {
    return get(falcorCache, [
      "dama",
      pgEnv,
      "sources",
      "byId",
      ctx?.meta?.source_id,
      "attributes"
    ]);
  }, [falcorCache]);

  useEffect(() => {
    const hasFinalEvent = ctx?.events.some((ctxEvent) =>
      ctxEvent.type.toLowerCase().includes(FINAL_EVENT_TYPE)
    );
    if (
      ctx?.events &&
      source.type === GIS_DATASET_SOURCE_TYPE &&
      !hasFinalEvent
    ) {
      //We officially have an etlContext that is eligible for a progress bar
      const dataEvents = ctx?.events.filter(
        (event) => event.type === OGR_EVENT_TYPE
      );
      const dataEventPayloads = dataEvents.map((event) => event.payload.data);
      const newProgressValue = dataEventPayloads[dataEventPayloads.length - 1];
      setProgress(newProgressValue);
      setPolling(true);
    } else {
      setProgress(undefined);
      setPolling(false);
    }
  }, [ctx?.events]);

  // --- Poll Upload Progress  
  useEffect(() => {
    const doPolling = async () => {
      falcor.invalidate(["dama", pgEnv, "etlContexts", "byEtlContextId", ctxId])
      await falcor.get(["dama", pgEnv, "etlContexts", "byEtlContextId", ctxId]);
    }
    // -- start polling
    if(polling && !pollingInterval) {
      let id = setInterval( doPolling, 3000)
      setPollingInterval(id);
    } 
    // -- stop polling
    else if(pollingInterval && !polling) {
      clearInterval(pollingInterval)
      // run polling one last time in case it never finished
      doPolling()
      setPolling(false)
      setPollingInterval(null);
      setProgress(undefined)
    }
  }, [polling, pollingInterval, damaServerPath, progress])  

  return (
    <div className="w-full p-4 bg-white shadow mb-4">
      {progress !== undefined && <ProgressBar progress={(progress)}/>}
      {ctx && ctx?.events && ctx?.events?.length ? (
        <>
          <div className="py-4 sm:py-2 mt-2 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6 border-b-2">
            {["Id", "Event Type", "Data", "Timestamp"].map((key) => (
              <dt key={key} className="text-sm font-medium text-gray-600">
                {key}
              </dt>
            ))}
          </div>
          <dl className="sm:divide-y sm:divide-gray-200 odd:bg-white even:bg-slate-50">
            {(ctx?.events?.filter(ctxEvent => !PROGRESS_EVENTS.includes(ctxEvent.type)) || []).map((d, i) => (
              <div
                key={`${i}_0`}
                className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6 cursor-pointer hover:bg-slate-200"
              >
                <dd
                  key={`${i}_1`}
                  className="mt-1 text-sm text-gray-900 sm:mt-0 align-middle break-words"
                >
                  {d?.event_id}
                </dd>
                <dd
                  key={`${i}_2`}
                  className="mt-1 text-sm text-gray-900 sm:mt-0 align-middle break-words"
                >
                  {d?.type?.split(":").pop()}
                </dd>
                <dd
                    key={`${i}_3`}
                    className="mt-1 text-sm text-gray-900 sm:mt-0 align-middle break-words"
                >
                  {JSON.stringify(d?.payload?.data)}
                </dd>
                <dd
                  key={`${i}_4`}
                  className="mt-1 text-sm text-gray-900 sm:mt-0 align-middle break-words"
                >
                  {d._created_timestamp}
                </dd>
              </div>
            ))}
          </dl>
        </>
      ) : (
        <div className="text-center">{"No Events found"}</div>
      )}
    </div>
  );
}

//RYAN TODO -- this will display the initial message about "gis dataset already exists"
//thatis a bug
const ProgressBar = ({ progress }) => {
  const Parentdiv = {
    display: "inline-block",
    height: "100%",
    width: "100%",
    backgroundColor: "whitesmoke",
    borderRadius: 40,
    margin: 0,
  };

  const Childdiv = {
    display: "inline-block",
    height: "84%",
    width: `${progress}%`,
    backgroundColor: "#3b82f680",
    borderRadius: 40,
    textAlign: "right",
  };

  const progresstext = {
    padding: 10,
    color: "black",
    fontWeight: 900,
  };

  return (
    <div style={Parentdiv}>
      <span
        style={{
          fontWeight: "bold",
          paddingLeft: "10px",
          paddingRight: "10px",
        }}
      >
        {" "}
        Proccessed:
      </span>

      <div style={Childdiv}>
        <span style={progresstext}>{`${progress}%`}</span>
      </div>
    </div>
  );
}
