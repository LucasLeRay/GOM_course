const fs = require("fs");

fs.readFile("data.json", "utf8", (err, data) => {
  if (err) {
    throw new Error("File 'data.json' doesn't exist!");
  }

  let companies = JSON.parse(data).filter(company =>
    /Marseille/i.test(company["Adressedusiège"])
  );
  console.log(companies.length);
});
