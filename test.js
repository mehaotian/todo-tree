const fs = require("fs");

const filePath = "./test-files/index.vue"; // 替换为实际文件路径
const keywords = ["TODO", "FIXME"]; // 匹配的关键字
const regex = new RegExp(`(${keywords.join("|")})\\s*(.*)`); // 匹配的正则表达式

const results = [];

// 创建文件流
const readStream = fs.createReadStream(filePath);
const rl = require("readline").createInterface({
  input: readStream,
  crlfDelay: Infinity,
});

let lineNumber = 0;
let inMultilineComment = false;
let inBlockComment = false;

rl.on("line", (line) => {
  lineNumber++;

  // 匹配单行注释
  const singleLineMatch = line.match(/^\s*\/\/(.*)/);
  if (singleLineMatch) {
    const match = singleLineMatch[1].match(regex);

    if (match) {
      const [_, keyword, text] = match;
      results.push({
        lineNumber,
        keyword: keyword,
        description: text.trim(),
      });
    }
    return;
  }

  // 匹配多行注释开始
  const startMultilineMatch = line.match(/^\s*\/\*\*(.*)/);
  if (startMultilineMatch) {
    inMultilineComment = true;
    const match = startMultilineMatch[1].match(regex);
    if (match) {
      const [_, keyword, text] = match;
      results.push({
        lineNumber,
        keyword: keyword,
        description: text.trim(),
      });
    }
    return;
  }

  // 匹配多行注释结束
  if (inMultilineComment) {
    const endMultilineMatch = line.match(/\*\//);
    if (endMultilineMatch) {
      inMultilineComment = false;
    }
    const match = line.match(regex);
    if (match) {
      const [_, keyword, text] = match;
      results.push({
        lineNumber,
        keyword: keyword,
        description: text.trim(),
      });
    }
    return;
  }

  // 匹配块注释开始
  const startBlockMatch = line.match(/^\s*\/\*(.*)/);
  if (startBlockMatch) {
    inBlockComment = true;
    const match = startBlockMatch[1].match(regex);
    if (match) {
      const [_, keyword, text] = match;
      results.push({
        lineNumber,
        keyword: keyword,
        description: text.replace("*/", "").trim(),
      });
    }
    return;
  }

  // 匹配块注释结束
  if (inBlockComment) {
    const endBlockMatch = line.match(/\*\//);
    if (endBlockMatch) {
      inBlockComment = false;
    }
    const match = line.match(regex);
    if (match) {
      const [_, keyword, text] = match;

      results.push({
        lineNumber,
        keyword: keyword,
        description: text.trim(),
      });
    }
    return;
  }

  // 匹配 HTML 注释
  const htmlMatch = line.match(/<!--(.*)-->/);
  if (htmlMatch) {
    const match = htmlMatch[1].match(regex);
    if (match) {
      const [_, keyword, text] = match;

      results.push({
        lineNumber,
        keyword: keyword,
        description: text.trim(),
      });
    }
    return;
  }
});

rl.on("close", () => {
  console.log(results);
});
