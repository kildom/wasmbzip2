# wasmbzip2

The **wasmbzip2** is a **[libbzip2](https://www.sourceware.org/bzip2/docs.html)**
JavaScript wrapper library with binaries compiled to WebAssembly. 

# High-level API

The high-level API is a JavaScript API created on top of a low-level API.
It provides convenient way of compressing and decompressing bzip2 data.

>>>...TODO sample code

## BZ2 class

### Static methods

**`setBinary(binary)`**

Sets the WebAssembly binary. The method does not exists in variants with embedded binary.
It must be called before `BZ2.create()`.

* **``binary``**  
   WebAssembly binary that is associated with current variant of wasmbzpi2.
   The binary can be in any form that `WebAssembly.compile()` or `WebAssembly.compileStreaming()`
   accepts.

**`async create(memoryMax, wasi)`**

Creates new instance of `BZ2` class that contains instance of `libbzip2` WebAssembly module.

* **`memoryMax`** *optional*  
    Maximum memory that WebAssembly module can allocate, unlimited by default.
* **`wasi`** *optional*  
    A WASI system calls. It is used only in `libbzip2-stdio` variant.
* **Return value**  
    A `Promise` that resolves to a `BZ2` object.


### Instance properties


**`version`**  
A libbzip2 version string.


### Instance methods

 
**`compress(input, maxOutputSize, level)`**

Compress single array at once and returns the result.

* **`input`**  
  An array-like input data.
* **`maxOutputSize`** *optional*  
  A maximum size of the output. By default, it
  is calculated based on input for worst case compression ratio. 
* **`level`** *optional*  
  A compression level from 1 to 9. Default is 9.
* **Return value**  
  A `Uint8Array` containing compressed data.
* **Throws**  
 `BZ2.BufferError` if output is bigger than `maxOutputSize`.  
 `BZ2.Error` if libbzip2 error occurred.


**`compress(input, output, level)`**

Compress single array at once and writes to an output array.

* **`input`**  
  An array-like input data.
* **`output`**  
  A `Uint8Array` where compressed data will be written. Worst case output size is the input size + 1% + 600 bytes.
* **`level`** *optional*  
  A compression level from 1 to 9. Default is 9.
* **Return value**  
  Number of bytes written to the output array.
* **Throws**  
 `BZ2.BufferError` if output does not fit into the output array.  
 `BZ2.Error` if libbzip2 error occurred.
  

**`decompress(input, maxOutputSize, lowMem)`**

Decompress single array at once and returns the result.

* **`input`**  
  An array-like input data.
* **`maxOutputSize`**  
  A maximum size of the output. Internal buffer of that size is allocated, so this value cannot be extremely high.
* **`lowMem`** *optional*  
  If it is present and it is `true`, a slower algorithm  will be used that consumes less memory.
* **Return value**  
  A `Uint8Array` containing decompressed data.
* **Throws**  
 `BZ2.BufferError` if output is bigger than `maxOutputSize`.  
 `BZ2.Error` if libbzip2 error occurred.


**`decompress(input, output, lowMem)`**

Decompress single array at once and writes to an output array.

* **`input`**  
  An array-like input data.
* **`output`**  
  A `Uint8Array` where compressed data will be written.
* **`lowMem`** *optional*  
  If it is present and it is `true`, a slower algorithm will be used that consumes less memory.
* **Return value**  
  Number of bytes written to the output array.
* **Throws**  
 `BZ2.BufferError` if output does not fit into the output array.  
 `BZ2.Error` if libbzip2 error occurred.

## BZ2.Processing class

It is an abstract base class for `BZ2.Compression` and `BZ2.Decompression` classes.

### Instance properties

**`totalInput`**  
A total number of consumed bytes.

**`totalOutput`**  
A total number of produced bytes.

**`pendingInput`**  
A number of bytes pending in the internal input buffer.

**`pendingOutput`**  
A number of bytes pending in the internal output buffer.

**`finished`**  
A boolean indicating that entire output stream was read.

### Instance methods

**`getInput()`**

Gets `Uint8Array` that is located at the internal input buffer. Providing it to `compress()` or `decompress()` method avoids unnecessary copying of the memory. This method will return the same array if called more than once without `compress()` or `decompress()` call. If the internal input buffer is full, zero-length array is returned. The returned array is valid until the next operation on the libbzip2 library instance. 


**`readOutput()`**

Reads `Uint8Array` from the internal output buffer. The returned array is located directly at the buffer, so no unnecessary memory copying is done by this method. The returned data is removed from the internal buffer. If the buffer is empty, `null` is returned. The returned array is valid until the next operation on the libbzip2 library instance. 


**`reset()`**

Resets the state of the object allowing compression or decompression of an another stream.


**`dispose()`**

Release WebAssembly memory occupied by this object.
> **WARNING!!!**  
> To avoid WebAssembly memory leaks in the `BZ2` object call this
> method when `BZ2.Compression` or `BZ2.Decompression` object is no longer needed.

## BZ2.Compression class

### Inheritance

This class extends `BZ2.Processing` class and inherits all its members.

### Constructor

**`new BZ2.Compression(bz2, inputBufferSize, outputBufferSize, level)`**

* `bz2`  
  A `BZ2` object that will handle the compression.
* `inputBufferSize` *optional*  
  A size of the internal input buffer, default is 128K.
* `outputBufferSize` *optional*  
  A size of the internal output buffer, default is 128K.
* `level` *optional*  
  A compression level from 1 to 9, default is 9.


### Instance methods

**`compress(input, inputOffset, inputLength, output, outputOffset, outputLength)`**

Compress part of a data.

* `input`  
  A `Uint8Array` with the input bytes. A `null` should be passed at the end to indicate end of data.
* `inputOffset` *optional*  
  A start offset in `input` array, zero by default.
* `inputLength` *optional*  
  A length of a portion of the `input` array. Default is until the end of the array.
* `output` *optional*  
  A `Uint8Array` where the output will be written. By default, output will remain in the internal output buffer and can be read later with the `readOutput()` method.
* `outputOffset` *optional, forbidden if `output` is missing*  
  A start offset in `output` array, zero by default.
* `outputLength` *optional, forbidden if `output` is missing*  
  A length of a portion of the `output` array. Default is until the end of the array.
* **Return value**  
  An object with following properties:
    * `bytesRead`  
      A number of bytes read from the `input`.
    * `bytesWritten`  
      A number of bytes written to the `output`.
    * `finished`  
      A boolean indicating that entire output stream was read.


## BZ2.Decompression class

### Inheritance

This class extends `BZ2.Processing` class and inherits all its members.

### Constructor

**`new BZ2.Decompression(bz2, inputBufferSize, outputBufferSize, lowMem)`**

* `bz2`  
  A `BZ2` object that will handle the decompression.
* `inputBufferSize` *optional*  
  A size of the internal input buffer, default is 128K.
* `outputBufferSize` *optional*  
  A size of the internal output buffer, default is 128K.
* `lowMem` *optional*  
  If it is present and it is `true`, a slower algorithm will be used that consumes less memory.

### Instance methods

**`decompress(input, inputOffset, inputLength, output, outputOffset, outputLength)`**

Decompress part of a data.

* `input`  
  A `Uint8Array` with the input bytes. A `null` should be passed at the end to indicate end of data.
* `inputOffset` *optional*  
  A start offset in `input` array, zero by default.
* `inputLength` *optional*  
  A length of a portion of the `input` array. Default is until the end of the array.
* `output` *optional*  
  A `Uint8Array` where the output will be written. By default, output will remain in the internal output buffer and can be read later with the `readOutput()` method.
* `outputOffset` *optional, forbidden if `output` is missing*  
  A start offset in `output` array, zero by default.
* `outputLength` *optional, forbidden if `output` is missing*  
  A length of a portion of the `output` array. Default is until the end of the array.
* **Return value**  
  An object with following properties:
    * `bytesRead`  
      A number of bytes read from the `input`.
    * `bytesWritten`  
      A number of bytes written to the `output`.
    * `finished`  
      A boolean indicating that entire output stream was read.

* `input` - `Uint8Array` with input bytes. `null` can be provided at the to indicate end of data. Indicating and of data is not necessary, but it will help detection of unexpected end of input.
* `inputOffset` - *optional*, start offset in `input` array, zero by default
* `inputLength` - *optional*, length of input data
* `output` - *optional*, `Uint8Array` where the output will be written. By default output will remain in the internal output buffer and can be read with the `readOutput()` method.
* `inputOffset` - *optional*, *forbidden if `output` is missing*, start offset in `output` array, zero by default
* `inputLength` - *optional*, *forbidden if `output` is missing*, maximum length of output
* returns object:
    * `bytesRead` - number of bytes read from the `input`
    * `bytesWritten` - number of bytes written to the `output`
    * `finished` - `true` if all output data have been read


# Low-level API

The low-level API exposes libbzip2 API and adds some utility functions and classes. It it more advanced and requires basic knowledge of C and WebAssembly.

Following sample shows how to use low-level API.
>>> TODO: Run this sample
```javascript
    // Prepare input data
let input = (new TextEncoder()).encode('Hello World!');
    // Create library instance
let bz2 = await BZ2.create();
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

## BZ2.stream

JavaScript has no structures like the C does, so libbzip2 `bz_stream` structure is wrapped by a `BZ2.stream` class.

### Constructor

 * `new BZ2.stream(bz2)` - Create a new structure in the `bz2` instance memory. The memory is dynamically allocated, so it must be deallocated with the `dispose()` method.

### Instance methods
 * `dispose()` - Deallocate memory occupied by this structure. After the call, the structure is unusable.
   > **WARNING!** Call it when needed to avoid memory leaks in the `BZ2` instance object.
 * `clear()` - Fill the memory with zeros.

### Instance properties
 * `ptr` - This pointer to this structure. You have to provide this value to low-level API functions.
 * `view` - `DataView` of the wasm memory occupied by this structure
 * Other properties mapped from `bz_stream` structure fields are summarized in following table.

| libbzip2 field                | `BZ2.stream` property | Comment
|-------------------------------|-----------------------|---------
| `next_in`                     | `next_in`             | |
| `avail_in`                    | `avail_in`            | |
| `total_in_lo32`/`hi32`        | `total_in`            | read-only
| `next_out`                    | `next_out`            | |
| `avail_out`                   | `avail_out`           | |
| `total_out_lo32`/`hi32`       | `total_out`           | read-only
| `state`                       |                       | not exposed - internal libbzip2 field
| `bzalloc`, `bzfree`, `opaque` |                       | not exposed - wasmbzip2 is always using standard allocator

# Variants

**wasmbzip2** have a few variants of the binaries.

In most cases, you probably need the basic one: `libbzip2`.
If you want just compression or decompression you can use a smaller binary `libbzip2-cmp` or `libbzip2-dec`.
Variant `libbzip2-dbg` contains additional debug information.
Variants with `-emb` suffix contains WebAssembly binary embedded in the source file,
so they do not need for `BZ2.setBinary()` call.

| Variant            | compression | decompression | debug | embedded binary |
|--------------------|-------------|---------------|-------|-----------------|
| `libbzip2`         | YES         | YES           | -     | -               |
| `libbzip2-emb`     | YES         | YES           | -     | YES             |
| `libbzip2-cmp`     | YES         | -             | -     | -               |
| `libbzip2-cmp-emb` | YES         | -             | -     | YES             |
| `libbzip2-dec`     | -           | YES           | -     | -               |
| `libbzip2-dec-emb` | -           | YES           | -     | YES             |
| `libbzip2-dbg`     | YES         | YES           | YES   | -               |
| `libbzip2-dbg-emb` | YES         | YES           | YES   | YES             |

**wasmbzip2** also provides `libbzip2-stdio` variant which is not well tested, because it is not very useful in a browser context. It exports libbzip2 API for `.bz2` file manipulation. See the `libbzip2-stdio.js` source code for more details.

# Building

>>>TODO

