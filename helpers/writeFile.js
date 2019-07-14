const fs = require("fs");

function writeFile(file, content) {
  fs.access(file, err => {
    if (!err) {
      fs.readFile(file, "utf8", (err, data) => {
        if (err) {
          console.log(err);
        } else {
          let obj = Array.isArray(JSON.parse(data))
            ? JSON.parse(data)
            : [JSON.parse(data)];
          obj = [...JSON.parse(data), content];
          json = JSON.stringify(obj);
          fs.writeFile(file, json, "utf8", err => {
            if (err) return console.log(err);
          });
        }
      });
    } else {
      fs.writeFile(file, JSON.stringify([content]), "utf8", err => {
        if (err) return console.log(err);
      });
    }
  });
}

module.exports = writeFile;
