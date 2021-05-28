
const { BZ2 } = require('./build/libbzip2-dec');

async function runit() {
//	try {

		let bz2 = await BZ2.create(1024 * 1024);
		sum = 0;
		for (let i = 0; i < 10000; i++) {
			let ptr = bz2.bzAlloc(32 * 1024);
			if (!ptr) break;
			console.log(i, '       ', ptr, '    ', sum);
			sum += 32 * 1024;
		}
	//} catch (ex) {
//		ex = ex;
//	}
}

runit();

