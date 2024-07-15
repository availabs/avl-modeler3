import React from "react";
import {DamaContext} from "../../../../store/index.js";
import {editMetadata} from "../utils/editMetadata.js";

export const DisplaySelector = ({sourceId, metadata, setMetadata, col, value}) => {
    const {pgEnv, falcor} = React.useContext(DamaContext);

    const onChange = React.useCallback(async e => {
        await editMetadata({sourceId, pgEnv, falcor, metadata, setMetadata, col, value: {display: e.target.value}});
    }, [col, metadata]);

    return (<div className={'border border-blue-100'}>
        <select
            className="appearance-auto pl-3 pr-4 py-2.5 bg-blue-50 w-full bg-white mr-2 flex items-center justify-between text-sm"
            value={value}
            onChange={onChange}
            // disabled={value === 'calculated-column'}
        >
            <option value={""}>
                none
            </option>
            <option value="meta-variable">
                meta variable
            </option>
            <option value="data-variable">
                data variable
            </option>
            <option value="geoid-variable">
                fips variable
            </option>
            <option value="geom-variable">
                geom variable
            </option>
        </select>
    </div>)
}