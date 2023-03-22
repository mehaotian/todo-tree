class Tree {
  // 单例模式
  static getInstance(data, el) {
    if (!Tree.instance) {
      Tree.instance = new Tree(data, el);
    }
    return Tree.instance;
  }

  constructor() {
    this.nodes = {};
  }

  init(data, el) {
    this.data = this.fileSort(data);
    this.el = el;
    this.render();
    this.observe(this.data);
  }

  // 创建观察数据
  observe(data) {
    if (!data || typeof data !== "object") {
      return;
    }
    Object.keys(data).forEach((key) => {
      this.defineReactive(data, key, data[key]);
    });
  }
  // 观察数据实现
  defineReactive(data, key, val) {
    const self = this;

    Object.defineProperty(data, key, {
      enumerable: true,
      configurable: true,
      get() {
        return val;
      },
      set(newVal) {
        if (newVal === val) {
          return;
        }
        val = newVal;
        self.update(data, key, val);
      },
    });

    this.observe(val);
  }

  // 生成节点
  render() {
    const app = this.el;
    const dom = this.createNode(this.data, 0);
    const is_container = app.querySelector(".container");
    if (is_container) {
      is_container.remove();
    }
    let container = document.createElement("div");
    container.classList.add("container");
    container.appendChild(dom);
    app.appendChild(container);
    loading = false;
    this.mapNodes(app);
  }

  // 创建节点
  createNode(data, index) {
    let elUl = document.createElement("ul");
    elUl.classList.add("list");
    elUl.setAttribute("data-index", index);
    data.forEach((v) => {
      let li = this.createItemNode(v, index);
      elUl.appendChild(li);
    });

    return elUl;
  }

  // 创建列表
  createItemNode(v, index) {
    let li = document.createElement("li");
    li.classList.add("item");
    // let dataId = li.getAttribute("data-id");
    li.setAttribute("data-id", v.id);

    let p = document.createElement("p");
    p.classList.add("title");
    p.style.paddingLeft = `${index * 22}px`;

    if (!v.show) {
      p.setAttribute("data-show", "0");
    } else {
      p.setAttribute("data-show", v.show);
    }
    let arrowIcons = document.createElement("span");
    arrowIcons.classList.add("icons-arrow");
    arrowIcons.classList.add("iconfont");
    arrowIcons.classList.add("icon-you");
    p.appendChild(arrowIcons);
    let icons = document.createElement("i");
    icons.classList.add("icons");
    icons.classList.add("fileiconfont");
    let match = v.fileType;
    switch (match) {
      case "dir":
        if (v.root) {
          switch (v.nature) {
            case "UniApp_Vue":
              icons.classList.add("icon-unp");
              break;
            default:
              icons.classList.add("icon-uniE90F");
          }
        } else {
          icons.classList.add("icon-2");
        }
        break;
      case "file":
        let match$1 = v.fileExt;
        switch (match$1) {
          case "css":
            icons.classList.add("icon-css");
            break;
          case "html":
            icons.classList.add("icon-html");
            break;
          case "js":
            icons.classList.add("icon-js");
            break;
          case "json":
            icons.classList.add("icon-json");
            break;
          case "scss":
            icons.classList.add("icon-scss");
            break;
          case "stylus":
            icons.classList.add("icon-stylus");
            break;
          case "ts":
            icons.classList.add("icon-ts");
            break;
          case "vue":
            icons.classList.add("icon-vue");
            break;
          default:
            icons.classList.add("icon-uniE900");
        }
        break;
      default:
    }
    p.appendChild(icons);
    p.addEventListener("click", function ($$event) {
      let currentEl = $$event.currentTarget;
      let show = currentEl.getAttribute("data-show");
      switch (show) {
        case "0":
          currentEl.setAttribute("data-show", "1");
          v.show = "1";
          break;
        case "1":
          currentEl.setAttribute("data-show", "0");
          v.show = "0";
          break;
        default:
      }
      if (v.fileType === "dir" && !v.root) {
        let show$1 = currentEl.getAttribute("data-show");
        let icons = currentEl.querySelector(".icons");
        if (icons !== undefined) {
          // let icons$1 = Caml_option.valFromOption(icons);
          switch (show$1) {
            case "0":
              icons.classList.remove("icon-3");
              icons.classList.add("icon-2");
              break;
            case "1":
              icons.classList.remove("icon-2");
              icons.classList.add("icon-3");
              break;
            default:
          }
        }
      }
    });

    let text = document.createElement("span");
    text.classList.add("label");
    text.innerHTML = v.name;
    if (v.fileType === "file" && v.mode === "flat") {
      let title = v.id.split("/");
      // 删除最后一个
      title.pop();
      // 删除第一个
      title.shift();
      title = title.join("/");
      if (title) {
        text.innerHTML = `${v.name} <span style="color:#999;margin-left:5px;">(${title})</span>`;
      } else {
        text.innerHTML = v.name;
      }
    }
    p.appendChild(text);
    p.setAttribute("title", v.id);
    li.appendChild(p);

    if (v.mode === "tag") {
      v.children.forEach((items) => {
        const todos = items.todos;
        if (todos && todos.length > 0) {
          let todoDom = this.createTodoDom(todos, items, index + 1);
          li.appendChild(todoDom);
        }
      });
      return li;
    }

    let todos = v.todos;
    if (todos !== undefined) {
      let todoDom = this.createTodoDom(todos, v, index + 1);
      li.appendChild(todoDom);
    }
    let children = v.children;
    if (children !== undefined) {
      let ul = this.createNode(children, index + 1);
      li.appendChild(ul);
    }

    return li;
  }

  // tree  & dom 影射关系
  mapNodes(app) {
    const nodes = app.querySelectorAll("[data-id]");
    this.nodes = [];
    nodes.forEach((node) => {
      const id = node.getAttribute("data-id");
      this.nodes[id] = node;
    });
  }

  // 更新数据
  update(data, key, val) {
    const id = data.id;
    const node = this.nodes[id];
    // 检测node是否存在
    if (!node) return;
    let todoUl = node.querySelector(".list");
    let idx = node.parentNode.getAttribute("data-index");
    // 理论上讲只有todos会变化，才会影响dom
    if (data.todos && data.todos.length) {
      const todoDom = this.createTodoDom(data.todos, data, Number(idx) + 1);
      // todoUl.appendChild(todoDom);
      if (data.mode === "tag") {
        const parentNode = node.parentNode;
        parentNode.replaceChild(todoDom, node);
      } else {
        node.replaceChild(todoDom, todoUl);
      }
    } else {
      if (data.fileType === "dir") return;
      // 如果当前没有兄弟元素，就删除父级元素
      if (node.parentNode.children.length === 1 && data.mode !== "tag") {
        const parentDom = node.parentNode.parentNode;
        const id = parentDom.getAttribute("data-id");
        const ids = id.split("/");
        console.log("ids", ids);
        if (ids.length > 1) {
          // 删除 node 父级的父级元素
          parentDom.remove();
          // node.remove();
        } else if (ids.length === 1) {
          parentDom.remove();
        } else {
          node.remove();
        }
        this.delData(this.data, id);
      } else {
        // 删除 node 父级元素
        node.remove();
        this.delData(this.data, id);
      }
    }
    this.mapNodes(this.el);
  }

  delData(data, id) {
    // 从 data 数组中删除 id 为当前 id 的元素 ，考虑所有层级 children 的情况
    const index = data.findIndex((item) => item.id === id);
    if (index > -1) {
      data.splice(index, 1);
    }
    data.forEach((item) => {
      const children = item.children;
      if (children && children.length > 0) {
        this.delData(children, id);
      }
    });
  }

  // 创建todo元素
  createTodoDom(todos, item, index) {
    let ul = document.createElement("ul");
    ul.classList.add("list");
    ul.getAttribute("data-index", index);
    if (item.mode === "tag") {
      ul.setAttribute("data-id", item.id);
    }
    todos.forEach((v) => {
      let li = this.createTodoItemDom(v, item, index);
      ul.appendChild(li);
    });
    return ul;
  }

  // 创建todo 子元素
  createTodoItemDom(v$1, item, index) {
    let li = document.createElement("li");
    // if (item.mode === "tag") {
    //   li.setAttribute("data-id", v$1.id);
    // }
    li.classList.add("item");
    let p = document.createElement("p");
    p.classList.add("title");
    p.style.paddingLeft = `${index * 22}px`;
    let icons = document.createElement("i");
    icons.classList.add("icons");
    icons.classList.add("iconfont");
    let match = v$1.keyword;
    switch (match) {
      case "BUG":
        icons.classList.add("icon-bug");
        break;
      case "FIXME":
        icons.classList.add("icon-gantanhao");
        break;
      case "HACK":
        icons.classList.add("icon-zhuyi");
        break;
      case "TODO":
        icons.classList.add("icon-daiban");
        break;
      case "XXX":
        icons.classList.add("icon-xiufu");
        break;
      default:
    }
    p.appendChild(icons);
    let tag = document.createElement("span");
    tag.classList.add("tag");
    tag.innerHTML = v$1.keyword;
    p.appendChild(tag);
    let text = document.createElement("span");
    text.classList.add("label");
    text.innerHTML = v$1.description;
    p.appendChild(text);
    p.addEventListener("click", function (param) {
      console.log("todo click", item);
      if (v$1.mode === "tag") {
        item = {
          path: v$1.path,
        };
      }

      hbuilderx.postMessage({
        command: "click",
        todo: v$1,
        data: item,
      });
    });
    li.appendChild(p);
    return li;
  }

  // 数据更新
  updateData(child, treeData) {
    const findData = (data) => {
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        // 如果 oldChildren 存在，说明是tag 获取 flat 模式，他保留目录树结构，处理这个结构表示老数据
        const children = item.children;
        if (item.id === child.id) {
          const nodeId = this.nodes[child.id];
          if (!nodeId) {
            return false;
          }
          item.todos = child.todos;
          return item;
        }
        if (children && children.length > 0) {
          const result = findData(children);
          if (result) {
            return result;
          }
        }
      }
    };
    let result = findData(treeData);
    console.log("是否在数据中：", result);
    // 如果没有找到，就新增数据
    if (!result) {
      const addData = (data) => {
        console.log("data", data);
        for (let i = 0; i < data.length; i++) {
          const item = data[i];
          const children = item.children;
          const arrcIds = item.id.split("/");
          const arrIds = child.id.split("/");
          const cIds = item.id;
          const ids = child.id;
          // console.log('arrcIds',arrcIds);
          // console.log('arrIds',arrIds);
          // console.log('cIds',cIds);
          // console.log('ids',ids);
          const isInclude =
            ids.includes(cIds) && arrcIds.length !== arrIds.length;

          console.log("isInclude", isInclude);
          if (isInclude) {
            let have = addData(children);
            if (!have) {
              // id 等于 ids 包含 cIds 之后的内容，但是不包含最后一个
              const id = arrIds.slice(
                arrIds.indexOf(arrcIds[arrcIds.length - 1]) + 1
              );
              // ，
              let content = child;
              if (item.mode === "flat") {
                child.mode = "flat";
                content = child;
              } else if (item.mode === "tag") {
                child.mode = "tag";
                content = child;
              } else {
                // 如果  id 长度 等于 1 ，直接取值如果 大于1 ，则排除最后一个 ，并用 / 拼接
                if (id.length === 1) {
                  content = child;
                } else {
                  const name = id.slice(0, id.length - 1).join("/");

                  let newObj = {};
                  let childData = objSet(newObj, id, child);
                  let newArr = [];
                  for (let key in childData) {
                    let obj = {
                      id: item.id + "/" + key,
                      path: item.path + "/" + key,
                      name: key,
                      fileType: "dir",
                      children: [],
                    };
                    content = createObj(obj, childData[key]);
                  }
                }
              }

              children.push(content);

              this.defineReactive(children, children.length - 1, content);
              this.fileSort(children);

              // 创建数据
              if (item.mode === "tag") {
                let node = this.nodes[item.id];
                let idx = node.getAttribute("data-index");

                let todoDom = this.createTodoDom(
                  content.todos,
                  content,
                  Number(idx) + 1
                );

                let lis = node.children; // 获取ul元素的所有子元素
                let itemDom = []; // 用于存储一级li元素的数组
                for (let i = 0; i < lis.length; i++) {
                  if (lis[i].nodeName === "UL") {
                    // 判断是否为li元素
                    itemDom.push(lis[i]); // 将li元素添加到数组中
                  }
                }
                let index = children.findIndex((v) => v.id === content.id);
                const itemNode = itemDom[index];
                node.insertBefore(todoDom, itemNode);
              } else {
                let node = this.nodes[item.id];
                const listDom = node.querySelector(".list");
                let idx = listDom.getAttribute("data-index");
                let li = this.createItemNode(content, Number(idx));
                let index = children.findIndex((v) => v.id === content.id);
                // node.querySelector(".list").appendChild(li);
                // const itemDom = listDom.querySelectorAll('.item')

                let lis = listDom.children; // 获取ul元素的所有子元素
                let itemDom = []; // 用于存储一级li元素的数组
                for (let i = 0; i < lis.length; i++) {
                  if (lis[i].nodeName === "LI") {
                    // 判断是否为li元素
                    itemDom.push(lis[i]); // 将li元素添加到数组中
                  }
                }

                const itemNode = itemDom[index];
                listDom.insertBefore(li, itemNode);
              }

              this.mapNodes(this.el);
              // 这里不返回，避免从里到外，返回错误结果
              // return have
            }
            // }
            return true;
          }
        }
      };
      let have = addData(treeData);

      // 没有最外层目录，添加最外层目录
      if (!have) {
        console.log("111111", 111111);
        hbuilderx.postMessage({
          command: "createDir",
          data: {
            path: child.path,
          },
        });
      }
    }
  }

  /**
   * 排序
   * @param {Object} data
   */
  fileSort(data) {
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
}

// 原始数据
let rawdata = [];
// 当前数据
let treeList = [];

/**
 * 目录样式切换，文件夹、标签、文件
 * @param {} e
 */
function treeChange(e, data, app) {
  if (loading) return;
  data = JSON.parse(JSON.stringify(data));
  let currentEl = e.currentTarget;
  let show = currentEl.getAttribute("data-id");
  if (show === "1") {
    currentEl.classList.remove("icon-icon_shiyongwendang");
    currentEl.classList.add("icon-shuzhuangtu");
    currentEl.setAttribute("data-id", "2");
    title.innerText = "待办：按文件显示";
    treeList = flatBuild(data);
    tree.init(treeList, app);
  } else if (show === "2") {
    currentEl.classList.remove("icon-shuzhuangtu");
    currentEl.classList.add("icon-biaoqian");
    currentEl.setAttribute("data-id", "3");
    title.innerText = "待办：按标签显示";
    treeList = tagBuild(data);
    tree.init(treeList, app);
  } else {
    currentEl.classList.remove("icon-biaoqian");
    currentEl.classList.add("icon-icon_shiyongwendang");
    currentEl.setAttribute("data-id", "1");
    title.innerText = "待办：按目录显示";
    treeList = treeBuild(data);
    tree.init(treeList, app);
  }
}

/**
 * 搜索待办
 */
function search(data) {
  if (loading) return;
  hbuilderx.postMessage({
    command: "search",
    data: data,
  });
}

/**
 * 展开/收起树
 */
function unfold(e) {
  if (loading) return;
  let currentEl = e.currentTarget;
  let show = currentEl.getAttribute("all-data-show");
  const nodes = app.querySelectorAll("[data-show]");

  if (show === "0") {
    currentEl.classList.remove("icon-fangkuai");
    currentEl.classList.add("icon-fangkuai-");
    currentEl.setAttribute("all-data-show", "1");
    show = "1";
  } else {
    currentEl.classList.remove("icon-fangkuai-");
    currentEl.classList.add("icon-fangkuai");
    currentEl.setAttribute("all-data-show", "0");
    show = "0";
  }

  nodes.forEach((node) => {
    node.setAttribute("data-show", show);
  });
}

/**
 * 刷新树
 */
function refresh() {
  if (loading) return;
  location.reload();
}

// 节流函数
function throttle(fn, delay) {
  let timer = null;
  return function () {
    let context = this;
    let args = arguments;
    if (!timer) {
      timer = setTimeout(function () {
        fn.apply(context, args);
        timer = null;
      }, delay);
    }
  };
}

// 防抖函数
function debounce(fn, delay) {
  let timer = null;
  return function () {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, arguments);
    }, delay);
  };
}

const tree = Tree.getInstance();

let app = document.querySelector("#app");

let no_data_content = `<div id="" class="">一大批数据正在赶来...<br>如果当前加载提示显示时间过长，可能是扫描的项目过多，且没有正确配置忽略文件夹和文件</div>`;
let loading = false;
if (app !== undefined) {
  let div = document.createElement("div");
  loading = true;
  div.classList.add("tools-box");
  div.innerHTML = `
    <span class="tools-title" id="title">待办：按目录显示</span>
    <div class="tools-btn">
        <i title="切换内容显示模式" class="btn-item iconfont icon-icon_shiyongwendang" data-id="1" id="list"></i>
        <i title="搜索待办" class="btn-item iconfont icon-sousuo" id="search"></i>
        <i title="展开/收起树" all-data-show="0" class="btn-item iconfont icon-fangkuai" id="unfold"></i>
        <i title="刷新" class="btn-item iconfont icon-shuaxin" id="refresh"></i>

    </div>
    `;
  app.appendChild(div);
  let no_more = document.createElement("div");
  no_more.classList.add("no-data");
  no_more.setAttribute("id", "nomore");
  no_more.innerHTML = no_data_content;
  app.appendChild(no_more);
  window.addEventListener("hbuilderxReady", function (param) {
    console.log("init");
    // let treeList = [];
    hbuilderx.onDidReceiveMessage(function (res) {
      let data = res.data;
      console.log("on", data);
      if (res.command === "init") {
        rawdata = data;
        treeList = rawdata;

        if (!treeList || treeList.length === 0) {
          no_more.innerHTML = "没有待办数据";
        } else {
          no_more.style.display = "none";
        }

        const listBtn = document.querySelector("#list");
        const searchBtn = document.querySelector("#search");
        const unfoldBtn = document.querySelector("#unfold");
        const refreshBtn = document.querySelector("#refresh");
        // 注册工具栏事件
        listBtn.addEventListener("click", (e) => treeChange(e, treeList, app));
        searchBtn.addEventListener("click", (e) => search(treeList));
        unfoldBtn.addEventListener("click", unfold);
        refreshBtn.addEventListener("click", debounce(refresh, 1000));

        // 生成树
        tree.init(treeList, app);
      }

      if (res.command === "update") {
        console.log("更新数据", data);
        tree.updateData(data, treeList);
      }

      if (res.command === "create_dir") {
        console.log("创建文件夹", data);
        const listBtn = document.querySelector("#list");
        let modeId = listBtn.getAttribute("data-id");
        let mode = "list";
        switch (modeId) {
          case "1":
            mode = "tree";

            break;
          case "2":
            mode = "flat";
            break;
          case "3":
            mode = "tag";
            break;
        }
        data.mode = mode;
        treeList.push(data);
        tree.defineReactive(treeList, treeList.length - 1, data);
        tree.fileSort(treeList);

        let ul = document.querySelector(".container");
        let dom = ul.querySelector(`ul`);

        let is_li = ul.querySelector(`[data-id="${data.id}"]`);
        let li = tree.createItemNode(data, 0);
        if (is_li) {
          // 替换元素
          dom.replaceChild(li, is_li);
        } else {
          let index = treeList.findIndex((v) => v.id === data.id);
          let lis = dom.children; // 获取ul元素的所有子元素
          let itemDom = []; // 用于存储一级li元素的数组
          for (let i = 0; i < lis.length; i++) {
            if (lis[i].nodeName === "LI") {
              // 判断是否为li元素
              itemDom.push(lis[i]); // 将li元素添加到数组中
            }
          }

          const itemNode = itemDom[index];
          dom.insertBefore(li, itemNode);
        }

        tree.mapNodes(app);
      }
    });
    setTimeout(function (param) {
      hbuilderx.postMessage({
        command: "ready",
      });
    }, 1000);
  });
}

function treeBuild(data) {
  let content = {};
  const createTreeData = (data) => {
    data.forEach((item) => {
      const children = item.children;
      if (item.fileType === "file") {
        const ids = item.id.split("/");
        objSet(content, ids, item);
      }
      if (children && children.length > 0) {
        createTreeData(children);
      }
    });
  };
  createTreeData(data);
  let newData = JSON.parse(JSON.stringify(data));

  let newArr = [];
  for (let key in content) {
    let item = newData.find((v) => v.name === key);
    item.children = [];
    item.mode = "tree";
    let arr = createObj(item, content[key]);
    newArr.push(arr);
  }
  return newArr;
}

function createObj(itemContent, itemObj) {
  for (let key in itemObj) {
    let item = itemObj[key];

    if (item.fileType === "file") {
      item.mode = "tree";
      itemContent.children.push(item);
    } else {
      let obj = {
        id: itemContent.id + "/" + key,
        name: key,
        fileType: "dir",
        path: itemContent.path + "/" + key,
        children: [],
      };
      // let keys = Object.keys(item);
      // if (keys.length === 1) {
      //   const name = keys[0];
      //   let oneObj = item[name];
      //   if (oneObj.fileType !== "file") {
      //     obj.id += "/" + name;
      //     obj.path += "/" + name;
      //     obj.name += "/" + name;
      //     let child = createObj(obj, oneObj);
      //     itemContent.children.push(child);
      //   } else {
      //   }
      // } else {
      //   let child = createObj(obj, item);
      //   itemContent.children.push(child);
      // }
      let child = createObj(obj, item);
      itemContent.children.push(child);
    }
  }
  return itemContent;
}

function flatBuild(data) {
  let arr = [];
  const flat = (data) => {
    let files = [];
    data.forEach((item) => {
      const children = item.children;
      if (children && children.length > 0) {
        let fileArr = flat(children);
        files.push(...fileArr);
      } else {
        item.mode = "flat";
        files.push(item);
      }
    });
    return files;
  };
  data.forEach((item) => {
    const children = item.children;
    let files = flat(children);
    item.children = files;
    item.mode = "flat";
    arr.push(item);
  });
  return arr;
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
    // let newTodos = [];
    // files.forEach((v) => {
    //   const todos = v.todos;
    //   todos.map((a) => {
    //     a.path = v.path;
    //     a.mode = "tag";
    //     return a;
    //   });
    //   newTodos.push(...todos);
    // });
    item.mode = "tag";
    // item.todos = newTodos;
    // item.oldChildren = [...item.children];
    item.children = files;
    arr.push(item);
  });
  return arr;
}

/**
 * 对象中设置值
 * @param {Object|Array} object 源数据
 * @param {String| Array} path 'a.b.c' 或 ['a',0,'b','c']
 * @param {String} value 需要设置的值
 */
function objSet(object, path, value) {
  if (typeof object !== "object") return object;
  _basePath(path).reduce((o, k, i, _) => {
    if (i === _.length - 1) {
      // 若遍历结束直接赋值
      o[k] = value;
      return null;
    } else if (k in o) {
      // 若存在对应路径，则返回找到的对象，进行下一次遍历
      return o[k];
    } else {
      // 若不存在对应路径，则创建对应对象，若下一路径是数字，新对象赋值为空数组，否则赋值为空对象
      o[k] = /^[0-9]{1,}$/.test(_[i + 1]) ? [] : {};
      return o[k];
    }
  }, object);
  // 返回object
  return object;
}

// 处理 path， path有三种形式：'a[0].b.c'、'a.0.b.c' 和 ['a','0','b','c']，需要统一处理成数组，便于后续使用
function _basePath(path) {
  // 若是数组，则直接返回
  if (Array.isArray(path)) return path;
  // 若有 '[',']'，则替换成将 '[' 替换成 '.',去掉 ']'
  return path.replace(/\[/g, ".").replace(/\]/g, "").split(".");
}
