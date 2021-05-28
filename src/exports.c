
#include <malloc.h>
#include "bzlib.h"

#define WASM_EXPORT(name) \
    __attribute__((used)) \
    __attribute__((export_name(#name)))

WASM_EXPORT(bzAlloc)
void *bzAlloc(int size) {
    return malloc(size);
}

WASM_EXPORT(bzFree)
void bzFree(void *ptr) {
    free(ptr);
}

WASM_EXPORT(bzCompressInit)
int bzCompressInit(
    bz_stream *strm,
    int blockSize100k,
    int verbosity,
    int workFactor)
{
    return BZ2_bzCompressInit(strm, blockSize100k, verbosity, workFactor);
}

WASM_EXPORT(bzCompress)
int bzCompress ( 
      bz_stream* strm, 
      int action 
   )
   {
       return BZ2_bzCompress(strm, action);
   }


void bz_internal_error ( int errcode )
{
    // TODO: fatal error
}
