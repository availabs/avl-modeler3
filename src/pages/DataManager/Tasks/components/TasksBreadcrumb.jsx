
import React, { useEffect, useMemo } from 'react';

import { DamaContext } from '../../store'

import { ETL_CONTEXT_ATTRS } from '../TaskList'
import { Link, useParams } from 'react-router-dom'
import get from 'lodash/get'

export const getAttributes = (data) => {
  return Object.entries(data || {})
    .reduce((out,attr) => {
      const [k,v] = attr
      typeof v.value !== 'undefined' ? 
        out[k] = v.value : 
        out[k] = v
      return out 
    },{})
}

export const TasksBreadcrumb =  ({fullWidth}) => {
  const { etl_context_id} = useParams()
  const { pgEnv, baseUrl, falcor , falcorCache } = React.useContext(DamaContext)

  useEffect(() => {
    async function fetchData() {
      return await falcor
        .get([
          "dama",
          pgEnv,
          "etlContexts",
          "byEtlContextId",
          etl_context_id,
          "attributes",
          ETL_CONTEXT_ATTRS,
        ])
        .then((data) => {
          const etlAttr = getAttributes(
            get(
              data,
              [
                "json",
                "dama",
                pgEnv,
                "etlContexts",
                "byEtlContextId",
                etl_context_id,
              ],
              { attributes: {} }
            )
          );

          if (Object.keys(etlAttr).length) {
            falcor.get([
              "dama",
              pgEnv,
              "sources",
              "byId",
              [etlAttr?.meta?.source_id],
              "attributes",
              "name",
            ]);
          }
        });
    }

    if (etl_context_id) {
      fetchData();
    }
  }, [falcor, etl_context_id, pgEnv]);

  const pages = useMemo(() => {
    const attr = getAttributes(
      get(
        falcorCache,
        ["dama", pgEnv, "etlContexts", "byEtlContextId", etl_context_id],
        { attributes: {} }
      )["value"]
    );

    let contextSourceName = get(
      falcorCache,
      [
        "dama",
        pgEnv,
        "sources",
        "byId",
        [attr?.meta?.source_id],
        "attributes",
        "name",
      ],
      ""
    );
    const initialEvent = attr?.events?.find((event) =>
      event.type.toLowerCase().includes("initial")
    );
    contextSourceName = typeof contextSourceName === 'string' ? contextSourceName : "";

    if (initialEvent && initialEvent.type) {
      contextSourceName += " " + initialEvent.type.split(":")[0];
    }

    const pageArray = [{ name: contextSourceName }];
    return pageArray;
  }, [falcorCache, etl_context_id, pgEnv, baseUrl]);

  return (
    <nav className="border-b border-gray-200 flex " aria-label="Breadcrumb">
      <ol className={`${fullWidth ? `w-full` : `max-w-screen-xl w-full mx-auto`}  px-4 flex space-x-4 sm:px-6 lg:px-8`}>
        <li className="flex">
          <div className="flex items-center">
            <Link to={`${baseUrl || '/'}`} className={"hover:text-[#bbd4cb] text-[#679d89]"}>
              <i className="fad fa-database flex-shrink-0 h-5 w-5" aria-hidden="true" />
              <span className="sr-only">Home</span>
            </Link>
          </div>
        </li>
        <li className="flex">
          <div className="flex items-center">
          <svg
                className="flex-shrink-0 w-6 h-full text-gray-300"
                viewBox="0 0 30 44"
                preserveAspectRatio="none"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M.293 0l22 22-22 22h1.414l22-22-22-22H.293z" />
              </svg>
            <Link to={`${baseUrl}/tasks`} className={"ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"}>
              All Tasks
            </Link>
          </div>
        </li>
        {pages.map((page,i) => (
          <li key={i} className="flex">
            <div className="flex items-center">
              <svg
                className="flex-shrink-0 w-6 h-full text-gray-300"
                viewBox="0 0 30 44"
                preserveAspectRatio="none"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M.293 0l22 22-22 22h1.414l22-22-22-22H.293z" />
              </svg>
              {page.href ? 
                <Link
                  to={page.href}
                  className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
                  aria-current={page.current ? 'page' : undefined}
                >
                  {page.name}
                </Link> :
                <div
                  className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
                  aria-current={page.current ? 'page' : undefined}
                >
                  {page.name}
                </div> 
              }
            </div>
          </li>
        ))}
      </ol>
    </nav>
  )
}
