
const { BZ2 } = require('./build/libbzip2');

async function runit() {
//	try {

	const encoder = new TextEncoder();

	let bz2 = await BZ2.create();
	let strm = bz2.createStream();

	console.log(Object.keys(bz2));

	let ret = bz2.bzCompressInit(strm.ptr, 9, 0, 0);
	console.log('bzCompressInit', ret);

	let inputData = encoder.encode('Some sample test to compress. Some sample test to compress. Some sample test to compress. ');
	let inptr = bz2.bzAlloc(inputData.length);
	let inbuf = new Uint8Array(bz2.memory.buffer, inptr, inputData.length);
	let outptr = bz2.bzAlloc(1024);
	inbuf.set(inputData);
	strm.refresh();
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
	
	strm.refresh();
	let compressed = new Uint8Array(bz2.memory.buffer.slice(outptr, outptr + strm.next_out - outptr));
	console.log(compressed);

	ret = bz2.bzCompressEnd(strm.ptr);
	console.log('bzCompressEnd', ret);

	bz2.bzFree(inptr);
	bz2.bzFree(outptr);

	strm.clear();

	ret = bz2.bzDecompressInit(strm.ptr, 0, 0);
	console.log('bzDecompressInit', ret);

	inptr = bz2.bzAlloc(compressed.length);
	inbuf = new Uint8Array(bz2.memory.buffer, inptr, compressed.length);
	outptr = bz2.bzAlloc(1024);
	inbuf.set(compressed);
	strm.refresh();
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
	
	strm.refresh();
	let decompressed = new Uint8Array(bz2.memory.buffer.slice(outptr, outptr + strm.next_out - outptr));
	console.log(decompressed);

	ret = bz2.bzDecompressEnd(strm.ptr);
	console.log('bzDecompressEnd', ret);

	bz2.bzFree(inptr);
	bz2.bzFree(outptr);
	strm.free();

	let final = (new TextDecoder()).decode(decompressed);
	console.log(final);

/*

		let bz2 = await BZ2.create(1024 * 1024);
		let str = bz2.stream();
		str.next_in = 1;
		console.log(str.next_in);
		sum = 0;
		for (let i = 0; i < 10000; i++) {
			let ptr = bz2.bzAlloc(32 * 1024);
			if (!ptr) break;
			console.log(i, '       ', ptr, '    ', sum);
			sum += 32 * 1024;
		}*/
	//} catch (ex) {
//		ex = ex;
//	}
}

runit();
