const jimp = require("jimp");
const config = require("script/config.json");
const fs = require("fs");

const inputDirectory = config.get("inputDirectory");
const outputDirectory = config.get("outputDirectory");

console.log(inputDirectory);
console.log(outputDirectory);


// fs.readdir(inputDirectory =>(err, files) {
// })
