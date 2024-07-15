import { PMTiles, TileType } from "./index"

const L = null
const window = null
const document = null


export const leafletRasterLayer = (source, options) => {
  let loaded = false
  let mimeType = ""
  const cls = L.GridLayer.extend({
    createTile: function(coord, done) {
      const el = document.createElement("img")
      const controller = new AbortController()
      const signal = controller.signal
      el.cancel = () => {
        controller.abort()
      }
      if (!loaded) {
        source.getHeader().then(header => {
          if (header.tileType == TileType.Mvt) {
            console.error(
              "Error: archive contains MVT vector tiles, but leafletRasterLayer is for displaying raster tiles. See https://github.com/protomaps/PMTiles/tree/main/js for details."
            )
          } else if (header.tileType == 2) {
            mimeType = "image/png"
          } else if (header.tileType == 3) {
            mimeType = "image/jpeg"
          } else if (header.tileType == 4) {
            mimeType = "image/webp"
          } else if (header.tileType == 5) {
            mimeType = "image/avif"
          }
        })
        loaded = true
      }
      source
        .getZxy(coord.z, coord.x, coord.y, signal)
        .then(arr => {
          if (arr) {
            const blob = new Blob([arr.data], { type: mimeType })
            const imageUrl = window.URL.createObjectURL(blob)
            el.src = imageUrl
            el.cancel = null
            done(null, el)
          }
        })
        .catch(e => {
          if (e.name !== "AbortError") {
            throw e
          }
        })
      return el
    },

    _removeTile: function(key) {
      const tile = this._tiles[key]
      if (!tile) {
        return
      }

      if (tile.el.cancel) tile.el.cancel()

      tile.el.width = 0
      tile.el.height = 0
      tile.el.deleted = true
      L.DomUtil.remove(tile.el)
      delete this._tiles[key]
      this.fire("tileunload", {
        tile: tile.el,
        coords: this._keyToTileCoords(key)
      })
    }
  })
  return new cls(options)
}

export class Protocol {
  constructor() {
    this.tiles = new Map()
  }

  add(p) {
    this.tiles.set(p.source.getKey(), p)
  }

  get(url) {
    return this.tiles.get(url)
  }

  tile = (params, callback) => {
    if (params.type == "json") {
      const pmtiles_url = params.url.substr(10)
      let instance = this.tiles.get(pmtiles_url)
      if (!instance) {
        instance = new PMTiles(pmtiles_url)
        this.tiles.set(pmtiles_url, instance)
      }

      instance
        .getHeader()
        .then(h => {
          const tilejson = {
            tiles: [params.url + "/{z}/{x}/{y}"],
            minzoom: h.minZoom,
            maxzoom: h.maxZoom,
            bounds: [h.minLon, h.minLat, h.maxLon, h.maxLat]
          }
          callback(null, tilejson, null, null)
        })
        .catch(e => {
          callback(e, null, null, null)
        })

      return {
        cancel: () => {}
      }
    } else {
      const re = new RegExp(/pmtiles:\/\/(.+)\/(\d+)\/(\d+)\/(\d+)/)
      const result = params.url.match(re)
      if (!result) {
        throw new Error("Invalid PMTiles protocol URL")
        return {
          cancel: () => {}
        }
      }
      const pmtiles_url = result[1]

      let instance = this.tiles.get(pmtiles_url)
      if (!instance) {
        instance = new PMTiles(pmtiles_url)
        this.tiles.set(pmtiles_url, instance)
      }
      const z = result[2]
      const x = result[3]
      const y = result[4]

      const controller = new AbortController()
      const signal = controller.signal
      let cancel = () => {
        controller.abort()
      }

      instance.getHeader().then(header => {
        instance
          .getZxy(+z, +x, +y, signal)
          .then(resp => {
            if (resp) {
              callback(
                null,
                new Uint8Array(resp.data),
                resp.cacheControl,
                resp.expires
              )
            } else {
              if (header.tileType == TileType.Mvt) {
                callback(null, new Uint8Array(), null, null)
              } else {
                callback(null, null, null, null)
              }
            }
          })
          .catch(e => {
            if (e.name !== "AbortError") {
              callback(e, null, null, null)
            }
          })
      })
      return {
        cancel: cancel
      }
    }
  }
}
