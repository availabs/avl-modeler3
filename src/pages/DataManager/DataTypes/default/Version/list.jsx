import React, {Fragment} from "react";
import { Table } from "../../../../../modules/avl-components/src";
import get from "lodash/get";
import { Link, useParams } from "react-router-dom";
import { formatDate } from "../../../utils/macros";
import { DamaContext } from "../../../../../pages/DataManager/store";
import Version, { VersionDownload } from "./version";

import DeleteVersion from "./delete";

const DeleteButton = ({ viewId, sourceId, meta, navigate }) => {
  const { baseUrl } = React.useContext(DamaContext);
  return (
    <button
      disabled={get(meta, "authoritative") === "true"}
      className={`bg-red-50 p-2 ${get(meta, "authoritative") === "true" ? `cursor-not-allowed` : `hover:bg-red-400 hover:text-white`}`}
      onClick={() => navigate(`/${baseUrl}/source/${sourceId}/versions/${viewId}/delete`)}
    >
      <i className="fad fa-trash"></i>
    </button>
  );
};

const Versions = ({ source, views, meta }) => {
  const { pgEnv, baseUrl, user } = React.useContext(DamaContext);
  const { sourceId, viewId, vPage } = useParams();

  if (vPage === "delete") {
    return <DeleteVersion  />;
  }
  if (viewId) {
    return (
      <Version />
    );
  }

  return (
    <div>
      <Table
        disableFilters
        disableSortBy
        sortBy={"_created_timestamp"}
        data={views}
        columns={[
          {
            Header: "Version Id",
            accessor: (c) => c["version"] || c["view_id"],
          },
          {
            Header: "User",
            accessor: "user_id",
          },
          {
            Header: "Uploaded",
            accessor: (c) => formatDate(c["_created_timestamp"]),
          },
          {
            Header: "Details",
            accessor: (c) => <Link className="text-blue-500" to={`${baseUrl}/source/${sourceId}/versions/${c["view_id"]}`}> Link to Details Page </Link>
          },
          {
            Header: " Download",
            accessor: (c) => {
              return <VersionDownload view={c} />;
            },
            disableFilters: true,
          },
        ]}
        striped={true}
      />
    </div>
  );
};




export default Versions;
