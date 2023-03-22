const hx = require("hbuilderx");
const path = require("path");
const fs = require("fs");
const readline = require("readline");
const plugin = require("./plugin");
let isDev = true;

// 获取项目管理器下的所有项目
const getFolders = async () => {
  return await hx.workspace.getWorkspaceFolders();
};

// 匹配关键字
const keywords = ["TODO", "FIXME", "BUG", "HACK", "XXX"]; // 要匹配的关键字
const regex = new RegExp(`(${keywords.join("|")})\\s*(.*)`); // 匹配的正则表达式
// 忽略文件目录
const ignore = ["dist", "unpackage", "node_modules", "build", "lib"];
// 允许文件类型
const fileWhitelist = [
  "vue",
  "nvue",
  "js",
  "wxs",
  "ts",
  "html",
  "css",
  "scss",
  "less",
  "md",
  "json",
];

/**
 * 扫描文件，标识关键字
 */
function scanFile(filePath, id) {
  const results = [];
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  });
  const name = path.basename(filePath);
  const fileData = {
    id: id + "/" + name,
    path: filePath,
    name: path.basename(filePath),
    fileExt: path.extname(filePath).substring(1),
    fileType: "file",
    todos: [],
  };

  // 忽略文件
  if (!fileWhitelist.includes(fileData.fileExt)) {
    return new Promise((reolve, reject) => {
      reolve(fileData);
    });
  }

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

  return new Promise((reolve, reject) => {
    rl.on("close", () => {
      fileData.todos = results;
      reolve(fileData);
    });
  });
}

/**
 * 获取项目下所有目录并生成tree
 * @param {Object} directoryPath
 */
async function generateTree(dirPath, id) {
  let tree = {
    id: id || path.basename(dirPath),
    path: dirPath,
    name: path.basename(dirPath),
    children: [],
  };

  // 忽略文件目录
  if (ignore.includes(tree.name)) {
    return tree;
  }

  const reg = /\..+/;
  if (reg.test(tree.name)) {
    return tree;
  }

  const items = fs.readdirSync(dirPath);
  for (let i = 0; i < items.length; i++) {
    let itemPath = path.join(dirPath, items[i]);
    itemPath = itemPath.split(path.sep).join("/");
    const itemStats = fs.statSync(itemPath);
    if (itemStats.isDirectory()) {
      const name = path.basename(itemPath);
      let item = {
        id: tree.id + "/" + name,
        path: itemPath,
        name: name,
        fileType: "dir",
      };
      let dirData = await generateTree(itemPath, item.id);
      if (dirData && dirData.children.length > 0) {
        const children = dirData.children;
        // 处理目录下只有一个文件的情况
        // if (children.length === 1) {
        // 	let child = children[0]
        // 	if (child.fileType === 'dir') {
        // 		item = child
        // 		item.name = dirData.name + '/' + child.name
        // 	} else {
        // 		item.children = dirData.children
        // 	}
        // 	tree.children.push(item);
        // } else {
        // 	item.children = dirData.children
        // 	tree.children.push(item);
        // }
        // 不处理一层的问题
        item.children = dirData.children;
        tree.children.push(item);
      }
    } else {
      let fileData = await scanFile(itemPath, tree.id);
      // fileData = fileSort(fileData)
      if (fileData.todos.length > 0) {
        tree.children.push(fileData);
      }
    }
  }

  tree.children = fileSort(tree.children);
  return tree;
}

/**
 * 排序
 * @param {Object} data
 */
function fileSort(data) {
  data.sort((a, b) => {
    // 根据 fileType 字段进行排序，dir 在上，file 在下
    if (a.fileType === "dir" && b.fileType === "file") {
      return -1; // a 在 b 之前
    } else if (a.fileType === "file" && b.fileType === "dir") {
      return 1; // a 在 b 之后
    } else {
      // fileType 相同，根据 name 字段进行排序
      if (a.name < b.name) {
        return -1; // a 在 b 之前
      } else if (a.name > b.name) {
        return 1; // a 在 b 之后
      } else {
        return 0; // a 和 b 相等
      }
    }
  });
  return data;
}

/**
 * @description 显示webview
 */
async function showWebView(webview) {
  // 使用测试和开发环境
  // 使用 webview.asWebviewUri 生成可以在 webview 中执行的路径
  let src = `<script src="${path.join(__dirname, "main.js")}"></script>`;
  let link = `<link rel="stylesheet" type="text/css" href="${path.join(
    __dirname,
    "style/index.css"
  )}"></script>`;
  let icons = `<link rel="stylesheet" type="text/css" href="${path.join(
    __dirname,
    "style/icons.css"
  )}"></script>`;
  let icons2 = `<link rel="stylesheet" type="text/css" href="${path.join(
    __dirname,
    "style/iconfont.css"
  )}"></script>`;
  if (isDev) {
    src = '<script src="http://127.0.0.1:5173/src/main.js"></script>';
    link = `<link rel="stylesheet" type="text/css" href="http://127.0.0.1:5173/src/style/index.css"></script>`;
    icons = `<link rel="stylesheet" type="text/css" href="http://127.0.0.1:5173/src/style/icons.css"></script>`;
    icons2 = `<link rel="stylesheet" type="text/css" href="http://127.0.0.1:5173/src/style/iconfont.css"></script>`;
  }
  webview.html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
	${link}${icons}${icons2}${plugin.cssData}
  </head>
  <body>
  	<div id="app"></div>${src}
  </body>
</html>`;

  webview.onDidReceiveMessage(async (msg) => {
    console.log("触发", msg);
    if (msg.command === "ready") {
      const flolders = await getFolders();
      let arr = [];
      for (let key = 0; key < flolders.length; key++) {
        const fold = flolders[key];
        let uri = fold.uri.fsPath;
        // 路径转换
        uri = uri.split(path.sep).join("/");
        let tree = await generateTree(uri);
        // 文件有内容才会插入
        if (tree.children && tree.children.length > 0) {
          Object.assign(tree, fold, {
            root: true,
            fileType: "dir",
            id: tree.name,
          });
          arr.push(tree);
        }
      }
      webview.postMessage({
        command: "init",
        data: arr,
      });
    }

    if (msg.command === "click") {
      openDocument(msg);
    }

    if (msg.command === "search") {
      openSearch(msg);
    }
  });

  let onDidSaveTextDocumentEventDispose = hx.workspace.onDidSaveTextDocument(
    async (document) => {
      let fsPath = document.uri.fsPath;
      fsPath = fsPath.split(path.sep).join("/");
      const isDirty = document.isDirty; // 是否是修改状态
      const isUntitled = document.isUntitled; // 是否是无标题文
      const fileExt = path.extname(fsPath).substring(1);
      // 保存的文件必须在已经存在，不在编辑中，并且文件类型在白名单中
      if (!isDirty && !isUntitled && fileWhitelist.includes(fileExt)) {
        let folderPath = document.workspaceFolder.uri.path;
        folderPath = folderPath.split(path.sep).join("/");
        if (folderPath.startsWith("/")) {
          folderPath = folderPath.substring(1);
        }
        const id = path.relative(
          path.dirname(folderPath),
          path.join(fsPath, "..")
        );
        let fileTodos = await scanFile(fsPath, id);
        webview.postMessage({
          command: "update",
          data: fileTodos,
        });
      }
      //do something with document.
    }
  );
}

/**
 * 打开文档
 * @param {Object} event
 */
function openDocument(event) {
  const { todo, data } = event;
  var documentPromise = hx.workspace.openTextDocument(data.path);
  documentPromise
    .then(() => {
      let activeEditor = hx.window.getActiveTextEditor();
      activeEditor
        .then((editor) => {
          // HACK 不确定这了 -1 是否正确，因为跳转总是会少一行
          editor.gotoLine(todo.lineNumber - 1);
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((err) => {
      console.log(err);
    });
}

/**
 * 搜索todo
 * @param {Object} event
 */
function openSearch(event) {
  const { data } = event;
  let list = tagBuild(data);
  const pickResult = hx.window.showQuickPick(list, {
    placeHolder: "请输入内容",
  });

  pickResult
    .then(function (result) {
      if (!result) {
        return;
      }
      openDocument({ todo: result, data: { path: result.path } });
      let backPath = result.backPath;
    })
    .catch((err) => {
      console.log(err);
    });
}

function tagBuild(data) {
  let arr = [];
  const flat = (data) => {
    let files = [];
    data.forEach((item) => {
      const children = item.children;
      if (children && children.length > 0) {
        let fileArr = flat(children);
        files.push(...fileArr);
      } else {
        item.mode = "tag";
        files.push(item);
      }
    });
    return files;
  };
  data.forEach((item) => {
    const children = item.children;
    let files = flat(children);
    let newTodos = [];
    files.forEach((v) => {
      const todos = v.todos;
      todos.map((a) => {
        a.path = v.path;
        a.mode = "tag";
        a.label = `[${a.keyword}] ${a.description}`;
        a.description = v.id;
        return a;
      });
      newTodos.push(...todos);
    });
    arr.push(...newTodos);
  });
  return arr;
}

/**
 * 插件激活
 */
function activate() {
  let webviewPanel = hx.window.createWebView("extensions.treeview", {
    enableScripts: true,
  });
  showWebView(webviewPanel.webView);
}

module.exports = {
  activate,
};
