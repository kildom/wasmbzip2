
__BEGIN_INCLUDES__
//#include "bzlib.h"
//#include "struct_defs.h"
__END_INCLUDES__

//#ifndef BZ_NO_STDIO
/* libbzip2 provides two kinds of API for `.bz2` file manipulation.
 * They are not very convenient in a browsers. This variant of
 * wasmbzip2 allows access to them. It also contains everything from
 * other variants. The `verbosity` parameter is not ignores in this
 * variant.
 * 
 * The API does not have another layer above it, so call it as usual
 * low-level API functions. Additionally, this variant provides fopen()
 * and fclose() functions from the stdlib.
 * 
 * This variants require file system layer implementation from you as
 * the second parameter of BZ2.create() function.
 * See wasi-libc project for details:
 * https://github.com/WebAssembly/wasi-libc
 */
//#endif



class BZ2 {

    constructor(instance, memory) {
        this.instance = instance;
        this.memory = memory;
        for (let name in instance.exports) {
            this[name] = instance.exports[name];
        }
        this.tempBufferPtr = this._checked_malloc(4);
    }

    get version() {
        let cstr = this.bzlibVersion();
        let buf = new Uint8Array(this.memory.buffer, cstr);
        let end = buf.indexOf(0);
        return (new TextDecoder()).decode(new Uint8Array(buf.buffer, cstr, end));
    }

    _checked_malloc(size) {
        let ptr = this.malloc(size);
        if (ptr == 0)
            throw Error('wasmbzip2: Out of memory');
        return ptr;
    }

    _oneStepOperation(input, output, level) {
        let outptr = 0;
        let inptr = 0;
        try {
            let outlen = (typeof (output) == 'number') ? output : output.length;
            outptr = this._checked_malloc(outlen);
            (new DataView(this.memory.buffer, this.tempBufferPtr, 4)).setUint32(0, outlen, true);
            inptr = this._checked_malloc(input.length);
            (new Uint8Array(this.memory.buffer, inptr, input.length)).set(input);
            let ret;
            //#ifndef NO_COMPRESS
            //#ifndef NO_DECOMPRESS
            if (level <= 0) {
                ret = this.bzBuffToBuffDecompress(outptr, this.tempBufferPtr, inptr, input.length, -level, 0);
            } else {
                ret = this.bzBuffToBuffCompress(outptr, this.tempBufferPtr, inptr, input.length, level, 0, 0);
            }
            //#else
            ret = this.bzBuffToBuffCompress(outptr, this.tempBufferPtr, inptr, input.length, level, 0, 0);
            //#endif
            //#else
            ret = this.bzBuffToBuffDecompress(outptr, this.tempBufferPtr, inptr, input.length, -level, 0);
            //#endif
            BZ2._checkErrorCode(ret);
            outlen = (new DataView(this.memory.buffer, this.tempBufferPtr, 4)).getUint32(0, true);
            if (typeof (output) == 'number') {
                return new Uint8Array(this.memory.buffer.slice(outptr, outptr + outlen));
            } else {
                output.set(new Uint8Array(this.memory.buffer, outptr, outlen));
                return outlen;
            }
        } finally {
            if (outptr)
                this.free(outptr);
            if (inptr)
                this.free(inptr);
        }
    }

    //#ifndef NO_COMPRESS
    compress(input, output, level) {
        output = output || Math.ceil(input.length * 1.01) + 600;
        level = level || 9;
        if (level > 9 || level < 1)
            throw Error('wasmbzip2: Invalid compression level');
        return this._oneStepOperation(input, output, level);
    }
    //#endif

    //#ifndef NO_DECOMPRESS
    decompress(input, output, lowMem) {
        return this._oneStepOperation(input, output, lowMem ? -1 : 0);
    }
    //#endif

}

//#ifndef EMBED_WASM
BZ2.setBinary = function (binary) {
    if ((binary instanceof ArrayBuffer) || ('buffer' in binary && binary.buffer instanceof ArrayBuffer)) {
        BZ2._wasmModule = WebAssembly.compile(binary);
    } else {
        BZ2._wasmModule = WebAssembly.compileStreaming(binary);
    }
};
//#endif

BZ2._getModule = async function () {
    //#ifdef EMBED_WASM
    if (BZ2._wasmModule == null) {
        const polyatob = (typeof (atob) !== 'undefined')
            ? atob
            : (base64 => Buffer.from(base64, 'base64').toString('binary'));
        const embeddedBinary = Uint8Array.from(polyatob(__WASM_BASE64_GOES_HERE__
        ), c => c.charCodeAt(0));
        BZ2._wasmModule = WebAssembly.compile(embeddedBinary);
    }
    //#else
    if (BZ2._wasmModule == null) {
        throw Error('This variant of wasmbzip2 requires external binary set by BZ2.setBianry().');
    }
    if (BZ2._wasmModule instanceof Promise) {
        BZ2._wasmModule = await BZ2._wasmModule;
    }
    //#endif
    return BZ2._wasmModule;
};

BZ2.create = async function (memoryMax, wasi) {
    let memopt = { initial: 4 };
    if (memoryMax) {
        memopt.maximum = Math.max(8, Math.floor(memoryMax / 65536));
    }
    let memory = new WebAssembly.Memory(memopt);
    let instance = await WebAssembly.instantiate(await BZ2._getModule(), {
        env: {
            memory: memory,
            //#ifdef BZ_NO_STDIO
            bzInternalError: errorCode => {
                throw new Error(`BZip2 library internal error ${errorCode}`);
            },
            //#endif
        },
        //#ifndef BZ_NO_STDIO
        wasi_snapshot_preview1: wasi,
        //#endif
    });
    return new BZ2(instance, memory);
};

BZ2._checkErrorCode = function (code, allowPositive) {
    if (code == BZ2.SEQUENCE_ERROR) throw Error('wasmbzip2: Sequence error');
    if (code == BZ2.PARAM_ERROR) throw Error('wasmbzip2: Invalid parameter');
    if (code == BZ2.MEM_ERROR) throw Error('wasmbzip2: Out of memory');
    if (code == BZ2.DATA_ERROR) throw Error('wasmbzip2: Data integrity error');
    if (code == BZ2.DATA_ERROR_MAGIC) throw Error('wasmbzip2: Invalid magic bytes');
    if (code == BZ2.IO_ERROR) throw Error('wasmbzip2: IO error');
    if (code == BZ2.UNEXPECTED_EOF) throw Error('wasmbzip2: Unexpected end of stream');
    if (code == BZ2.OUTBUFF_FULL) throw Error('wasmbzip2: Output buffer full');
    if (code == BZ2.CONFIG_ERROR) throw Error('wasmbzip2: Invalid configuration');
    if (code < 0) throw Error('wasmbzip2: Unknown error');
    if (code != BZ2.OK && !allowPositive) throw Error('wasmbzip2: Unexpected return value');
};

BZ2.Processing = class {

    constructor(bz2, inputBufferSize, outputBufferSize, level, compression) {
        let ok = false;
        try {
            this.state = BZ2._RUNNING;
            this.bz2 = bz2;
            this.memory = bz2.memory;
            this.stream = new BZ2.stream(bz2);
            this.inputBufSize = inputBufferSize;
            this.outputBufSize = outputBufferSize;
            this.bufferPtr = bz2._checked_malloc(inputBufferSize + outputBufferSize);
            this.inputBufBegin = this.bufferPtr;
            this.stream.next_in = this.inputBufBegin;
            this.stream.avail_in = 0;
            this.outputBufBegin = this.inputBufBegin + inputBufferSize;
            this.compression = compression;
            let code;
            if (compression) {
                code = bz2.bzCompressInit(this.stream.ptr, level, 0, 0);
            } else {
                code = bz2.bzDecompressInit(this.stream.ptr, 0, -level);
            }
            BZ2._checkErrorCode(code);
            ok = true;
        } finally {
            if (!ok) this.dispose();
        }
    }

    dispose() {
        if (this.state != BZ2._DISPOSED) {
            if (this.compression) {
                try { this.bz2.bzCompressEnd(this.stream.ptr); } catch (ex) { }
            } else {
                try { this.bz2.bzDecompressEnd(this.stream.ptr); } catch (ex) { }
            }
            try { this.stream.dispose(); } catch (ex) { }
            try { this.bz2.free(this.bufferPtr); } catch (ex) { }
            this.state == BZ2._DISPOSED;
        }
    }

    get totalInput() {
        return this.stream.total_in + this.stream.avail_in;
    }

    get totalOutput() {
        return this.stream.total_out;
    }

    get finished() {
        return this.state == BZ2._FINISHED;
    }

    getInput() {
        if (this.state != BZ2._RUNNING)
            throw Error('wasmbzip2: Invalid state');
        if (this.stream.avail_in > 0)
            return new Uint8Array(this.memory.buffer, this.inputBufBegin, 0);
        return new Uint8Array(this.memory.buffer, this.inputBufBegin, this.inputBufSize);
    }

    _spitParams(params) {
        let i = 0;
        let input, inputOffset, inputLength, output, outputOffset, outputLength;
        input = params[i++];
        if (typeof (params[i]) == 'number') {
            inputOffset = params[i++];
        } else {
            inputOffset = 0;
        }
        if (typeof (params[i]) == 'number') {
            inputLength = params[i++];
        } else {
            inputLength = input ? input.length - inputOffset : 0;
        }
        if (input) {
            inputOffset =+ input.byteOffset;
            input = input.buffer;
        }
        output = params[i++];
        if (typeof (params[i]) == 'number') {
            outputOffset = params[i++];
        } else {
            outputOffset = 0;
        }
        if (typeof (params[i]) == 'number') {
            outputLength = params[i++];
        } else {
            outputLength = output ? output.length - outputOffset : 0;
        }
        return {
            input,
            inputOffset,
            inputLength,
            output,
            outputOffset,
            outputLength,
            initialInputOffset: inputOffset,
            initialOutputOffset: outputOffset
        };
    }

    _process(params) {
        let {
            input,
            inputOffset,
            inputLength,
            output,
            outputOffset,
            outputLength,
            initialInputOffset,
            initialOutputOffset
        } = this._spitParams(params);

        if (this.state == BZ2._RUNNING) {
            if (!input) {
                this.state = BZ2._FINISHING;
            }
        } else if (this.state != BZ2._FINISHING || input) {
            throw Error('wasmbzip2: Invalid state');
        }

        if (!output) {
            this.stream.next_out = this.outputBufBegin;
            this.stream.avail_out = this.outputBufSize;
        }

        let ret = {
            bytesWritten: 0,
            bytesRead: 0,
            finished: false,
        };

        while ((inputLength + this.stream.avail_in > 0 || this.state == BZ2._FINISHING)
            && (!output || outputLength > 0)
            && (output || this.stream.avail_out > 0)) {

            if (inputLength > 0
                && input == this.memory.buffer
                && inputOffset == this.inputBufBegin
                && inputLength <= this.inputBufSize) {
                this.stream.next_in = this.inputBufBegin;
                this.stream.avail_in = inputLength;
                inputOffset += inputLength;
                inputLength = 0;
            } else if (this.stream.avail_in == 0 && inputLength > 0) {
                let copyLength = Math.min(this.inputBufSize, inputLength);
                this.stream.next_in = this.inputBufBegin;
                this.stream.avail_in = copyLength;
                (new Uint8Array(this.memory.buffer, this.inputBufBegin, this.inputBufSize))
                    .set(new Uint8Array(input, inputOffset, copyLength));
                inputOffset += copyLength;
                inputLength -= copyLength;
            }

            if (output) {
                this.stream.next_out = this.outputBufBegin;
                this.stream.avail_out = Math.min(this.outputBufSize, outputLength);
            }

            let code;
            if (this.compression) {
                code = this.bz2.bzCompress(this.stream.ptr, this.state == BZ2._FINISHING ? BZ2.FINISH : BZ2.RUN);
            } else {
                code = this.bz2.bzDecompress(this.stream.ptr);
            }
            BZ2._checkErrorCode(code, true);

            let outputBytes = this.stream.next_out - this.outputBufBegin;
            if (output) {
                output.set(new Uint8Array(this.memory.buffer, this.outputBufBegin, outputBytes), outputOffset);
                outputOffset += outputBytes;
                outputLength -= outputBytes;
            }

            if (code == BZ2.STREAM_END) {
                this.state = BZ2._FINISHED;
                ret.finished = true;
                break;
            }

            if (!this.compression && this.state == BZ2._FINISHING && outputBytes == 0 && this.stream.avail_in == 0) {
                throw Error('wasmbzip2: Unexpected end of compressed data');
            }
        }

        ret.bytesWritten = inputOffset - initialInputOffset;

        if (!output) {
            ret.bytesRead = this.stream.next_out - this.outputBufBegin;
            ret.output = new Uint8Array(this.memory.buffer, this.outputBufBegin, ret.bytesRead);
        } else {
            ret.bytesRead = outputOffset - initialOutputOffset;
        }

        return ret;
    }

    reset() {
        if (this.state == BZ2._DISPOSED)
            throw Error('wasmbzip2: Invalid state');
        this.bz2.bzCompressEnd(this.stream.ptr);
        this.state = BZ2._RUNNING;
        this.stream.next_in = this.inputBufBegin;
        this.stream.avail_in = 0;
        let code;
        if (this.compression) {
            code = bz2.bzCompressInit(this.stream.ptr, level, 0, 0);
        } else {
            code = bz2.bzDecompressInit(this.stream.ptr, 0, -level);
        }
        BZ2._checkErrorCode(code);
    }
};

//#ifndef NO_COMPRESS

BZ2.Compress = class extends BZ2.Processing {

    constructor(bz2, inputBufferSize, outputBufferSize, level) {
        super(bz2, inputBufferSize, outputBufferSize, level, true);
    }


    compress(...params) {
        return this._process(params);
    }

};

//#endif

//#ifndef NO_DECOMPRESS

BZ2.Decompress = class extends BZ2.Processing {

    constructor(bz2, inputBufferSize, outputBufferSize, lowMem) {
        super(bz2, inputBufferSize, outputBufferSize, lowMem ? 1 : 0, false);
    }

    decompress(...params) {
        return this._process(params);
    }

};

//#endif

BZ2.stream = class {

    constructor(bz) {
        this.bz = bz;
        this.memory = bz.memory;
        this.ptr = bz.malloc(BZ_STREAM_SIZEOF)
        if (!this.ptr)
            throw Error('wasmbzip2: Out of memory');
        this._view = new DataView(bz.memory.buffer, this.ptr, BZ_STREAM_SIZEOF);
        this.clear();
    }

    get view() {
        if (this._view.buffer !== this.memory.buffer) {
            this._view = new DataView(this.memory.buffer, this.ptr, BZ_STREAM_SIZEOF);
        }
        return this._view;
    }

    clear() {
        (new Uint8Array(this.memory.buffer, this.ptr, BZ_STREAM_SIZEOF)).fill(0);
    }

    free() {
        this.bz.free(this.ptr);
    }

    get next_in() { return this.view.getUint32(BZ_STREAM_NEXT_IN, true); }
    set next_in(v) { this.view.setUint32(BZ_STREAM_NEXT_IN, v, true); }
    get avail_in() { return this.view.getUint32(BZ_STREAM_AVAIL_IN, true); }
    set avail_in(v) { this.view.setUint32(BZ_STREAM_AVAIL_IN, v, true); }
    get total_in() { return this.view.getUint32(BZ_STREAM_TOTAL_IN_LO32, true) + 0x100000000 * this.view.getUint32(BZ_STREAM_TOTAL_IN_HI32, true); }
    get next_out() { return this.view.getUint32(BZ_STREAM_NEXT_OUT, true); }
    set next_out(v) { this.view.setUint32(BZ_STREAM_NEXT_OUT, v, true); }
    get avail_out() { return this.view.getUint32(BZ_STREAM_AVAIL_OUT, true); }
    set avail_out(v) { this.view.setUint32(BZ_STREAM_AVAIL_OUT, v, true); }
    get total_out() { return this.view.getUint32(BZ_STREAM_TOTAL_OUT_LO32, true) + 0x100000000 * this.view.getUint32(BZ_STREAM_TOTAL_OUT_HI32, true); }
};

BZ2._wasmModule = null;
BZ2._RUNNING = 1;
BZ2._FINISHING = 2;
BZ2._FINISHED = 3;
BZ2._DISPOSED = 4;
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
