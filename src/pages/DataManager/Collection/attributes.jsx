export const CollectionAttributes = {
  collection_id: "collection_id",
  name: "name",
  description: "description",
  metadata: "metadata",
  categories: "categories",
  source_dependencies: "source_dependencies",
  user_id: "user_id",
  _created_timestamp: "_created_timestamp",
  _modified_timestamp: "_modified_timestamp",
};

export const SymbologyAttributes = {
  symbology_id: "symbology_id",
  name: "name",
  collection_id: "collection_id",
  description: "description",
  // metadata: "metadata",
  symbology: "symbology",
  // source_dependencies: "source_dependencies",
  _created_timestamp: "_created_timestamp",
  _modified_timestamp: "_modified_timestamp",
};

export const getAttributes = (data) => {
  return Object.entries(data || {}).reduce((out, attr) => {
    const [k, v] = attr;
    typeof v.value !== "undefined" ? (out[k] = v.value) : (out[k] = v);
    return out;
  }, {});
};
