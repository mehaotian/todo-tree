const color = require("./color.js");

let cssData = "<style>\n:root{\n";
let colorData = color();

for (let i in colorData) {
	cssData += "--" + i + ":" + colorData[i] + ";\n";
}
cssData += '</style>'
module.exports = {
	cssData
};
