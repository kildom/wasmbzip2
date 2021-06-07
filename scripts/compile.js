
let CC = '../wasi-sdk/bin/clang';
let WASM_OPT = '../binaryen/bin/wasm-opt';
let sysroot = '../wasi-sdk/share/wasi-sysroot';
let cwd = '../dist';
let targets = {
    nostdio: 'libbzip2',
    nostdio_d: 'libbzip2-dbg',
    cmp: 'libbzip2-cmp',
    dec: 'libbzip2-dec',
    stdio: 'libbzip2-stdio',
    stdio_d: 'libbzip2-stdio-dbg',
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
    nostdio: ['-flto', '-Oz', '-g0', '-DBZ_NO_STDIO'],
    nostdio_d: ['-O0', '-g', '-DBZ_NO_STDIO'],
    cmp: ['-flto', '-Oz', '-g0', '-DBZ_NO_STDIO', '-DNO_DECOMPRESS'],
    dec: ['-flto', '-Oz', '-g0', '-DBZ_NO_STDIO', '-DNO_COMPRESS'],
    stdio: ['-flto', '-Oz', '-g0'],
    stdio_d: ['-O0', '-g'],
}
let includes = [
    '../bzip2',
    '../src',
];
let template = '../src/libbzip2.tmpl.js';

/*===========================================================================*/

const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

function preprocessJs(variant, src, dst, jsFlags) {
    execFileSync(CC,
        [
            `--sysroot=${sysroot}`,
            '-E', '-Wno-unused-command-line-argument',
            ...flags,
            ...flagsv[variant],
            ...jsFlags,
            ...includes,
            '-o',
            dst,
            '-x', 'c',
            src,
        ],
        {
            cwd: cwd,
            stdio: 'inherit',
        });


    let wasm = fs.readFileSync(`${targets[variant]}.wasm`);
    js = fs.readFileSync(dst, 'utf-8')
        .replace(/\r?\n/g, '\n')
        .replace(/^\s*#.*?\r?\n/gm, '')
        .replace(/--save-comment--([\S\s]*?)--end-of-comment--/g, (_, m) => `/*${Buffer.from(m, 'hex').toString('utf-8')}*/`)
        .replace(/__BEGIN_INCLUDES__[\S\s]*__END_INCLUDES__/g, '')
        .replace('__WASM_BASE64_GOES_HERE__', '`' + (wasm.toString('base64') + '`').replace(/(.{1,120})/g, '\n$1'))
        .replace('__WASM_ARRAY_GOES_HERE__', JSON.stringify(Array.from(wasm)))
        .replace('__WASM_BINSTR_GOES_HERE__', JSON.stringify(wasm.toString('binary')).replace(/\\u00/g, '\\x'))
        .replace(/^\n+/gm, '');
    fs.writeFileSync(dst, js);
}

function compile(variant) {

    console.log(`Compiling ${targets[variant]}...`);

    let wasmOpt = ([...flags, ...flagsv[variant]].indexOf('-O0') < 0);

    execFileSync(CC,
        [
            `--sysroot=${sysroot}`,
            ...flags,
            ...flagsv[variant],
            ...includes,
            '-o',
            wasmOpt ? `${targets[variant]}-no-opt.wasm` : `${targets[variant]}.wasm`,
            ...src,
            ...srcv[variant],
        ],
        {
            cwd: cwd,
            stdio: 'inherit',
        });

    if (wasmOpt) {
        execFileSync(WASM_OPT,
            [
                `-Oz`,
                '-o',
                `${targets[variant]}.wasm`,
                `${targets[variant]}-no-opt.wasm`,
            ],
            {
                cwd: cwd,
                stdio: 'inherit',
            });
        fs.unlinkSync(`${targets[variant]}-no-opt.wasm`);
    }

    let js = fs.readFileSync(template, 'utf-8')
        .replace(/^\s*\/\/#/gm, '#')
        .replace(/\/\*([\S\s]*?)\*\//g, (_, m) => `--save-comment--${Buffer.from(m).toString('hex')}--end-of-comment--`);
    fs.writeFileSync(`${targets[variant]}.tmp`, js);

    preprocessJs(variant, `${targets[variant]}.tmp`, `${targets[variant]}.js`, []);
    preprocessJs(variant, `${targets[variant]}.tmp`, `${targets[variant]}-emb.js`, ['-DEMBED_WASM']);

    fs.unlinkSync(`${targets[variant]}.tmp`);
}

CC = path.join(__dirname, CC);
WASM_OPT = path.join(__dirname, WASM_OPT);
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

