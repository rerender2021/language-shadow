import { IPackConfig } from "ave-pack";

const config: IPackConfig = {
  build: {
    projectRoot: __dirname,
    target: "node14-win-x64",
    input: "./dist/_/_/app.js",
    output: "./bin/language-shadow.exe",
    // set DEBUG_PKG=1
    debug: false, 
    edit: false
  },
  resource: {
    icon: "./assets/language-shadow.ico",
    productVersion: "0.0.1",
    productName: "Language Shadow",
    fileVersion: "0.0.1",
    companyName: "QberSoft",
    fileDescription: "A simple ocr translator powered by avernakis react.",
    LegalCopyright: `© ${new Date().getFullYear()} QberSoft Copyright.`,
  },
};

export default config;
