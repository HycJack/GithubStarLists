var repoStars = {
    tag: [],
	deltag: [],
    repo: ""
};

var staredRepo = {
    tag: "",
    repo: []
};
chrome.extension.onConnect.addListener(function (externalPort) {
    externalPort.onDisconnect.addListener(function() {
    var ignoreError = chrome.runtime.lastError;
        // console.log("onDisconnect",staredRepo);
		repoStars.tag.forEach(item => {
			var staredRepoStore = JSON.parse(localStorage.getItem(item));
			if(staredRepoStore != null ){
				if(staredRepoStore.repo.length <= 0){
					staredRepoStore.repo.push(repoStars.repo);
				}else{
					staredRepoStore.repo.forEach( item => {
						if(item != repoStars.repo) {
							staredRepoStore.repo.push(repoStars.repo);
						}
					});
				}
			}else{
				staredRepoStore = {
					tag: "",
					repo: []
				};
				staredRepoStore.tag = item;
				staredRepoStore.repo.push(repoStars.repo);
			}
			var tag = staredRepoStore.tag;
        	localStorage.setItem(tag, JSON.stringify(staredRepoStore));
		});
		repoStars.deltag.forEach(item => {
			var staredRepoStore = JSON.parse(localStorage.getItem(item));
			if(staredRepoStore != null ){
				staredRepoStore.repo = staredRepoStore.repo.filter(ele => repoStars.repo != ele);
			}
			var tag = staredRepoStore.tag;
        	localStorage.setItem(tag, JSON.stringify(staredRepoStore));
		});
    });
});
chrome.runtime.onInstalled.addListener(function(){
	chrome.declarativeContent.onPageChanged.removeRules(undefined, function(){
		chrome.declarativeContent.onPageChanged.addRules([
			{
				conditions: [
					// 只有打开百度才显示pageAction
					new chrome.declarativeContent.PageStateMatcher({pageUrl: {urlContains: 'github.com'}})
				],
				actions: [new chrome.declarativeContent.ShowPageAction()]
			}
		]);
	});
});
