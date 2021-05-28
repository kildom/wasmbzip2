
const path = require('path');
const { execFileSync } = require('child_process');

const CC = path.join(__dirname, '../wasi-sdk/bin/clang');
const sysroot = path.join(__dirname, '../wasi-sdk/share/wasi-sysroot');
const cwd = path.join(__dirname, '../build');
const target = 'libbzip2.wasm';
const src = [
    'bzip2/blocksort.c',
    'bzip2/huffman.c',
    'bzip2/crctable.c',
    'bzip2/randtable.c',
    'bzip2/compress.c',
    'bzip2/decompress.c',
    'bzip2/bzlib.c',
    'src/exports.c'
].map(f => path.join(__dirname, '..', f));
const inc = [
    'bzip2'
].map(f => path.join(__dirname, '..', f));

console.log(src);

execFileSync(CC,
    [
        `--sysroot=${sysroot}`,
        '-Wl,--no-entry',
        '-nostartfiles',
        '-Wl,--import-memory',
        `-I${inc}`,
        '-DBZ_NO_STDIO',
        '-flto',
        '-O3',
        '-o',
        target,
        ...src
    ],
    {
        cwd: cwd,
        stdio: 'inherit',
    });
