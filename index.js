
const { BZ2 } = require('./dist/libbzip2-dbg');
BZ2.setBinary(require('fs').readFileSync('./dist/libbzip2-dbg.wasm'));
const encoder = new TextEncoder();


async function runit() {

	try {

		const encoder = new TextEncoder();

		BZ2.setBinary(require('fs').readFileSync('./dist/libbzip2-dbg.wasm'));
		let bz2 = await BZ2.create();

		console.log(bz2.version);

		console.log('---', bz2.memory.buffer.byteLength);
		let strm = new BZ2.stream(bz2);

		console.log(Object.keys(bz2));

		let ret = bz2.bzCompressInit(strm.ptr, 9, 0, 0);
		console.log('bzCompressInit', ret);
		console.log('---', bz2.memory.buffer.byteLength);

		let inputData = encoder.encode('Some sample test to compress. Some sample test to compress. Some sample test to compress. ');

		let bufCompressed = bz2.compress(inputData, 1024, 9);
		console.log('bz2.compress');
		console.log(bufCompressed);

		let inptr = bz2.malloc(inputData.length);
		let inbuf = new Uint8Array(bz2.memory.buffer, inptr, inputData.length);
		let outptr = bz2.malloc(1024);
		inbuf.set(inputData);
		strm.next_in = inptr;
		strm.avail_in = inputData.length;
		strm.next_out = outptr;
		strm.avail_out = 1024;

		while (true) {
			ret = bz2.bzCompress(strm.ptr, BZ2.FINISH);
			console.log('bzCompress', ret);
			if (ret < 0) throw new Error(`Compression error ${ret}`);
			if (ret == BZ2.STREAM_END)
				break;
		}

		let compressed = new Uint8Array(bz2.memory.buffer.slice(outptr, outptr + strm.next_out - outptr));
		console.log(compressed);

		ret = bz2.bzCompressEnd(strm.ptr);
		console.log('bzCompressEnd', ret);

		bz2.free(inptr);
		bz2.free(outptr);

		strm.clear();

		ret = bz2.bzDecompressInit(strm.ptr, 0, 0);
		console.log('bzDecompressInit', ret);

		let forDecompress = bufCompressed;

		inptr = bz2.malloc(forDecompress.length);
		inbuf = new Uint8Array(bz2.memory.buffer, inptr, forDecompress.length);
		outptr = bz2.malloc(1024);
		inbuf.set(forDecompress);
		strm.next_in = inptr;
		strm.avail_in = inbuf.length;
		strm.next_out = outptr;
		strm.avail_out = 1024;

		while (true) {
			ret = bz2.bzDecompress(strm.ptr, BZ2.FINISH);
			console.log('bzDecompress', ret);
			if (ret < 0) throw new Error(`Decompression error ${ret}`);
			if (ret == BZ2.STREAM_END)
				break;
		}

		let decompressed = new Uint8Array(bz2.memory.buffer.slice(outptr, outptr + strm.next_out - outptr));
		console.log(decompressed);

		ret = bz2.bzDecompressEnd(strm.ptr);
		console.log('bzDecompressEnd', ret);

		bz2.free(inptr);
		bz2.free(outptr);
		strm.free();

		let final = (new TextDecoder()).decode(decompressed);
		console.log(final);

		console.log('---', bz2.memory.buffer.byteLength);

	} finally {
		setTimeout(() => { }, 5000);
	}

	/*
	
			let bz2 = await BZ2.create(1024 * 1024);
			let str = bz2.stream();
			str.next_in = 1;
			console.log(str.next_in);
			sum = 0;
			for (let i = 0; i < 10000; i++) {
				let ptr = bz2.malloc(32 * 1024);
				if (!ptr) break;
				console.log(i, '       ', ptr, '    ', sum);
				sum += 32 * 1024;
			}*/
	//} catch (ex) {
	//		ex = ex;
	//	}
}

async function compressTest() {
	let bz2 = await BZ2.create();
	let stream = new BZ2.Compress(bz2, 100, 100, 1);
	let input = encoder.encode('bzip2 compresses files using the Burrows-Wheeler block-sorting text compression algorithm, and Huffman coding. Compression is generally considerably better than that achieved by more conventional LZ77/LZ78-based compressors, and approaches the performance of the PPM family of statistical compressors. bzip2 is built on top of libbzip2, a flexible library for handling compressed data in the bzip2 format. This manual describes both how to use the program and how to work with the library interface. Most of the manual is devoted to this library, not the program, which is good news if your interest is only in the program.');
	let offset = 0;
	let len = input.length;
	do {
		if (len == 0) {
			input = null;
		}
		let { bytesRead, bytesWritten, finished } = stream.compress(input, offset, len);
		console.log(bytesRead, bytesWritten, finished);
		if (finished) break;
		offset += bytesWritten;
		len -= bytesWritten;
	} while (true);
	stream.dispose();
}

//runit();
compressTest();

setTimeout(() => { }, 5000);
