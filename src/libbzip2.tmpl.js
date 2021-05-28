
__BEGIN_INCLUDES__
//#include "bzlib.h"
//#include "struct_defs.h"
__END_INCLUDES__

if (typeof(atob) == 'undefined') {
    var atob = base64 => Buffer.from(base64, 'base64').toString('binary');
}

//const code = Uint8Array.from(atob(__WASM_BASE64_xxxxGOES_HERE__, c => c.charCodeAt(0)));
const code = new Uint8Array(__WASM_ARRAY_GOES_HERE__);

let wasmModule = null;

async function getModule()
{
    if (wasmModule == null) {
        wasmModule = WebAssembly.compile(code);
    }
    return wasmModule;
}

class bz_stream {

    constructor(bz) {
        this.ptr = bz.bzAlloc(BZ_STREAM_SIZEOF)
        if (!this.ptr)
            throw Error('Out of memory');
        this.bz = bz;
        this.memory = bz.memory;
        this.view = new DataView(bz.memory.buffer, this.ptr, BZ_STREAM_SIZEOF);
        this.clear();
    }

    refresh() {
        if (this.view.buffer !== this.memory.buffer)
            this.view = new DataView(this.memory.buffer, this.ptr, BZ_STREAM_SIZEOF);
    }

    clear() {
        (new Uint8Array(this.memory.buffer, this.ptr, BZ_STREAM_SIZEOF)).fill(0);
    }

    free() {
        this.bz.bzFree(this.ptr);
    }

    get next_in() { return this.view.getUint32(BZ_STREAM_NEXT_IN, true); }
    set next_in(v) { this.view.setUint32(BZ_STREAM_NEXT_IN, v, true); }
    get avail_in() { return this.view.getUint32(BZ_STREAM_AVAIL_IN, true); }
    set avail_in(v) { this.view.setUint32(BZ_STREAM_AVAIL_IN, v, true); }
    get total_out() { return this.view.getUint32(BZ_STREAM_TOTAL_IN_LO32, true) + 0x100000000 * this.view.getUint32(BZ_STREAM_TOTAL_IN_HI32, true); }
    get next_out() { return this.view.getUint32(BZ_STREAM_NEXT_OUT, true); }
    set next_out(v) { this.view.setUint32(BZ_STREAM_NEXT_OUT, v, true); }
    get avail_out() { return this.view.getUint32(BZ_STREAM_AVAIL_OUT, true); }
    set avail_out(v) { this.view.setUint32(BZ_STREAM_AVAIL_OUT, v, true); }
    get total_out() { return this.view.getUint32(BZ_STREAM_TOTAL_OUT_LO32, true) + 0x100000000 * this.view.getUint32(BZ_STREAM_TOTAL_OUT_HI32, true); }
    get state() { return this.view.getUint32(BZ_STREAM_STATE, true); }
    get bzalloc() { return this.view.getUint32(BZ_STREAM_BZALLOC, true); }
    set bzalloc(v) { this.view.setUint32(BZ_STREAM_BZALLOC, v, true); }
    get bzfree() { return this.view.getUint32(BZ_STREAM_BZFREE, true); }
    set bzfree(v) { this.view.setUint32(BZ_STREAM_BZFREE, v, true); }
    get opaque() { return this.view.getUint32(BZ_STREAM_OPAQUE, true); }
    set opaque(v) { this.view.setUint32(BZ_STREAM_OPAQUE, v, true); }
}


class BZ2 {

    constructor(instance, memory) {
        this.instance = instance;
        this.memory = memory;
        for (let name in instance.exports) {
            this[name] = instance.exports[name];
        }
    }

    createStream() {
        return new bz_stream(this);
    }

}

BZ2.create = async function(memoryMax) {
    let memopt = { initial: 4 };
    if (memoryMax) {
        memopt.maximum = Math.max(8, Math.ceil(memoryMax / 65536));
    }
    let memory = new WebAssembly.Memory(memopt);
    let instance = await WebAssembly.instantiate(await getModule(), {
        env: {
            memory: memory,
//#ifdef BZ_NO_STDIO
            bzInternalError: errorCode => {
                throw new Error(`BZip2 library internal error ${errorCode}`);
            },
//#endif
        }
    });
    return new BZ2(instance, memory);
}

BZ2.stream = bz_stream;

BZ2.RUN = BZ_RUN;
BZ2.FLUSH = BZ_FLUSH;
BZ2.FINISH = BZ_FINISH;
BZ2.OK = BZ_OK;
BZ2.RUN_OK = BZ_RUN_OK;
BZ2.FLUSH_OK = BZ_FLUSH_OK;
BZ2.FINISH_OK = BZ_FINISH_OK;
BZ2.STREAM_END = BZ_STREAM_END;
BZ2.SEQUENCE_ERROR = BZ_SEQUENCE_ERROR;
BZ2.PARAM_ERROR = BZ_PARAM_ERROR;
BZ2.MEM_ERROR = BZ_MEM_ERROR;
BZ2.DATA_ERROR = BZ_DATA_ERROR;
BZ2.DATA_ERROR_MAGIC = BZ_DATA_ERROR_MAGIC;
BZ2.IO_ERROR = BZ_IO_ERROR;
BZ2.UNEXPECTED_EOF = BZ_UNEXPECTED_EOF;
BZ2.OUTBUFF_FULL = BZ_OUTBUFF_FULL;
BZ2.CONFIG_ERROR = BZ_CONFIG_ERROR;
//#ifndef BZ_NO_STDIO
BZ2.MAX_UNUSED = BZ_MAX_UNUSED;
//#endif

//#if 0

export default BZ2;

//#else

exports.BZ2 = BZ2;

//#endif
