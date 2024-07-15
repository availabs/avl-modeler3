import React, { useContext, useMemo } from "react";
import { SymbologyContext } from "../../";
import { ColumnSelectControl, SelectControl } from "./Controls";
import { StyledControl } from "./ControlWrappers";

function PopoverEditor(props) {
  const { state, setState } = useContext(SymbologyContext);
  const activeLayer = useMemo(() => state.symbology?.layers?.[state.symbology.activeLayer] || null,
    [state]
  );

  return (
    activeLayer && (
      <div className='pb-4  max-h-[calc(100vh_-_251px)] scrollbar-xs overflow-x-hidden overflow-y-auto'>
        <div className='flex mx-4 mt-1'>
          <div className='w-16 text-slate-500 text-[14px] tracking-wide min-h-[32px] flex items-center'>
            Popover
          </div>
          <div className='flex-1 flex items-center'>
            <StyledControl>
              <SelectControl
                path={`['hover']`}
                params={{
                  options: [
                    { value: '', name: 'None' },
                    { value: 'hover', name: 'Hover' },
                  ],
                }}
              />
            </StyledControl>
          </div>
        </div>

        <div className='w-16 text-slate-500 text-[14px] tracking-wide min-h-[32px] flex items-center mx-4'>
          Attributes
        </div>
        {activeLayer.hover && (
          <ColumnSelectControl
            path={`['hover-columns']`}
            params={{}}
          />
        )}
      </div>
    )
  );
}

export default PopoverEditor;
