import React, { useContext, useMemo, useState } from "react";
import { Button } from "../../../../../../../../modules/avl-components/src";
import { SymbologyContext } from "../../";
import { FilterBuilder, ExistingFilterList } from "./Controls";
import get from "lodash/get";
import set from "lodash/set";

function FilterEditor(props) {
  const { state, setState } = useContext(SymbologyContext);
  const [displayBuilder, setDisplayBuilder] = useState(false);
  const [activeColumn, setActiveColumn] = useState();
  const existingFilter = get(
    state,
    `symbology.layers[${state.symbology.activeLayer}].filter`
  );

  return (
    <div className="p-4 w-full">
      <div className="w-full text-slate-500 text-[14px] tracking-wide min-h-[32px] flex items-center mx">
        Filters
      </div>
      <ExistingFilterList
        removeFilter={(columnName) => {
          setState((draft) => {
            const newFilter = Object.keys(existingFilter).reduce((a, c) => {
              if (c !== columnName) {
                a[c] = existingFilter[c];
              }
              return a;
            }, {});
            set(
              draft,
              `symbology.layers[${state.symbology.activeLayer}].filter`,
              newFilter
            );
          });
        }}
        activeColumn={activeColumn}
        setActiveColumn={setActiveColumn}
      />
      <div className="m-2">
        <Button
          className="p-1"
          themeOptions={{ size: "sm", color: "transparent" }}
          onClick={() => {
            setDisplayBuilder(!displayBuilder);
            setActiveColumn(null);
          }}
        >
          Add Filter
        </Button>
      </div>
      {(activeColumn || displayBuilder) && (
        <FilterBuilder
          path={`['filter']`}
          params={{ activeColumn, setActiveColumn }}
          
        />
      )}
    </div>
  );
}

export default FilterEditor;
