var listname, starlists, donelist, starlistscount, donecount,prev;
var list = {
    starlists: [],
    githubstarlists: [],
};
var searchlist = {
    starlists: [],
    githubstarlists: [],
};
var taburl;

var staredlist =  [];
var githubLists =  [];
var repoStared;
var starTagName;

//这里主要是为了与background建立连接，当页面关闭的时候连接就会断开，此时background中你注册的连接关闭函数此时会执行，因为background环境一直存在，除非你关闭了电脑
var port = chrome.runtime.connect();
var bg = chrome.extension.getBackgroundPage();
init();

var searchinput

function init() {
    searchinput = document.querySelector("#search-input");
    listname = document.querySelector("#listname");
    starlists = document.querySelector("#starlists");
    starlistscount = document.querySelector("#starlistscount");

    //修改显示input
    starlists.addEventListener("dblclick", dblclickHandler);
    //input失焦处理
    starlists.addEventListener("focusout", blurHandler);
    // 输入文本内容后，敲回车
    listname.addEventListener("keyup", keyHandler);
    //修改checkbox
    starlists.addEventListener("change", changeHandler);
    searchinput.addEventListener("keyup", updateList);
    searchinput.addEventListener("search", updateList);


    var userName = localStorage.userName;
    if(userName===undefined || userName===""){
        window.location.href = "options.html";
        // window.location.reload();
    }

    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://github.com/"+userName+"?tab=stars", true);
    xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
        var resp = xhr.responseText;
        var parser = new DOMParser();
        
        var doc = parser.parseFromString(resp, 'text/html');
        doc.querySelectorAll('.Box a').forEach(item => {
            const h3 = item.querySelector('.flex-row h3')
            const textSmall = item.querySelector('.flex-row .text-small')
            if(h3){
                console.log(h3.textContent, textSmall)
                githubLists.push(h3.textContent);
            }
        });
        bg.repoStars.repo = "";
        bg.repoStars.tag = [];
        bg.repoStars.deltag = [];
        chrome.tabs.getSelected(null, function (tab) { // 先获取当前页面的tabID
            taburl = tab.url;
            bg.repoStars.repo = tab.url;
            // repoStared = JSON.parse(localStorage.getItem(tab.url));
            // bg.repoStars.tag = repoStared?repoStared.tag : [];
            // alert(tab.title);
            // alert(tab.url);
        
            // 初始化渲染（长期保存）
            const listnamekey = userName+"list"
            if (localStorage.list) {
                // 将localStorage.list转换为对象并覆盖原来的list
                list = JSON.parse(localStorage.list);
            }
            if(githubLists && githubLists.length > 0){
                list.githubstarlists = githubLists
            }
            if(list){
                renderList();
            }
        });
    }
    }
    xhr.send();
    
}

function updateList() {

    // 获取输入框中的值，并根据该值动态更新列表内容
    var searchValue = searchinput.value;
    if (searchValue.length > 0) {
        list.starlists.forEach(item => {
            if(item.indexOf(searchValue)!=-1 && !searchlist.starlists.includes(item)){
                searchlist.starlists.push(item)
            }
        })
        list.githubstarlists.forEach(item => {
            if(item.indexOf(searchValue)!=-1 && !searchlist.githubstarlists.includes(item)){
                searchlist.githubstarlists.push(item)
            }
        })
        renderSearch();
    } else {
        renderList();
    }
    
  }

function keyHandler(e) {
    // listname.value.trim().length===0 输入框内容为空
    // 如果按下的键不是Enter，或者输入框内容为空时，跳出
    if (e.keyCode !== 13 || listname.value.trim().length === 0) return;
    // 将输入框中的内容放入 starlists
    if(list.starlists.includes(listname.value)){
        alert("The list alredy exists")
    }else{
        list.starlists.push(listname.value);    
    }
    
    // 将输入框清空
    listname.value = "";
    // 渲染
    renderList();
}


// 失焦
function blurHandler(e) {
    if (e.target.nodeName == "INPUT" && e.target.type == "text") {
        var index = Array.from(starlists.children).indexOf(
            // e.target-->input
            // e.target.parentElement.parentElement-->li
            e.target.parentElement.parentElement
        );
        var old = list.starlists[index]
        
        list.starlists[index] = e.target.value;
        renderList();
    }
    if (e.target.nodeName == "INPUT" && e.target.type == "checkbox") changeHandler(e);
    
}

// 双击
function dblclickHandler(e) {
    if (e.target.nodeName !== "P") return;
    // input赋值为新的显示的输入框
    var input=e.target.firstElementChild;
    if(prev){
        prev.style.display="none";
    }
    prev=input;
    // 双击的输入框显示，其它的隐藏
    input.style.display = "block";
    // 让输入框里的内容为双击的文本内容
    input.value = e.target.textContent;
    //选中文本框内的字符串
    input.setSelectionRange(0,input.value.length);
    //聚焦
    input.focus();
}

// 点击多选框切换列表
function changeHandler(e) {
    if (e.target.type !== "checkbox") return;
    bg.staredRepo = JSON.parse(localStorage.getItem(e.target.name));

    if(e.target.checked){
        if(bg.staredRepo === null || bg.staredRepo.repo.length <= 0){
            bg.staredRepo = {tag: "", repo: []};
            bg.repoStars.repo = taburl;
            bg.repoStars.tag.push(e.target.name)
        }else{ 
            bg.staredRepo.repo.forEach(item => {
                if(item != taburl){
                    bg.staredRepo.repo.push(taburl)
                    bg.staredRepo.tag = e.target.name
                }
         });
        }
    } else {
        bg.repoStars.tag = bg.repoStars.tag.filter(item => item != e.target.name);
        if(!bg.repoStars.deltag.includes(e.target.name)){
            bg.repoStars.deltag.push(e.target.name);
        } 
        // repoStared.tag = repoStared.tag.filter(item => item != e.target.name)
    }
}   

function renderList() {
    // 把当前数据存到本地存储里面
    localStorage.list = JSON.stringify(list);


    // 遍历list
    // list是一个对象，包含 starlists
    // 这两个key正好和ol以及ul的id是相同的
    // 通过window[prop]可以获取到ol和ul
    for (var prop in list) {
        // 将li遍历存到ol和ul里面
        // innerHTML:获取HTML当前标签的起始和结束里面的内容
        window[prop].innerHTML = list[prop].reduce((value, item) => {
        repoStared = JSON.parse(localStorage.getItem(item));
        if((repoStared &&  repoStared.repo.includes(taburl))){
            bg.repoStars.tag.push(item);
        }
        
        return (
            value +
            `
                <li>
                    <input type="checkbox"  name = "${item}" ${
                        (repoStared &&  repoStared.repo.includes(taburl)) ? "checked" : ""
                      }  ${
                        (isGithubRepo(taburl)) ? "" : "disabled"
                      } >
                    <p>${item}<input type="text" id="tagName" style="display:none"></p>
                    </input>
                </li>
            `
        );
        }, "");
    }
    // 存储列表的数量
    starlistscount.textContent = list.starlists.length + list.githubstarlists.length;
    
}

function isGithubRepo(url) {
    // 正则表达式匹配出仓库链接
    const regex = /^https?:\/\/github\.com\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9-_.]+)(?:\/?)$/;
    const matchResult = url.match(regex);
    
    // 判断是否匹配成功
    if (matchResult && matchResult.length === 3) {
      return true
    }
    
    // 如果不是 GitHub 仓库链接或无法提取出仓库链接，则返回 null
    return false;
  }
  function isGithubBlobRepo(url) {
    // 正则表达式匹配出仓库链接
    const regex = /^https?:\/\/github\.com\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9-_.]+)(?:\/?|(?:\/blob\/[a-z0-9-_]+)?(?:\/[a-zA-Z0-9-_.]+)*)$/;
    const matchResult = url.match(regex);
    
    // 判断是否匹配成功
    if (matchResult && matchResult.length === 3) {
        return true
    }
    
    // 如果不是 GitHub 仓库链接或无法提取出仓库链接，则返回 null
    return false;
  }

function extractGitHubRepoLink(url) {
    // 正则表达式匹配出仓库链接
    const regex = /^https?:\/\/github\.com\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9-_.]+)(?:\/?)$/;
    const matchResult = url.match(regex);
    
    // 判断是否匹配成功
    if (matchResult && matchResult.length === 3) {
      const ownerName = matchResult[1];
      const repoName = matchResult[2];
      const repoLink = `https://github.com/${ownerName}/${repoName}`;
      return repoLink;
    }
    
    // 如果不是 GitHub 仓库链接或无法提取出仓库链接，则返回 null
    return null;
  }
  function extractGitHubBlobRepoLink(url) {
    // 正则表达式匹配出仓库链接
    const regex = /^https?:\/\/github\.com\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9-_.]+)(?:\/?|(?:\/blob\/[a-z0-9-_]+)?(?:\/[a-zA-Z0-9-_.]+)*)$/;
    const matchResult = url.match(regex);
    
    // 判断是否匹配成功
    if (matchResult && matchResult.length === 3) {
      const ownerName = matchResult[1];
      const repoName = matchResult[2];
      const repoLink = `https://github.com/${ownerName}/${repoName}`;
      return repoLink;
    }
    
    // 如果不是 GitHub 仓库链接或无法提取出仓库链接，则返回 null
    return null;
  }

function renderSearch() {

    // 遍历list
    // list是一个对象，包含 starlists
    // 这两个key正好和ol以及ul的id是相同的
    // 通过window[prop]可以获取到ol和ul
    for (var prop in searchlist) {
        // 将li遍历存到ol和ul里面
        // innerHTML:获取HTML当前标签的起始和结束里面的内容
        window[prop].innerHTML = searchlist[prop].reduce((value, item) => {
        repoStared = JSON.parse(localStorage.getItem(item));
        if((repoStared &&  repoStared.repo.includes(taburl))){
            bg.repoStars.tag.push(item);
        }
        
        return (
            value +
            `
                <li>
                    <input type="checkbox"  name = "${item}" ${
                        (repoStared &&  repoStared.repo.includes(taburl)) ? "checked" : ""
                      }>
                    <p>${item}<input type="text" id="tagName" style="display:none"></p>
                    </input>
                </li>
            `
        );
        }, "");
    }
    // 存储列表的数量
    starlistscount.textContent = searchlist.starlists.length + searchlist.githubstarlists.length;
    searchlist = {
        starlists: [],
        githubstarlists: [],
    };
}
