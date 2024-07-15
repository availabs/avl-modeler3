// import React, { useEffect } from "react";
// import { useSelector, useDispatch } from "react-redux";

// import { useFalcor } from "~/modules/avl-components/src";

// import get from 'lodash/get'

// import { queryPgEnvs, setPgEnv, selectPgEnv } from "../store";

// const Settings = () => {
//   const { falcor, falcorCache } = useFalcor();
//   const dispatch = useDispatch();

//   const { pgEnv } = React.useContext(DamaContext)
//   const pgEnvs = React.useMemo(() => {
//     return get(falcorCache, ["dama-info", "pgEnvs", "value"], []);
//   },[falcorCache]);

//   useEffect(() => {
//     (async () => {
//       falcor.get(queryPgEnvs());
//     })();
//   }, [falcor]);

//   if (!pgEnvs) {
//     return (
//       <div>
//         <span>Awaiting available Postgres Environments List</span>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-6xl mx-auto">
//       <div className="p-4 font-medium"> DataManager Settings </div>

//       <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
//         <dl className="sm:divide-y sm:divide-gray-200">
//           <div className="flex justify-between group">
//             <div className="flex-1 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
//               <dt className="text-sm font-medium text-gray-500 py-5">
//                 Postgres Database
//               </dt>
//               <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
//                 <div className="pt-3 pr-8">
//                   <select
//                     className="w-full bg-white p-3 flex-1 shadow bg-grey-50 focus:bg-blue-100  border-gray-300"
//                     value={pgEnv}
//                     onChange={(e) => {
//                       dispatch(setPgEnv(e.target.value));
//                     }}
//                   >
//                     <option value="" disabled>
//                       Select your Postgres Environment
//                     </option>
//                     {pgEnvs.map((k) => (
//                       <option key={k} value={k} className="p-2">
//                         {k}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               </dd>
//             </div>
//           </div>
//         </dl>
//       </div>
//     </div>
//   );
// };



// export default Settings;
