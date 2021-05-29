# wasmbzip2

This **wasmbzip2** is a **[libbzip2](https://www.sourceware.org/bzip2/docs.html)** compiled into Web Assembly and wrapped by the JavaScript. 

## Variants

**wasmbzip2** have a few variants of the binaries.

In most cases, you probably need the basic one: `libbzip2`.
If you want just compression or decompression you can use a smaller binary `libbzip2-cmp` or `libbzip2-dec`. Variant `libbzip2-dbg` contains additional debug information.

| Variant        | compression | decompression | debug |
|----------------|-------------|---------------|-------|
| `libbzip2`     | YES         | YES           | -     |
| `libbzip2-cmp` | YES         | -             | -     |
| `libbzip2-dec` | -           | YES           | -     |
| `libbzip2-dbg` | YES         | YES           | YES   |

**wasmbzip2** also provides `libbzip2-stdio` variant which is not well tested, because it is not very useful in a browser context. It exports libbzip2 API for `.bz2` file manipulation. See the `libbzip2-stdio.js` source code for more details.

## High-level API

The high-level API is created in JavaScript on top of the low-level API.
It provides convenient way of compression and decompression.

>>>...TODO

## Low-level API

The low-level API exposes libbzip2 API and adds some utility functions and classes. It it more advanced and requires basic knowledge of C and Web Assembly.

Following sample shows how to use low-level API.
>>> TODO: Run this sample
```javascript
    // Prepare input data
let input = (new TextEncoder()).encode('Hello World!');
    // Create library instance
let bz2 = new BZ2();
    // Allocate memory
let inptr = bz2.malloc(1024);
let outptr = bz2.malloc(1024);
let lenptr = bz2.malloc(4);
    // Fill the input memory
(new Uint8Array(bz2.memory.buffer, inptr, 1024)).set(input);
(new DataView(bz2.memory.buffer, lenptr, 4)).setUint32(0, 1024, true);
    // Execute compression function
let res = bz2.bzBuffToBuffCompress(out, lenptr, inptr, input.length, 9, 0, 0);
    // Show the results
let len = (new DataView(bz2.memory.buffer, lenptr, 4)).getUint32(0, true);
console.log(`Compression result ${res}, output:`);
console.log(new Uint8Array(bz2.memory.buffer, outptr, len));
    // Deallocate the memory
bz2.free(inptr);
bz2.free(outptr);
bz2.free(lenptr);
```

You can find details about API in:
  * [libbzip2 documentation](https://www.sourceware.org/bzip2/manual/manual.html),
  * [stdlib documentation](https://en.cppreference.com/w/c/memory/malloc).

Below table shows the C symbols and how they are accessed from the **wasmbzip2**. The `bz2` object is an instance of `BZ2` class. The `verbosity` parameter is ignored. The pointers are 32-bit long. Using low-level functions requires direct access to `WebAssembly.Memory` via `bz2.memory` property. 

| libbzip2/stdlib              | wasmbzip2                    | 
|------------------------------|------------------------------|
| `malloc`                     | `bz2.malloc`                 |
| `free`                       | `bz2.free`                   |
| `realloc`                    | `bz2.realloc`                |
| `BZ2_bzCompressInit`         | `bz2.bzCompressInit`         |
| `BZ2_bzCompress`             | `bz2.bzCompress`             |
| `BZ2_bzCompressEnd`          | `bz2.bzCompressEnd`          |
| `BZ2_bzDecompressInit`       | `bz2.bzDecompressInit`       |
| `BZ2_bzDecompress`           | `bz2.bzDecompress`           |
| `BZ2_bzDecompressEnd`        | `bz2.bzDecompressEnd`        |
| `BZ2_bzBuffToBuffCompress`   | `bz2.bzBuffToBuffCompress`   |
| `BZ2_bzBuffToBuffDecompress` | `bz2.bzBuffToBuffDecompress` |
| `BZ2_bzlibVersion`           | `bz2.bzlibVersion`           |
| `BZ_RUN`                     | `BZ2.RUN`                    |
| `BZ_FLUSH`                   | `BZ2.FLUSH`                  |
| `BZ_FINISH`                  | `BZ2.FINISH`                 |
| `BZ_OK`                      | `BZ2.OK`                     |
| `BZ_RUN_OK`                  | `BZ2.RUN_OK`                 |
| `BZ_FLUSH_OK`                | `BZ2.FLUSH_OK`               |
| `BZ_FINISH_OK`               | `BZ2.FINISH_OK`              |
| `BZ_STREAM_END`              | `BZ2.STREAM_END`             |
| `BZ_SEQUENCE_ERROR`          | `BZ2.SEQUENCE_ERROR`         |
| `BZ_PARAM_ERROR`             | `BZ2.PARAM_ERROR`            |
| `BZ_MEM_ERROR`               | `BZ2.MEM_ERROR`              |
| `BZ_DATA_ERROR`              | `BZ2.DATA_ERROR`             |
| `BZ_DATA_ERROR_MAGIC`        | `BZ2.DATA_ERROR_MAGIC`       |
| `BZ_IO_ERROR`                | `BZ2.IO_ERROR`               |
| `BZ_UNEXPECTED_EOF`          | `BZ2.UNEXPECTED_EOF`         |
| `BZ_OUTBUFF_FULL`            | `BZ2.OUTBUFF_FULL`           |
| `BZ_CONFIG_ERROR`            | `BZ2.CONFIG_ERROR`           |
| `bz_stream`                  | `BZ2.stream` (details below) |

> **WARNING!** Call `bz2.free`, `bz2.bzCompressEnd` and `bz2.bzDecompressEnd` when needed to avoid memory leaks in the `bz2` object.

### BZ2.stream

JavaScript has no structures like the C does, so libbzip2 `bz_stream` structure is wrapped by a `BZ2.stream` class.

**Constructor**

 * `new BZ2.stream(bz2)` - Create a new structure in the `bz2` instance memory. The memory is dynamically allocated, so it must be deallocated with the `dispose()` method.

**Methods**
 * `dispose()` - Deallocate memory occupied by this structure. After the call, the structure is unusable.
   > **WARNING!** Call it when needed to avoid memory leaks in the `BZ2` instance object.
 * `clear()` - Fill the memory with zeros.

**Properties**
 * `ptr` - This pointer to this structure. You have to provide this value to low-level API functions.
 * `view` - `DataView` of the wasm memory occupied by this structure
 * Other properties mapped to libbzip2 `bz_stream` structure are summarized in following table.


| libbzip2 field                | `BZ2.stream` property | Comment
|-------------------------------|-----------------------|---------
| `next_in`                     | `next_in`             |
| `avail_in`                    | `avail_in`            |
| `total_in_lo32`/`hi32`        | `total_in`            | read-only
| `next_out`                    | `next_out`            |
| `avail_out`                   | `avail_out`           |
| `total_out_lo32`/`hi32`       | `total_out`           | read-only
| `state`                       |                       | not exposed - internal libbzip2 field
| `bzalloc`, `bzfree`, `opaque` |                       | not exposed - wasmbzip2 is always using standard allocator

## Building

>>>TODO

