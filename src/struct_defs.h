#ifndef _defs_h_
#define _defs_h_

#include <stddef.h>
#include "bzlib.h"

// struct bz_stream
#define BZ_STREAM_SIZEOF (12 * 4)
_Static_assert(BZ_STREAM_SIZEOF == sizeof(bz_stream), "Invalid BZ_STREAM_SIZEOF value");
// char *next_in;
#define BZ_STREAM_NEXT_IN (0 * 4)
_Static_assert(BZ_STREAM_NEXT_IN == offsetof(bz_stream, next_in), "Invalid BZ_STREAM_NEXT_IN value");
// unsigned int avail_in;
#define BZ_STREAM_AVAIL_IN (1 * 4)
_Static_assert(BZ_STREAM_AVAIL_IN == offsetof(bz_stream, avail_in), "Invalid BZ_STREAM_AVAIL_IN value");
// unsigned int total_in_lo32;
#define BZ_STREAM_TOTAL_IN_LO32 (2 * 4)
_Static_assert(BZ_STREAM_TOTAL_IN_LO32 == offsetof(bz_stream, total_in_lo32), "Invalid BZ_STREAM_TOTAL_IN_LO32 value");
// unsigned int total_in_hi32;
#define BZ_STREAM_TOTAL_IN_HI32 (3 * 4)
_Static_assert(BZ_STREAM_TOTAL_IN_HI32 == offsetof(bz_stream, total_in_hi32), "Invalid BZ_STREAM_TOTAL_IN_HI32 value");
// char *next_out;
#define BZ_STREAM_NEXT_OUT (4 * 4)
_Static_assert(BZ_STREAM_NEXT_OUT == offsetof(bz_stream, next_out), "Invalid BZ_STREAM_NEXT_OUT value");
// unsigned int avail_out;
#define BZ_STREAM_AVAIL_OUT (5 * 4)
_Static_assert(BZ_STREAM_AVAIL_OUT == offsetof(bz_stream, avail_out), "Invalid BZ_STREAM_AVAIL_OUT value");
// unsigned int total_out_lo32;
#define BZ_STREAM_TOTAL_OUT_LO32 (6 * 4)
_Static_assert(BZ_STREAM_TOTAL_OUT_LO32 == offsetof(bz_stream, total_out_lo32), "Invalid BZ_STREAM_TOTAL_OUT_LO32 value");
// unsigned int total_out_hi32;
#define BZ_STREAM_TOTAL_OUT_HI32 (7 * 4)
_Static_assert(BZ_STREAM_TOTAL_OUT_HI32 == offsetof(bz_stream, total_out_hi32), "Invalid BZ_STREAM_TOTAL_OUT_HI32 value");
// void *state;
#define BZ_STREAM_STATE (8 * 4)
_Static_assert(BZ_STREAM_STATE == offsetof(bz_stream, state), "Invalid BZ_STREAM_STATE value");
// void *(*bzalloc)(void *,int,int);
#define BZ_STREAM_BZALLOC (9 * 4)
_Static_assert(BZ_STREAM_BZALLOC == offsetof(bz_stream, bzalloc), "Invalid BZ_STREAM_BZALLOC value");
// void (*bzfree)(void *,void *);
#define BZ_STREAM_BZFREE (10 * 4)
_Static_assert(BZ_STREAM_BZFREE == offsetof(bz_stream, bzfree), "Invalid BZ_STREAM_BZFREE value");
// void *opaque;
#define BZ_STREAM_OPAQUE (11 * 4)
_Static_assert(BZ_STREAM_OPAQUE == offsetof(bz_stream, opaque), "Invalid BZ_STREAM_OPAQUE value");

#endif
