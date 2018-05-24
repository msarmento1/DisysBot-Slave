const fs = require('fs');
const mkdirp = require('mkdirp');
const rimraf = require('rimraf');

const tmpDir = `${__dirname}/../tmp/`;

const getCWD = (id) => {
  return `${tmpDir}/${id}/`;
};

module.exports.getCWD = getCWD;

module.exports.clean = () => {
  // fs.readdir(tmpDir, function (err, files) {
  //   if (err) {
  //     throw err
  //   } else {
  //     for (const file of files) {
  //       fs.unlink(path.join(tmpDir, file), err => {
  //         if (err) {
  //           console.log(err)
  //         }
  //       })
  //     }
  //   }
  // })
};

module.exports.create = (id, fileName, data) => {
  return new Promise((resolve, reject) => {
    mkdirp(getCWD(id), (e) => {
      if (e) {
        reject(e);
      }

      fs.writeFile(getCWD(id) + fileName, data, (e2) => {
        if (e2) {
          reject(e2);
        } else {
          resolve();
        }
      });
    });
  });
};

module.exports.delete = (id) => {
  rimraf(getCWD(id), () => { });
};
