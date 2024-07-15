import React from "react";
import {DamaContext} from "../../../../store/index.js";
import {editMetadata} from "../utils/editMetadata.js";

export const TypeSelector = ({sourceId, metadata, setMetadata, col, value}) => {
    const {pgEnv, falcor} = React.useContext(DamaContext);

    const onChange = React.useCallback(async e => {
        await editMetadata({sourceId, pgEnv, falcor, metadata, setMetadata, col, value: {type: e.target.value}});
    }, [col, metadata]);

    return (<div className={'border border-blue-100'}>
        <select
            className="appearance-auto pl-3 pr-4 py-2.5 h-fit w-full bg-white mr-2 text-sm"
            value={value}
            onChange={onChange}
        >
            <option value={null}>
                none
            </option>
            <option value="integer">
                integer
            </option>
            <option value="number">
                number
            </option>
            <option value="string">
                string
            </option>
            <option value="boolean">
                boolean
            </option>
            <option value="object">
                object
            </option>
        </select>
    </div>)
}