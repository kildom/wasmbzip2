
#include <malloc.h>
#ifndef BZ_NO_STDIO
#include <stdio.h>
#endif

#include "bzlib.h"
#include "struct_defs.h"

// Utility macros

#define WASM_EXPORT(name) \
    __attribute__((used)) \
    __attribute__((export_name(#name)))

#define WASM_IMPORT(name) \
    __attribute__((used)) \
    __attribute__((import_name(#name)))


// libbzip2 internal error (assert) for no-stdio variant

#ifdef BZ_NO_STDIO

WASM_IMPORT(bzInternalError)
_Noreturn void bzInternalError(int errcode);

_Noreturn void bz_internal_error(int errcode)
{
    bzInternalError(errcode);
}

#endif


// Exposing default allocation

WASM_EXPORT(malloc)
void *stdlibMalloc(int size) {
    return malloc(size);
}

WASM_EXPORT(free)
void stdlibFree(void *ptr) {
    free(ptr);
}

WASM_EXPORT(realloc)
void *stdlibRealloc(void *ptr, int size) {
    return realloc(ptr, size);
}


// Low-level compression

#ifndef NO_COMPRESS

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
      int action)
{
    return BZ2_bzCompress(strm, action);
}

WASM_EXPORT(bzCompressEnd)
int bzCompressEnd(
      bz_stream* strm)
{
    return BZ2_bzCompressEnd(strm);
}

#endif


// Low-level decompression

#ifndef NO_DECOMPRESS

WASM_EXPORT(bzDecompressInit)
int bzDecompressInit(
      bz_stream *strm,
      int       verbosity,
      int       small)
{
    return BZ2_bzDecompressInit(strm, verbosity, small);
}

WASM_EXPORT(bzDecompress)
int bzDecompress(
      bz_stream* strm)
{
    return BZ2_bzDecompress(strm);
}

WASM_EXPORT(bzDecompressEnd)
int bzDecompressEnd(
      bz_stream *strm)
{
    return BZ2_bzDecompressEnd(strm);
}

#endif


// Simple one-step operations

#ifndef NO_COMPRESS

WASM_EXPORT(bzBuffToBuffCompress)
int bzBuffToBuffCompress(
      char*         dest,
      unsigned int* destLen,
      char*         source,
      unsigned int  sourceLen,
      int           blockSize100k,
      int           verbosity,
      int           workFactor)
{
    return BZ2_bzBuffToBuffCompress(dest, destLen, source, sourceLen, blockSize100k, verbosity, workFactor);
}

#endif

#ifndef NO_DECOMPRESS

WASM_EXPORT(bzBuffToBuffDecompress)
int bzBuffToBuffDecompress(
      char*         dest,
      unsigned int* destLen,
      char*         source,
      unsigned int  sourceLen,
      int           small,
      int           verbosity)
{
    return BZ2_bzBuffToBuffDecompress(dest, destLen, source, sourceLen, small, verbosity);
}

#endif


// libbzip2 version information

WASM_EXPORT(bzlibVersion)
const char * bzlibVersion(
      void)
{
    return BZ2_bzlibVersion();
}


#ifndef BZ_NO_STDIO

// fopen/fclose wrappers for bz2 file reading/writing

WASM_EXPORT(fopen)
FILE* stdlibFopen(const char *filename, const char *modes)
{
    return fopen(filename, modes);
}

WASM_EXPORT(fclose)
int stdlibFclose(FILE* file)
{
    return fclose(file);
}


// bz2 file reading

WASM_EXPORT(bzReadOpen)
BZFILE* bzReadOpen(
      int*  bzerror,
      FILE* f,
      int   verbosity,
      int   small,
      void* unused,
      int   nUnused)
{
    return BZ2_bzReadOpen(bzerror, f, verbosity, small, unused, nUnused);
}

WASM_EXPORT(bzReadClose)
void bzReadClose(
      int*    bzerror,
      BZFILE* b)
{
    return BZ2_bzReadClose(bzerror, b);
}

WASM_EXPORT(bzReadGetUnused)
void bzReadGetUnused(
      int*    bzerror,
      BZFILE* b,
      void**  unused,
      int*    nUnused)
{
    return BZ2_bzReadGetUnused(bzerror, b, unused, nUnused);
}

WASM_EXPORT(bzRead)
int bzRead(
      int*    bzerror,
      BZFILE* b,
      void*   buf,
      int     len)
{
    return BZ2_bzRead(bzerror, b, buf, len);
}


// bz2 file writing

WASM_EXPORT(bzWriteOpen)
BZFILE* bzWriteOpen(
      int*  bzerror,
      FILE* f,
      int   blockSize100k,
      int   verbosity,
      int   workFactor)
{
    return BZ2_bzWriteOpen(bzerror, f, blockSize100k, verbosity, workFactor);
}

WASM_EXPORT(bzWrite)
void bzWrite(
      int*    bzerror,
      BZFILE* b,
      void*   buf,
      int     len)
{
    return BZ2_bzWrite(bzerror, b, buf, len);
}

WASM_EXPORT(bzWriteClose)
void bzWriteClose(
      int*          bzerror,
      BZFILE*       b,
      int           abandon,
      unsigned int* nbytes_in,
      unsigned int* nbytes_out)
{
    return BZ2_bzWriteClose(bzerror, b, abandon, nbytes_in, nbytes_out);
}

WASM_EXPORT(bzWriteClose64)
void bzWriteClose64(
      int*          bzerror,
      BZFILE*       b,
      int           abandon,
      unsigned int* nbytes_in_lo32,
      unsigned int* nbytes_in_hi32,
      unsigned int* nbytes_out_lo32,
      unsigned int* nbytes_out_hi3)
{
    return BZ2_bzWriteClose64(bzerror, b, abandon, nbytes_in_lo32, nbytes_in_hi32, nbytes_out_lo32, nbytes_out_hi3);
}


// stdio-like bz2 file reading/writing

WASM_EXPORT(bzopen)
BZFILE * bzopen(
      const char *path,
      const char *mod)
{
    return BZ2_bzopen(path, mod);
}

WASM_EXPORT(bzdopen)
BZFILE * bzdopen(
      int        fd,
      const char *mod)
{
    return BZ2_bzdopen(fd, mod);
}

WASM_EXPORT(bzread)
int bzread(
      BZFILE* b,
      void* buf,
      int len)
{
    return BZ2_bzread(b, buf, len);
}


WASM_EXPORT(bzwrite)
int bzwrite(
      BZFILE* b,
      void*   buf,
      int     len)
{
    return BZ2_bzwrite(b, buf, len);
}


WASM_EXPORT(bzflush)
int bzflush(
      BZFILE* b)
{
    return BZ2_bzflush(b);
}


WASM_EXPORT(bzclose)
void bzclose(
      BZFILE* b)
{
    return BZ2_bzclose(b);
}


WASM_EXPORT(bzerror)
const char * bzerror(
      BZFILE *b,
      int    *errnu)
{
    return BZ2_bzerror(b, errnu);
}

#endif
