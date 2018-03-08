const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');

const tmpDir = __dirname + '/../tmp/';

module.exports.clean = function () {
  //fs.readdir(tmpDir, function (err, files) {
  //  if (err) {
  //    throw err
  //  } else {
  //    for (const file of files) {
  //      fs.unlink(path.join(tmpDir, file), err => {
  //        if (err) {
  //          console.log(err)
  //        }
  //      })
  //    }
  //  }
  //})
}

module.exports.create = function (id, fileName, data) {
  return new Promise(function (resolve, reject) {
    mkdirp(tmpDir + '/' + id, function (err) {
      if (err) {
        reject(err)
      }

      fs.writeFile(tmpDir + '/' + id + '/' + fileName, data, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    })
  });
}

module.exports.getCWD = function (id) {
  return tmpDir + '/' + id + '/'
}