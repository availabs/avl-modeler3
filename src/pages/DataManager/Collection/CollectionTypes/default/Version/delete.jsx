import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import get from "lodash/get";
import { DamaContext } from "../../../../store";
import {DAMA_HOST} from '../../../../../../config'

async function getData({ falcor, pgEnv, viewId }) {
  const data = await falcor.get(
    ["dama", pgEnv, "views", "byId", viewId, "dependents"],
    ["dama", pgEnv, "views", "byId", viewId, "attributes", "source_id"]
  );

  // collect all dependency sources, fetch meta for them.
  const tmpSrcIds = [];
  const tmpViewIds = [];

  get(data, ["json", "dama", pgEnv, "views", "byId", viewId, "dependents"])
    .forEach(d => {
      tmpSrcIds.push(
        d.source_id
      );
      tmpViewIds.push(
        d.view_id
      );
    });

  await falcor.get(["dama", pgEnv, "sources", "byId", tmpSrcIds, "attributes", ["type", "name"]]);

  await falcor.get(["dama", pgEnv, "views", "byId", tmpViewIds, "attributes", ["version", "metadata", "_modified_timestamp", "last_updated"]]);

  const falcorCache = falcor.getCache();

  return {
    dependents: get(falcorCache, ["dama", pgEnv, "views", "byId", viewId, "dependents", "value"], []),
    sourceId: get(data, ["json", "dama", pgEnv, "views", "byId", viewId, "attributes", "source_id"], []),
    srcMeta: get(falcorCache, ["dama", pgEnv, "sources", "byId"], {}),
    viewMeta: get(falcorCache, ["dama", pgEnv, "views", "byId"], {})
  };
}

const DeleteButton = ({ text, viewId, sourceId, pgEnv, baseUrl, falcor }) => {
  const navigate = useNavigate();
  return (
    <button
      className={"bg-red-50 hover:bg-red-400 hover:text-white p-2"}
      onClick={async () => {
        console.log('I am deleteing the view id ', viewId)
        await fetch(`${DAMA_HOST}/dama-admin/${pgEnv}/deleteDamaView`, {
          method: "POST",
          body: JSON.stringify({ "view_id": viewId }),
          headers: {
            "Content-Type": "application/json"
          }
        });

        await falcor.invalidate(["dama", pgEnv, "sources", "byId", sourceId, "views", "length"])
        navigate(`${baseUrl}/source/${sourceId}/versions`);
      }}
    >

      {text}
    </button>
  );
};

const RenderDependents = ({ dependents, viewId, srcMeta, viewMeta }) => {
  return (
    <div className="w-full p-4 shadow mb-4">
      <label className={"text-lg"}>Dependents</label>
      <div className="py-4 sm:py-2 mt-2 sm:grid sm:grid-cols-5 sm:gap-20 sm:px-6 border-b-2">
        {
          ["Source Name", "Type", "Version", "Last Updated"]
            .map(key => (
              <dt key={key} className="text-sm font-medium text-gray-600">
                {key}
              </dt>
            ))
        }
      </div>
      <dl className="sm:divide-y sm:divide-gray-200">
        {
          dependents
            .map((d, i) => (
                <div key={`${i}_0`} className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-20 sm:px-6">
                  <dd key={`${i}_1`} className="mt-1 text-sm text-gray-900 sm:mt-0 align-middle">
                    <Link to={`/source/${d.source_id}/overview`}>
                      {get(srcMeta, [d.source_id, "attributes", "name"])}
                    </Link>
                  </dd>

                  <dd key={`${i}_2`} className="mt-1 text-sm text-gray-900 sm:mt-0 align-middle">
                    <Link to={`/source/${d.source_id}/overview`}>
                      {get(srcMeta, [d.source_id, "attributes", "type"])}
                    </Link>
                  </dd>

                  <dd key={`${i}_3`} className="mt-1 text-sm text-gray-900 sm:mt-0 align-middle">
                    <Link to={`/source/${d.source_id}/views/${d.view_id}`}>
                      {get(viewMeta, [d.view_id, "attributes", "version"])}
                    </Link>
                  </dd>

                  <dd key={`${i}_4`} className="mt-1 text-sm text-gray-900 sm:mt-0 align-middle">
                    <Link to={`/source/${d.source_id}/views/${d.view_id}`}>
                      {typeof get(viewMeta, [d.view_id, "attributes", "_modified_timestamp", "value"]) === "object" ? "" :
                        get(viewMeta, [d.view_id, "attributes", "_modified_timestamp", "value"])
                      }
                    </Link>
                  </dd>

                  <dd key={`${i}_5`} className="mt-1 text-sm text-red-400 sm:mt-0">
                                        <span className={"float-right italic"}> {
                                          get(viewMeta, [d.view_id, "attributes", "metadata", "value", "authoritative"]) === "true" ? ""
                                            : "outdated"
                                        }</span>
                  </dd>
                </div>

              )
            )
        }
      </dl>

    </div>
  );
};

const LoadDependentViews = (dependents, sourceId, viewId, srcMeta, viewMeta, pgEnv, baseUrl, falcor) => (
  <>
    <div className={"pb-4 flex justify-between"}>
      <label>The View has following dependents:</label>

      <DeleteButton text={"Delete anyway"} viewId={viewId} sourceId={sourceId} pgEnv={pgEnv} baseUrl={baseUrl} falcor={falcor}/>
    </div>

    <div className={"bg-red-50"}>
      <RenderDependents viewId={viewId} srcMeta={srcMeta} viewMeta={viewMeta} dependents={dependents} />
    </div>
  </>);

const LoadConfirmDelete = (viewId, sourceId, pgEnv, baseUrl, falcor) => (
  <div className={"pb-4 flex justify-between"}>
    <label>No dependents found.</label>

    <DeleteButton text={"Confirm Delete"} viewId={viewId} sourceId={sourceId} pgEnv={pgEnv} baseUrl={baseUrl} falcor={falcor} />
  </div>
);

export default function Popup() {
  const { sourceId, viewId } = useParams();
  const {pgEnv, baseUrl, falcor, falcorCache } = React.useContext(DamaContext);

  useEffect(() => {
    getData({ falcor, pgEnv, viewId });
  }, [viewId, pgEnv, falcor]);

  const dependents = get(falcorCache, ["dama", pgEnv, "views", "byId", viewId, "dependents", "value"], []),
    srcMeta = get(falcorCache, ["dama", pgEnv, "sources", "byId"], {}),
    viewMeta = get(falcorCache, ["dama", pgEnv, "views", "byId"], {});

  return (
    <div className="w-full p-4 bg-white my-1 block border shadow">
      <div className={"pb-4 font-bold"}>Delete <i>{viewId}</i></div>
      {dependents.length ? LoadDependentViews(dependents, sourceId, viewId, srcMeta, viewMeta, pgEnv, baseUrl, falcor) : LoadConfirmDelete(viewId, sourceId, pgEnv, baseUrl, falcor)}
    </div>
  );
}