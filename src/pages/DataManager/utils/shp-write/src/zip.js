import write from './write'
import geojson from './geojson'
import prj from './prj'
import JSZip from 'jszip'
import get from 'lodash/get'

export default function zip (gj, options, aliasString, tmcMetaString) {
    var zip = new JSZip(),
        layers = zip.folder(options && options.folder ? options.folder : 'layers');

    const geoms = [geojson.point(gj), geojson.line(gj), geojson.polygon(gj)];

    geoms.forEach(function(l, i) {
      if (l.geometries.length && l.geometries[0].length) {
          console.log('l.geo',l.geometries, i, l)
          write(
              // field definitions
              l.properties,
              // geometry type
              l.type,
              // geometries
              l.geometries[0].map(d => [d]),
              function(err, files) {
                  var fileName = get(options,`types[${l.type.toLowerCase()}]`,l.type);
                  layers.file(fileName + '.shp', files.shp.buffer, { binary: true });
                  layers.file(fileName + '.shx', files.shx.buffer, { binary: true });
                  layers.file(fileName + '.dbf', files.dbf.buffer, { binary: true });
                  layers.file(fileName + '.prj', prj);
              });
      }
    });
    if (aliasString) {
      const fileAliasName = options && options.file ? options.file + '_alias_meta' : 'alias_meta';
      layers.file(fileAliasName + '.txt', aliasString);
    }
    if (tmcMetaString) {
      const fileTmcMetaName = options && options.file ? options.file + '_tmc_meta' : 'tmc_meta';
      layers.file(fileTmcMetaName + '.txt', tmcMetaString);
    }

    return zip.generateAsync({
        type: 'blob',
        compression: 'STORE'
    });
};
