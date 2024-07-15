import get from "lodash/get";

export const isJson = (str)  => {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

export const fnumIndex = (d, fractions = 2, currency = false) => {
    if (d >= 1000000000000) {
      return `${currency ? '$' : ``} ${(d / 1000000000000).toFixed(fractions)} T`;
    } else if (d >= 1000000000) {
      return `${currency ? '$' : ``} ${(d / 1000000000).toFixed(fractions)} B`;
    } else if (d >= 1000000) {
      return `${currency ? '$' : ``} ${(d / 1000000).toFixed(fractions)} M`;
    } else if (d >= 1000) {
      return `${currency ? '$' : ``} ${(d / 1000).toFixed(fractions)} K`;
    } else {
      return typeof d === "object" ? `` : `${currency ? '$' : ``} ${parseInt(d)}`;
    }
  }
;

export const fnum = (number, currency = false) => (currency ? '$ ' : '') + parseInt(number).toLocaleString();

export const formatDate = (dateString) => {
  const options = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  };
  return dateString ? new Date(dateString).toLocaleDateString(undefined, options) : ``;
};

export const range = (start, end) => Array.from({length: (end + 1 - start)}, (v, k) => k + start);

export const RenderVersions = ({ value, setValue, versions, type }) => {
  return (
    <div className="flex justify-between group">
      <div className="flex-1 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt className="text-sm font-medium text-gray-500 py-5">Select {type} version:</dt>
        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
          <div className="pt-3 pr-8">
            <select
              className="w-full bg-white p-3 flex-1 shadow bg-grey-50 focus:bg-blue-100  border-gray-300"
              value={value || ""}
              onChange={e => {
                setValue(e.target.value);
              }}>
              <option value="" disabled key={type}>Select your option</option>
              {(versions.views || versions)
                .sort((a, b) => (b.view_id) - (a.view_id))
                .map(v =>
                  <option
                    key={v.view_id || v}
                    value={v.view_id || v}
                    className={`p-2 ${get(v, ["metadata", "authoritative"]) === "true" ? `font-bold` : ``}`}>
                    {get(v, "version") || v}
                    {v.view_id && ` (${v.view_id || ``} ${formatDate(v._modified_timestamp)})`}
                  </option>)
              }
            </select>
          </div>
        </dd>
      </div>
    </div>
  );
};