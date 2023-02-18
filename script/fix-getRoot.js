const fs = require("fs");
const path = require("path");

const appJsPath = path.resolve(__dirname, "../dist/_/_/app.js");
const appJsContent = fs.readFileSync(appJsPath, "utf-8");
const fixedJsContent = appJsContent.replace("exports.getRoot = function getRoot(file) {", "exports.getRoot = function getRoot(file) { return __dirname;");
fs.writeFileSync(appJsPath, fixedJsContent);