import { decompressSync } from "fflate"
import v2 from "./v2"
import { Protocol } from "./adapters"
export * from "./adapters"

const globalThis = {}

function toNum(low, high) {
  return (high >>> 0) * 0x100000000 + (low >>> 0)
}

function readVarintRemainder(l, p) {
  const buf = p.buf
  let h, b
  b = buf[p.pos++]
  h = (b & 0x70) >> 4
  if (b < 0x80) return toNum(l, h)
  b = buf[p.pos++]
  h |= (b & 0x7f) << 3
  if (b < 0x80) return toNum(l, h)
  b = buf[p.pos++]
  h |= (b & 0x7f) << 10
  if (b < 0x80) return toNum(l, h)
  b = buf[p.pos++]
  h |= (b & 0x7f) << 17
  if (b < 0x80) return toNum(l, h)
  b = buf[p.pos++]
  h |= (b & 0x7f) << 24
  if (b < 0x80) return toNum(l, h)
  b = buf[p.pos++]
  h |= (b & 0x01) << 31
  if (b < 0x80) return toNum(l, h)
  throw new Error("Expected varint not more than 10 bytes")
}

export function readVarint(p) {
  const buf = p.buf
  let val, b

  b = buf[p.pos++]
  val = b & 0x7f
  if (b < 0x80) return val
  b = buf[p.pos++]
  val |= (b & 0x7f) << 7
  if (b < 0x80) return val
  b = buf[p.pos++]
  val |= (b & 0x7f) << 14
  if (b < 0x80) return val
  b = buf[p.pos++]
  val |= (b & 0x7f) << 21
  if (b < 0x80) return val
  b = buf[p.pos]
  val |= (b & 0x0f) << 28

  return readVarintRemainder(val, p)
}

function rotate(n, xy, rx, ry) {
  if (ry == 0) {
    if (rx == 1) {
      xy[0] = n - 1 - xy[0]
      xy[1] = n - 1 - xy[1]
    }
    const t = xy[0]
    xy[0] = xy[1]
    xy[1] = t
  }
}

function idOnLevel(z, pos) {
  const n = Math.pow(2, z)
  let rx = pos
  let ry = pos
  let t = pos
  const xy = [0, 0]
  let s = 1
  while (s < n) {
    rx = 1 & (t / 2)
    ry = 1 & (t ^ rx)
    rotate(s, xy, rx, ry)
    xy[0] += s * rx
    xy[1] += s * ry
    t = t / 4
    s *= 2
  }
  return [z, xy[0], xy[1]]
}

const tzValues = [
  0,
  1,
  5,
  21,
  85,
  341,
  1365,
  5461,
  21845,
  87381,
  349525,
  1398101,
  5592405,
  22369621,
  89478485,
  357913941,
  1431655765,
  5726623061,
  22906492245,
  91625968981,
  366503875925,
  1466015503701,
  5864062014805,
  23456248059221,
  93824992236885,
  375299968947541,
  1501199875790165
]

export function zxyToTileId(z, x, y) {
  if (z > 26) {
    throw Error("Tile zoom level exceeds max safe number limit (26)")
  }
  if (x > Math.pow(2, z) - 1 || y > Math.pow(2, z) - 1) {
    throw Error("tile x/y outside zoom level bounds")
  }

  const acc = tzValues[z]
  const n = Math.pow(2, z)
  let rx = 0
  let ry = 0
  let d = 0
  const xy = [x, y]
  let s = n / 2
  while (s > 0) {
    rx = (xy[0] & s) > 0 ? 1 : 0
    ry = (xy[1] & s) > 0 ? 1 : 0
    d += s * s * ((3 * rx) ^ ry)
    rotate(s, xy, rx, ry)
    s = s / 2
  }
  return acc + d
}

export function tileIdToZxy(i) {
  let acc = 0
  let z = 0

  for (let z = 0; z < 27; z++) {
    const num_tiles = (0x1 << z) * (0x1 << z)
    if (acc + num_tiles > i) {
      return idOnLevel(z, i - acc)
    }
    acc += num_tiles
  }

  throw Error("Tile zoom level exceeds max safe number limit (26)")
}

export let Compression

;(function(Compression) {
  Compression[(Compression["Unknown"] = 0)] = "Unknown"
  Compression[(Compression["None"] = 1)] = "None"
  Compression[(Compression["Gzip"] = 2)] = "Gzip"
  Compression[(Compression["Brotli"] = 3)] = "Brotli"
  Compression[(Compression["Zstd"] = 4)] = "Zstd"
})(Compression || (Compression = {}))

async function defaultDecompress(buf, compression) {
  if (compression === Compression.None || compression === Compression.Unknown) {
    return buf
  } else if (compression === Compression.Gzip) {
    if (typeof globalThis.DecompressionStream == "undefined") {
      return decompressSync(new Uint8Array(buf))
    } else {
      let stream = new Response(buf).body
      let result = stream.pipeThrough(
        new globalThis.DecompressionStream("gzip")
      )
      return new Response(result).arrayBuffer()
    }
  } else {
    throw Error("Compression method not supported")
  }
}

export let TileType

;(function(TileType) {
  TileType[(TileType["Unknown"] = 0)] = "Unknown"
  TileType[(TileType["Mvt"] = 1)] = "Mvt"
  TileType[(TileType["Png"] = 2)] = "Png"
  TileType[(TileType["Jpeg"] = 3)] = "Jpeg"
  TileType[(TileType["Webp"] = 4)] = "Webp"
  TileType[(TileType["Avif"] = 5)] = "Avif"
})(TileType || (TileType = {}))

const HEADER_SIZE_BYTES = 127

export function findTile(entries, tileId) {
  let m = 0
  let n = entries.length - 1
  while (m <= n) {
    const k = (n + m) >> 1
    const cmp = tileId - entries[k].tileId
    if (cmp > 0) {
      m = k + 1
    } else if (cmp < 0) {
      n = k - 1
    } else {
      return entries[k]
    }
  }

  // at this point, m > n
  if (n >= 0) {
    if (entries[n].runLength === 0) {
      return entries[n]
    }
    if (tileId - entries[n].tileId < entries[n].runLength) {
      return entries[n]
    }
  }
  return null
}

export class FileAPISource {
  constructor(file) {
    this.file = file
  }

  getKey() {
    return this.file.name
  }

  async getBytes(offset, length) {
    const blob = this.file.slice(offset, offset + length)
    const a = await blob.arrayBuffer()
    return { data: a }
  }
}

export class FetchSource {
  constructor(url) {
    this.url = url.includes("localhost") ? "http://" + url : "https://" + url
  }

  getKey() {
    return this.url
  }

  async getBytes(offset, length, signal) {
    let controller
    if (!signal) {
      // TODO check this works or assert 206
      controller = new AbortController()
      signal = controller.signal
    }

    let resp = await fetch(this.url, {
      signal: signal,
      headers: { Range: "bytes=" + offset + "-" + (offset + length - 1) }
    })

    // TODO: can return 416 with offset > 0 if content changed, which will have a blank etag.
    // See https://github.com/protomaps/PMTiles/issues/90

    if (resp.status === 416 && offset === 0) {
      // some HTTP servers don't accept ranges beyond the end of the resource.
      // Retry with the exact length
      const content_range = resp.headers.get("Content-Range")
      if (!content_range || !content_range.startsWith("bytes */")) {
        throw Error("Missing content-length on 416 response")
      }
      const actual_length = +content_range.substr(8)
      resp = await fetch(this.url, {
        signal: signal,
        headers: { Range: "bytes=0-" + (actual_length - 1) }
      })
    }

    if (resp.status >= 300) {
      throw Error("Bad response code: " + resp.status)
    }

    const content_length = resp.headers.get("Content-Length")

    // some well-behaved backends, e.g. DigitalOcean CDN, respond with 200 instead of 206
    // but we also need to detect no support for Byte Serving which is returning the whole file
    if (resp.status === 200 && (!content_length || +content_length > length)) {
      if (controller) controller.abort()
      throw Error(
        "Server returned no content-length header or content-length exceeding request. Check that your storage backend supports HTTP Byte Serving."
      )
    }

    const a = await resp.arrayBuffer()
    return {
      data: a,
      etag: resp.headers.get("ETag") || undefined,
      cacheControl: resp.headers.get("Cache-Control") || undefined,
      expires: resp.headers.get("Expires") || undefined
    }
  }
}

export function getUint64(v, offset) {
  const wh = v.getUint32(offset + 4, true)
  const wl = v.getUint32(offset + 0, true)
  return wh * Math.pow(2, 32) + wl
}

export function bytesToHeader(bytes, etag) {
  const v = new DataView(bytes)
  const spec_version = v.getUint8(7)
  if (spec_version > 3) {
    throw Error(
      `Archive is spec version ${spec_version} but this library supports up to spec version 3`
    )
  }

  return {
    specVersion: spec_version,
    rootDirectoryOffset: getUint64(v, 8),
    rootDirectoryLength: getUint64(v, 16),
    jsonMetadataOffset: getUint64(v, 24),
    jsonMetadataLength: getUint64(v, 32),
    leafDirectoryOffset: getUint64(v, 40),
    leafDirectoryLength: getUint64(v, 48),
    tileDataOffset: getUint64(v, 56),
    tileDataLength: getUint64(v, 64),
    numAddressedTiles: getUint64(v, 72),
    numTileEntries: getUint64(v, 80),
    numTileContents: getUint64(v, 88),
    clustered: v.getUint8(96) === 1,
    internalCompression: v.getUint8(97),
    tileCompression: v.getUint8(98),
    tileType: v.getUint8(99),
    minZoom: v.getUint8(100),
    maxZoom: v.getUint8(101),
    minLon: v.getInt32(102, true) / 10000000,
    minLat: v.getInt32(106, true) / 10000000,
    maxLon: v.getInt32(110, true) / 10000000,
    maxLat: v.getInt32(114, true) / 10000000,
    centerZoom: v.getUint8(118),
    centerLon: v.getInt32(119, true) / 10000000,
    centerLat: v.getInt32(123, true) / 10000000,
    etag: etag
  }
}

function deserializeIndex(buffer) {
  const p = { buf: new Uint8Array(buffer), pos: 0 }
  const numEntries = readVarint(p)

  const entries = []

  let lastId = 0
  for (let i = 0; i < numEntries; i++) {
    const v = readVarint(p)
    entries.push({ tileId: lastId + v, offset: 0, length: 0, runLength: 1 })
    lastId += v
  }

  for (let i = 0; i < numEntries; i++) {
    entries[i].runLength = readVarint(p)
  }

  for (let i = 0; i < numEntries; i++) {
    entries[i].length = readVarint(p)
  }

  for (let i = 0; i < numEntries; i++) {
    const v = readVarint(p)
    if (v === 0 && i > 0) {
      entries[i].offset = entries[i - 1].offset + entries[i - 1].length
    } else {
      entries[i].offset = v - 1
    }
  }

  return entries
}

function detectVersion(a) {
  const v = new DataView(a)
  if (v.getUint16(2, true) === 2) {
    console.warn(
      "PMTiles spec version 2 has been deprecated; please see github.com/protomaps/PMTiles for tools to upgrade"
    )
    return 2
  } else if (v.getUint16(2, true) === 1) {
    console.warn(
      "PMTiles spec version 1 has been deprecated; please see github.com/protomaps/PMTiles for tools to upgrade"
    )
    return 1
  }
  return 3
}

export class EtagMismatch extends Error {}

async function getHeaderAndRoot(source, decompress, prefetch, current_etag) {
  const resp = await source.getBytes(0, 16384)

  const v = new DataView(resp.data)
  if (v.getUint16(0, true) !== 0x4d50) {
    throw new Error(
      `Wrong magic number for PMTiles archive got ${v.getUint16(
        0,
        true
      )} not 19729`
    )
  }

  // V2 COMPATIBILITY
  if (detectVersion(resp.data) < 3) {
    return [await v2.getHeader(source)]
  }

  const headerData = resp.data.slice(0, HEADER_SIZE_BYTES)

  let resp_etag = resp.etag
  if (current_etag && resp.etag != current_etag) {
    console.warn(
      "ETag conflict detected; your HTTP server might not support content-based ETag headers. ETags disabled for " +
        source.getKey()
    )
    resp_etag = undefined
  }

  const header = bytesToHeader(headerData, resp_etag)

  // optimistically set the root directory
  // TODO check root bounds
  if (prefetch) {
    const rootDirData = resp.data.slice(
      header.rootDirectoryOffset,
      header.rootDirectoryOffset + header.rootDirectoryLength
    )
    const dirKey =
      source.getKey() +
      "|" +
      (header.etag || "") +
      "|" +
      header.rootDirectoryOffset +
      "|" +
      header.rootDirectoryLength

    const rootDir = deserializeIndex(
      await decompress(rootDirData, header.internalCompression)
    )
    return [header, [dirKey, rootDir.length, rootDir]]
  }

  return [header, undefined]
}

async function getDirectory(source, decompress, offset, length, header) {
  const resp = await source.getBytes(offset, length)

  if (header.etag && header.etag !== resp.etag) {
    throw new EtagMismatch(resp.etag)
  }

  const data = await decompress(resp.data, header.internalCompression)
  const directory = deserializeIndex(data)
  if (directory.length === 0) {
    throw new Error("Empty directory is invalid")
  }

  return directory
}

export class ResolvedValueCache {
  constructor(
    maxCacheEntries = 100,
    prefetch = true,
    decompress = defaultDecompress
  ) {
    this.cache = new Map()
    this.maxCacheEntries = maxCacheEntries
    this.counter = 1
    this.prefetch = prefetch
    this.decompress = decompress
  }

  async getHeader(source, current_etag) {
    const cacheKey = source.getKey()
    if (this.cache.has(cacheKey)) {
      this.cache.get(cacheKey).lastUsed = this.counter++
      const data = this.cache.get(cacheKey).data
      return data
    }

    const res = await getHeaderAndRoot(
      source,
      this.decompress,
      this.prefetch,
      current_etag
    )
    if (res[1]) {
      this.cache.set(res[1][0], {
        lastUsed: this.counter++,
        data: res[1][2]
      })
    }

    this.cache.set(cacheKey, {
      lastUsed: this.counter++,
      data: res[0]
    })
    this.prune()
    return res[0]
  }

  async getDirectory(source, offset, length, header) {
    const cacheKey =
      source.getKey() + "|" + (header.etag || "") + "|" + offset + "|" + length
    if (this.cache.has(cacheKey)) {
      this.cache.get(cacheKey).lastUsed = this.counter++
      const data = this.cache.get(cacheKey).data
      return data
    }

    const directory = await getDirectory(
      source,
      this.decompress,
      offset,
      length,
      header
    )
    this.cache.set(cacheKey, {
      lastUsed: this.counter++,
      data: directory
    })
    this.prune()
    return directory
  }

  // for v2 backwards compatibility
  async getArrayBuffer(source, offset, length, header) {
    const cacheKey =
      source.getKey() + "|" + (header.etag || "") + "|" + offset + "|" + length
    if (this.cache.has(cacheKey)) {
      this.cache.get(cacheKey).lastUsed = this.counter++
      const data = await this.cache.get(cacheKey).data
      return data
    }

    const resp = await source.getBytes(offset, length)
    if (header.etag && header.etag !== resp.etag) {
      throw new EtagMismatch(header.etag)
    }
    this.cache.set(cacheKey, {
      lastUsed: this.counter++,
      data: resp.data
    })
    this.prune()
    return resp.data
  }

  prune() {
    if (this.cache.size > this.maxCacheEntries) {
      let minUsed = Infinity
      let minKey = undefined
      this.cache.forEach((cache_value, key) => {
        if (cache_value.lastUsed < minUsed) {
          minUsed = cache_value.lastUsed
          minKey = key
        }
      })
      if (minKey) {
        this.cache.delete(minKey)
      }
    }
  }

  async invalidate(source, current_etag) {
    this.cache.delete(source.getKey())
    await this.getHeader(source, current_etag)
  }
}

// a "dumb" bag of bytes.
// only caches headers and directories
// deduplicates simultaneous responses
// (estimates) the maximum size of the cache.
export class SharedPromiseCache {
  constructor(
    maxCacheEntries = 100,
    prefetch = true,
    decompress = defaultDecompress
  ) {
    this.cache = new Map()
    this.maxCacheEntries = maxCacheEntries
    this.counter = 1
    this.prefetch = prefetch
    this.decompress = decompress
  }

  async getHeader(source, current_etag) {
    const cacheKey = source.getKey()
    if (this.cache.has(cacheKey)) {
      this.cache.get(cacheKey).lastUsed = this.counter++
      const data = await this.cache.get(cacheKey).data
      return data
    }

    const p = new Promise((resolve, reject) => {
      getHeaderAndRoot(source, this.decompress, this.prefetch, current_etag)
        .then(res => {
          if (res[1]) {
            this.cache.set(res[1][0], {
              lastUsed: this.counter++,
              data: Promise.resolve(res[1][2])
            })
          }
          resolve(res[0])
          this.prune()
        })
        .catch(e => {
          reject(e)
        })
    })
    this.cache.set(cacheKey, { lastUsed: this.counter++, data: p })
    return p
  }

  async getDirectory(source, offset, length, header) {
    const cacheKey =
      source.getKey() + "|" + (header.etag || "") + "|" + offset + "|" + length
    if (this.cache.has(cacheKey)) {
      this.cache.get(cacheKey).lastUsed = this.counter++
      const data = await this.cache.get(cacheKey).data
      return data
    }

    const p = new Promise((resolve, reject) => {
      getDirectory(source, this.decompress, offset, length, header)
        .then(directory => {
          resolve(directory)
          this.prune()
        })
        .catch(e => {
          reject(e)
        })
    })
    this.cache.set(cacheKey, { lastUsed: this.counter++, data: p })
    return p
  }

  // for v2 backwards compatibility
  async getArrayBuffer(source, offset, length, header) {
    const cacheKey =
      source.getKey() + "|" + (header.etag || "") + "|" + offset + "|" + length
    if (this.cache.has(cacheKey)) {
      this.cache.get(cacheKey).lastUsed = this.counter++
      const data = await this.cache.get(cacheKey).data
      return data
    }

    const p = new Promise((resolve, reject) => {
      source
        .getBytes(offset, length)
        .then(resp => {
          if (header.etag && header.etag !== resp.etag) {
            throw new EtagMismatch(resp.etag)
          }
          resolve(resp.data)
          if (this.cache.has(cacheKey)) {
          }
          this.prune()
        })
        .catch(e => {
          reject(e)
        })
    })
    this.cache.set(cacheKey, { lastUsed: this.counter++, data: p })
    return p
  }

  prune() {
    if (this.cache.size >= this.maxCacheEntries) {
      let minUsed = Infinity
      let minKey = undefined
      this.cache.forEach((cache_value, key) => {
        if (cache_value.lastUsed < minUsed) {
          minUsed = cache_value.lastUsed
          minKey = key
        }
      })
      if (minKey) {
        this.cache.delete(minKey)
      }
    }
  }

  async invalidate(source, current_etag) {
    this.cache.delete(source.getKey())
    await this.getHeader(source, current_etag)
  }
}

export class PMTiles {
  constructor(source, cache, decompress) {
    if (typeof source === "string") {
      this.source = new FetchSource(source)
    } else {
      this.source = source
    }
    if (decompress) {
      this.decompress = decompress
    } else {
      this.decompress = defaultDecompress
    }
    if (cache) {
      this.cache = cache
    } else {
      this.cache = new SharedPromiseCache()
    }
  }

  async getHeader() {
    return await this.cache.getHeader(this.source)
  }

  async getZxyAttempt(z, x, y, signal) {
    const tile_id = zxyToTileId(z, x, y)
    const header = await this.cache.getHeader(this.source)

    // V2 COMPATIBILITY
    if (header.specVersion < 3) {
      return v2.getZxy(header, this.source, this.cache, z, x, y, signal)
    }

    if (z < header.minZoom || z > header.maxZoom) {
      return undefined
    }

    let d_o = header.rootDirectoryOffset
    let d_l = header.rootDirectoryLength
    for (let depth = 0; depth <= 3; depth++) {
      const directory = await this.cache.getDirectory(
        this.source,
        d_o,
        d_l,
        header
      )
      const entry = findTile(directory, tile_id)
      if (entry) {
        if (entry.runLength > 0) {
          const resp = await this.source.getBytes(
            header.tileDataOffset + entry.offset,
            entry.length,
            signal
          )
          if (header.etag && header.etag !== resp.etag) {
            throw new EtagMismatch(resp.etag)
          }
          return {
            data: await this.decompress(resp.data, header.tileCompression),
            cacheControl: resp.cacheControl,
            expires: resp.expires
          }
        } else {
          d_o = header.leafDirectoryOffset + entry.offset
          d_l = entry.length
        }
      } else {
        // TODO: We should in fact return a valid RangeResponse
        // with empty data, but filled in cache control / expires headers
        return undefined
      }
    }
    throw Error("Maximum directory depth exceeded")
  }

  async getZxy(z, x, y, signal) {
    try {
      return await this.getZxyAttempt(z, x, y, signal)
    } catch (e) {
      if (e instanceof EtagMismatch) {
        this.cache.invalidate(this.source, e.message)
        return await this.getZxyAttempt(z, x, y, signal)
      } else {
        throw e
      }
    }
  }

  async getMetadataAttempt() {
    const header = await this.cache.getHeader(this.source)

    const resp = await this.source.getBytes(
      header.jsonMetadataOffset,
      header.jsonMetadataLength
    )
    if (header.etag && header.etag !== resp.etag) {
      throw new EtagMismatch(resp.etag)
    }
    const decompressed = await this.decompress(
      resp.data,
      header.internalCompression
    )
    const dec = new TextDecoder("utf-8")
    return JSON.parse(dec.decode(decompressed))
  }

  async getMetadata() {
    try {
      return await this.getMetadataAttempt()
    } catch (e) {
      if (e instanceof EtagMismatch) {
        this.cache.invalidate(this.source, e.message)
        return await this.getMetadataAttempt()
      } else {
        throw e
      }
    }
  }
}

export const PMTilesProtocol = {
  type: "pmtiles",
  protocolInit: maplibre => {
    const protocol = new Protocol()
    maplibre.addProtocol("pmtiles", protocol.tile)
    return protocol
  },
  sourceInit: (protocol, source, maplibreMap) => {
    const p = new PMTiles(source.url)
    protocol.add(p)
  }
}

// export const Protocol = {
//   type: "pmtiles",
//   protocolInit: maplibre => {
//     const protocol = new Protocol();
//     maplibre.addProtocol("pmtiles", protocol.tile);
//     return protocol;
//   },
//   sourceInit: (protocol, source, maplibreMap) => {
//     const p = new PMTiles(source.url);
//     protocol.add(p);
//   }
// }
