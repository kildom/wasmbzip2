
let CC = '../wasi-sdk/bin/clang';
let sysroot = '../wasi-sdk/share/wasi-sysroot';
let cwd = '../build';
let targets = {
    //nostdio: 'libbzip2',
    //nostdio_d: 'libbzip2-d',
    //cmp: 'libbzip2-cmp',
    dec: 'libbzip2-dec',
    //stdio: 'libbzip2-stdio',
    //stdio_d: 'libbzip2-stdio-d',
}
let src = [
    '../bzip2/huffman.c',
    '../bzip2/crctable.c',
    '../bzip2/randtable.c',
    '../bzip2/bzlib.c',
    '../src/exports.c',
];
let srcv = {
    nostdio: ['../bzip2/blocksort.c', '../bzip2/compress.c', '../bzip2/decompress.c'],
    nostdio_d: ['../bzip2/blocksort.c', '../bzip2/compress.c', '../bzip2/decompress.c'],
    cmp: ['../bzip2/blocksort.c', '../bzip2/compress.c'],
    dec: ['../bzip2/decompress.c'],
    stdio: ['../bzip2/blocksort.c', '../bzip2/compress.c', '../bzip2/decompress.c'],
    stdio_d: ['../bzip2/blocksort.c', '../bzip2/compress.c', '../bzip2/decompress.c'],
};
let flags = [
    '-Wl,--no-entry',
    '-nostartfiles',
    '-Wl,--import-memory',
];
let flagsv = {
    nostdio: ['-flto', '-O3', '-g0', '-DBZ_NO_STDIO'],
    nostdio_d: ['-O0', '-g', '-DBZ_NO_STDIO'],
    cmp: ['-flto', '-O3', '-g0', '-DBZ_NO_STDIO', '-DNO_DECOMPRESS'],
    dec: ['-flto', '-O3', '-g0', '-DBZ_NO_STDIO', '-DNO_COMPRESS'],
    stdio: ['-flto', '-O3', '-g0'],
    stdio_d: ['-O0', '-g'],
}
let includes = [
    '../bzip2',
];
let template = '../src/libbzip2.tmpl.js';

/*===========================================================================*/

const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

function compile(variant) {

    console.log(`Compiling ${targets[variant]}...`);

    execFileSync(CC,
        [
            `--sysroot=${sysroot}`,
            ...flags,
            ...flagsv[variant],
            ...includes,
            '-o',
            `${targets[variant]}.wasm`,
            ...src,
            ...srcv[variant],
        ],
        {
            cwd: cwd,
            stdio: 'inherit',
        });

    execFileSync(CC,
        [
            '-E', '-x', 'c', '-Wno-unused-command-line-argument',
            ...flags,
            ...flagsv[variant],
            ...includes,
            '-o',
            `${targets[variant]}.js`,
            template,
        ],
        {
            cwd: cwd,
            stdio: 'inherit',
        });

    let js = fs.readFileSync(`${targets[variant]}.js`, 'utf-8');
    js = js.replace(/^\s*#.*?\r?\n/gm, '');
    js = js.replace(/__BEGIN_SOURCE_REMOVAL__[\S\s]*__END_SOURCE_REMOVAL__/g, '');
    let wasm = fs.readFileSync(`${targets[variant]}.wasm`);
    js = js.replace('__WASM_BASE64_GOES_HERE__', JSON.stringify(wasm.toString('base64')));
    js = js.replace('__WASM_ARRAY_GOES_HERE__', JSON.stringify(Array.from(wasm)));
    js = js.replace('__WASM_BINSTR_GOES_HERE__', JSON.stringify(wasm.toString('binary')).replace(/\\u00/g, '\\x'));
    fs.writeFileSync(`${targets[variant]}.js`, js);
}

CC = path.join(__dirname, CC);
sysroot = path.join(__dirname, sysroot);
cwd = path.join(__dirname, cwd);
template = path.join(__dirname, template);
src = src.map(f => path.join(__dirname, f));
includes = includes.map(f => '-I' + path.join(__dirname, f));

for (let variant in targets) {
    srcv[variant] = srcv[variant].map(f => path.join(__dirname, f));
    targets[variant] = path.join(cwd, targets[variant]);
    try {
        compile(variant);
    } catch (ex) {
        console.log(`Compilation failed!`);
        throw ex;
        break;
    }
}

