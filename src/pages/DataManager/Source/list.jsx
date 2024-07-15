import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import get from "lodash/get";
import SourcesLayout from "./layout";
import { useParams } from "react-router-dom";
import { DamaContext } from "../../../pages/DataManager/store";
import { SourceAttributes, ViewAttributes, getAttributes } from "./attributes";

const SourceThumb = ({ source }) => {
  const {pgEnv, baseUrl, falcor, falcorCache} = React.useContext(DamaContext)

  useEffect(() => {
    async function fetchData() {
      const lengthPath = ["dama", pgEnv, "sources", "byId", source.source_id, "views", "length"];
      const resp = await falcor.get(lengthPath);
      await falcor.get([
        "dama", pgEnv, "sources", "byId",
        source.source_id, "views", "byIndex",
        { from: 0, to: get(resp.json, lengthPath, 0) - 1 },
        "attributes", Object.values(ViewAttributes)
      ]);
    }

    fetchData();
  }, [falcor, falcorCache, source, pgEnv]);


  return (
    <div className="w-full p-4 bg-white hover:bg-blue-50 block border shadow flex">
      <div>
        <Link to={`${baseUrl}/source/${source.source_id}`} className="text-xl font-medium w-full block">
          <span>{source.name}</span>
        </Link>
        <div>
          {(get(source, "categories", []) || [])
            .map(cat => (typeof cat === 'string' ? [cat] : cat).map((s, i) => (
              <Link key={i} to={`${baseUrl}/cat/${i > 0 ? cat[i - 1] + "/" : ""}${s}`}
                    className="text-xs p-1 px-2 bg-blue-200 text-blue-600 mr-2">{s}</Link>
            )))
          }
        </div>
        <Link to={`${baseUrl}/source/${source.source_id}`} className="py-2 block">
          {source.description}
        </Link>
      </div>

      
    </div>
  );
};


const SourcesList = () => {
  const [layerSearch, setLayerSearch] = useState("");
  const { cat1, cat2, ...rest } = useParams();
  const {pgEnv, baseUrl, falcor, falcorCache} = React.useContext(DamaContext);
  const [sort, setSort] = useState('asc');
  const sourceDataCat = 'Unknown'
  const isListAll = window.location.pathname.replace(`${baseUrl}/`, '')?.split('/')?.[0] === 'listall';

  useEffect(() => {
    async function fetchData() {
      const lengthPath = ["dama", pgEnv, "sources", "length"];
      const resp = await falcor.get(lengthPath);

      await falcor.get([
        "dama", pgEnv, "sources", "byIndex",
        { from: 0, to: get(resp.json, lengthPath, 0) - 1 },
        "attributes", Object.values(SourceAttributes)
      ]);
    }

    fetchData();
  }, [falcor, pgEnv]);

  const sources = useMemo(() => {
    return Object.values(get(falcorCache, ["dama", pgEnv, "sources", "byIndex"], {}))
      .map(v => getAttributes(get(falcorCache, v.value, { "attributes": {} })["attributes"]));
  }, [falcorCache, pgEnv]);

  const categories = [...new Set(
      sources
          .filter(source => {
            return isListAll || (!isListAll && !source.categories?.find(cat => cat.includes(sourceDataCat)))
          })
          .reduce((acc, s) => [...acc, ...(s.categories?.map(s1 => s1[0]) || [])], []))].sort()

  const categoriesCount = categories.reduce((acc, cat) => {
    acc[cat] = sources.filter(source => {
      return source.categories?.find(category => category.includes(cat))
    })?.length
    return acc;
  }, {})
  const actionButtonClassName = 'bg-transparent hover:bg-blue-100 rounded-sm p-2 ml-0.5 border-2'
  return (

    <SourcesLayout baseUrl={baseUrl} isListAll={isListAll}>
      <div className="py-4 flex flex-rows items-center">
        <input
            className="w-full text-lg p-2 border border-gray-300 "
            placeholder="Search datasources"
            value={layerSearch}
            onChange={(e) => setLayerSearch(e.target.value)}
        />

        <button
            className={actionButtonClassName}
            title={'Toggle Sort'}
            onClick={() => setSort(sort === 'asc' ? 'desc' : 'asc')}
        >
          <i className={`fa-solid ${sort === 'asc' ? `fa-arrow-down-z-a` : `fa-arrow-down-a-z`} text-xl text-blue-400`}/>
        </button>

        <Link
            to={isListAll ? `${baseUrl}` : `${baseUrl}/listall`}
            className={actionButtonClassName} title={isListAll ? 'View Key Sources' : 'View All Sources'}>
          <i className={`fa-solid ${isListAll ? `fa-filter-list` : `fa-list-ul`} text-xl text-blue-400`}/>
        </Link>

      </div>
      <div className={'flex flex-row'}>
        <div className={'w-1/4 flex flex-col space-y-1.5 max-h-[80dvh] overflow-auto scrollbar-sm'}>
          {(categories || [])
              .filter(cat => cat !== sourceDataCat)
              .sort((a,b) => a.localeCompare(b))
              .map(cat => (
              <Link
                  key={cat}
                  className={`${cat1 === cat || cat2 === cat ? `bg-blue-100` : `bg-white`} hover:bg-blue-50 p-2 rounded-md flex items-center`}
                  to={`${baseUrl}${isListAll ? `/listall` : ``}/cat/${cat}`}
              >
                <i className={'fa fa-category'} /> {cat}
                <div className={'bg-blue-200 text-blue-600 text-xs w-5 h-5 ml-2 shrink-0 grow-0 rounded-lg flex items-center justify-center border border-blue-300'}>{categoriesCount[cat]}</div>
              </Link>
          ))
          }
        </div>
        <div className={'w-3/4 flex flex-col space-y-1.5 ml-1.5 max-h-[80dvh] overflow-auto scrollbar-sm'}>
          {
            sources
                .filter(source => {
                  return isListAll || (!isListAll && !source.categories?.find(cat => cat.includes(sourceDataCat)))
                })
                .filter(source => {
                  let output = true;
                  if (cat1) {
                    output = false;
                    (get(source, "categories", []) || [])
                        .forEach(site => {
                          if (site[0] === cat1 && (!cat2 || site[1] === cat2)) {
                            output = true;
                          }
                        });
                  }
                  return output;
                })
                .filter(source => {
                  let searchTerm = (source.name + " " + (source?.categories || [])
                      .reduce((out,cat) => {
                        out += Array.isArray(cat) ? cat.join(' ') : typeof cat === 'string' ? cat : '';
                        return out
                      },'')) //get(source, "categories[0]", []).join(" "));
                  return !layerSearch.length > 2 || searchTerm.toLowerCase().includes(layerSearch.toLowerCase());
                })
                .sort((a,b) => {
                  const m = sort === 'asc' ? 1 : -1;
                  return m * a.name?.localeCompare(b.name)
                })
                .map((s, i) => <SourceThumb key={i} source={s} baseUrl={baseUrl} />)
          }
        </div>
      </div>
    </SourcesLayout>

  );
};


export default SourcesList;
