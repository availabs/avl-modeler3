export const point = justTypes(['Point'], 'POINT');
export const line = justTypes(['MultiLineString', 'LineString'], 'POLYLINE');
export const polygon = justTypes(['Polygon', 'MultiPolygon'], 'POLYGON');

function justTypes(types, TYPE) {
    return function(gj) {
        var oftype = gj.features.filter(isTypes(types));
        return {
            geometries: (TYPE === 'POLYGON' || TYPE === 'POLYLINE') ? [oftype.map(justCoords)] : oftype.map(justCoords),
            properties: oftype.map(justProps),
            type: TYPE
        };
    };
}

function justCoords(t) {
    if (t.geometry.coordinates[0] !== undefined &&
        t.geometry.coordinates[0][0] !== undefined &&
        t.geometry.coordinates[0][0][0] !== undefined) {
        return t.geometry.coordinates[0];
    } else {
        return t.geometry.coordinates;
    }
}

function justProps(t) {
    return t.properties;
}

function isTypes(t) {
    return function(f) { return t.includes(f.geometry.type); };
}

export default {
    point,
    line,
    polygon
}
