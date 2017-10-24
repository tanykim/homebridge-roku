const fs = jest.genMockFromModule('fs');

let READ_FILE = {};

function __setReadFile(readFile) {
  READ_FILE = readFile;
}

function readFileSync(fname) {
  return READ_FILE;
}

let WRITTEN_FILE = null;

function __getWrittenFile() {
  return WRITTEN_FILE;
}

function writeFileSync(file) {
  WRITTEN_FILE = file;
}

fs.readFileSync = readFileSync;
fs.writeFileSync = writeFileSync;
fs.__setReadFile = __setReadFile;
fs.__getWrittenFile = __getWrittenFile;

module.exports = fs;
