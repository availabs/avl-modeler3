import Pages from "./default";

// ---------------------------
// ---- Basic Types
// ---------------------------



const damaCollectionTypes = {

}

function registerCollectionType (name, collectionType) {
  damaCollectionTypes[name] = collectionType
}

export { damaCollectionTypes, Pages, registerCollectionType };

