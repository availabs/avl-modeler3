import zip from './zip'
import { saveAs } from "file-saver"

export default function download(gj, options, aliasString, tmcMetaString) {
    zip(gj, options, aliasString, tmcMetaString).then(function(blob) { saveAs(blob, options.file + '.zip'); });
};
