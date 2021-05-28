
__BEGIN_SOURCE_REMOVAL__
#include "bzlib.h"
__END_SOURCE_REMOVAL__

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

    constructor(bz, size, ptr) {
        if (!ptr) {
            ptr = bz.bzAlloc(size || bz_stream.sizeof)
            if (!ptr)
                throw Error('Out of memory');
        }
        this.view = new DataView(bz.memory.buffer, ptr, size || bz_stream.sizeof);
    }

    /*

typedef 
   struct {
      char *next_in;
      unsigned int avail_in;
      unsigned int total_in_lo32;
      unsigned int total_in_hi32;

      char *next_out;
      unsigned int avail_out;
      unsigned int total_out_lo32;
      unsigned int total_out_hi32;

      void *state;

      void *(*bzalloc)(void *,int,int);
      void (*bzfree)(void *,void *);
      void *opaque;
   } 
   bz_stream;
    */
}

bz_stream.sizeof = 12 * 4;

class BZ2 {

    constructor(instance, memory) {
        this.instance = instance;
        this.memory = memory;
        for (let name in instance.exports) {
            this[name] = instance.exports[name];
        }
    }

    static async create(memoryMax) {
        let memopt = { initial: 4 };
        if (memoryMax) {
            memopt.maximum = Math.max(8, Math.ceil(memoryMax / 65536));
        }
        let memory = new WebAssembly.Memory(memopt);
        let instance = await WebAssembly.instantiate(await getModule(), {
            env: {
                memory: memory,
#ifdef BZ_NO_STDIO
                bzInternalError: errorCode => {
                    throw new Error(`BZip2 library internal error ${errorCode}`);
                },
#endif
            }
        });
        return new BZ2(instance, memory);
    }

}

BZ2['BZ_RUN'] = BZ_RUN;
BZ2['BZ_FLUSH'] = BZ_FLUSH;
BZ2['BZ_FINISH'] = BZ_FINISH;
BZ2['BZ_OK'] = BZ_OK;
BZ2['BZ_RUN_OK'] = BZ_RUN_OK;
BZ2['BZ_FLUSH_OK'] = BZ_FLUSH_OK;
BZ2['BZ_FINISH_OK'] = BZ_FINISH_OK;
BZ2['BZ_STREAM_END'] = BZ_STREAM_END;
BZ2['BZ_SEQUENCE_ERROR'] = BZ_SEQUENCE_ERROR;
BZ2['BZ_PARAM_ERROR'] = BZ_PARAM_ERROR;
BZ2['BZ_MEM_ERROR'] = BZ_MEM_ERROR;
BZ2['BZ_DATA_ERROR'] = BZ_DATA_ERROR;
BZ2['BZ_DATA_ERROR_MAGIC'] = BZ_DATA_ERROR_MAGIC;
BZ2['BZ_IO_ERROR'] = BZ_IO_ERROR;
BZ2['BZ_UNEXPECTED_EOF'] = BZ_UNEXPECTED_EOF;
BZ2['BZ_OUTBUFF_FULL'] = BZ_OUTBUFF_FULL;
BZ2['BZ_CONFIG_ERROR'] = BZ_CONFIG_ERROR;
#ifndef BZ_NO_STDIO
BZ2['BZ_MAX_UNUSED'] = BZ_MAX_UNUSED;
#endif

#if 0

export default BZ2;

#else

exports.BZ2 = BZ2;

#endif
