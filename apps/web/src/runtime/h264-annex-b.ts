export interface H264StartCode {
  index: number
  size: 3 | 4
}

export function findH264StartCode(data: Uint8Array, from = 0): H264StartCode | null {
  for (let index = from; index <= data.length - 3; index += 1) {
    if (data[index] === 0 && data[index + 1] === 0 && data[index + 2] === 1) {
      return { index, size: 3 }
    }
    if (
      index <= data.length - 4 &&
      data[index] === 0 &&
      data[index + 1] === 0 &&
      data[index + 2] === 0 &&
      data[index + 3] === 1
    ) {
      return { index, size: 4 }
    }
  }
  return null
}

export function getH264NalType(nal: Uint8Array) {
  const start = findH264StartCode(nal)
  const offset = start ? start.index + start.size : 0
  return nal.length > offset ? (nal[offset] ?? 0) & 31 : 0
}

export function concatH264Nals(nals: readonly Uint8Array[]) {
  const length = nals.reduce((total, nal) => total + nal.length, 0)
  const result = new Uint8Array(length)
  let offset = 0
  for (const nal of nals) {
    result.set(nal, offset)
    offset += nal.length
  }
  return result
}

/** 将跨 WebSocket 消息分割的 Annex-B 字节流恢复为完整 NAL 单元。 */
export class H264AnnexBParser {
  #pending: Uint8Array | null = null

  push(buffer: ArrayBuffer) {
    let data = appendBytes(this.#pending, new Uint8Array(buffer))
    const nals: Uint8Array[] = []
    let start = findH264StartCode(data)

    if (!start) {
      this.#pending = null
      if (data.length > 0) {
        const nal = new Uint8Array(data.length + 4)
        nal.set([0, 0, 0, 1])
        nal.set(data, 4)
        nals.push(nal)
      }
      return nals
    }

    if (start.index > 0) {
      data = data.slice(start.index)
      start = findH264StartCode(data)
    }

    while (start) {
      const next = findH264StartCode(data, start.index + start.size)
      if (!next) {
        this.#pending = data.slice(start.index)
        return nals
      }
      nals.push(data.slice(start.index, next.index))
      start = next
    }

    this.#pending = null
    return nals
  }

  reset() {
    this.#pending = null
  }
}

function appendBytes(left: Uint8Array | null, right: Uint8Array) {
  if (!left?.length) {
    return right
  }
  const result = new Uint8Array(left.length + right.length)
  result.set(left)
  result.set(right, left.length)
  return result
}
