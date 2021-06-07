/*=================================================================================*/

const url = 'https://github.com/WebAssembly/binaryen/releases/download/version_101/';

const platforms = {
    darwin: 'binaryen-version_101-x86_64-macos.tar.gz',
    linux: 'binaryen-version_101-x86_64-linux.tar.gz',
    win32: 'binaryen-version_101-x86_64-windows.tar.gz'
};

/*=================================================================================*/

const https = require('https');
const { pipeline } = require('stream');
const zlib = require('zlib');
const tar = require('tar');


if (!(process.platform in platforms))
    throw Error('Platform not supported');

const fullUrl = url + platforms[process.platform];

const untar = tar.x({
    strip: 1,
    C: __dirname + '/../binaryen'
});

function download(url) {
    console.log(`Downloading ${url}`);
    https.get(url, function (res) {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            console.log(`Redirected to ${res.headers.location}`);
            return download(res.headers.location);
        }
        pipeline(res, zlib.createGunzip(), untar, (err) => {
            if (err) {
                console.error('An error occurred:', err);
                process.exitCode = 1;
            }
        });
    });
}

download(fullUrl);
