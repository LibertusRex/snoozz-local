// Register listeners synchronously; await message work before responding.
chrome.runtime.onMessage.addListener((msg, sender, respond) => {
    if (!msg || !(msg.logOptions || msg.wakeUp || msg.close || msg.poll)) return;
    (async () => {
        if (msg.logOptions) sendToLogs(msg.logOptions);
        if (msg.wakeUp) await wakeUpTask();
        if (msg.close) {
            await new Promise(resolve => setTimeout(resolve, Math.min(msg.delay || 2000, 5000)));
            if (msg.tabId) await chrome.tabs.remove(msg.tabId);
            if (msg.windowId) await chrome.windows.remove(msg.windowId);
            sendUIMessage({closePopup:true});
        }
        respond({ok:true});
    })().catch(error => respond({ok:false,error:String(error)}));
    return true;
});
chrome.storage.onChanged.addListener(async (changes, area) => {
	if (area !== "local") return;
	if (changes.snoozedOptions) {
		await setUpContextMenus(changes.snoozedOptions.newValue?.contextMenu);
		updateBadge(null, changes.snoozedOptions.newValue?.badge);
		if (changes.snoozedOptions.oldValue && changes.snoozedOptions.newValue?.history !== changes.snoozedOptions.oldValue.history) await wakeUpTask();
	}
	if (changes.snoozed) {
		await updateBadge(changes.snoozed.newValue);
		await wakeUpTask(changes.snoozed.newValue);
	}
});

if (chrome.notifications) chrome.notifications.onClicked.addListener(async id => {
	await chrome.notifications.clear(id)
	if (id === '_wakeUpNow') return await wakeUpTask();
	var t = await getSnoozedTabs(id);
	if (t && t.id && id && id.length) {
		var found = t.tabs ? await findTabAnywhere(null, t.id) : await findTabAnywhere(t.url);
		if (found && found.id && found.windowId) {
			try {
				await chrome.windows.update(found.windowId, {focused: true});
				if (t.tabs) {
					var winTabs = await getTabsInWindow();
					await chrome.tabs.update(winTabs[0] && winTabs[0].id ? winTabs[0].id : found.id, {active: true});
				} else {
					await chrome.tabs.update(found.id, {active: true});
				}
				return;
			} catch (e) {}
		}
	}
	await openExtensionTab('html/nap-room.html');
});

// All wake triggers share one queue. Always read fresh storage, never a stale event snapshot.
var wakeQueue = Promise.resolve();
function wakeUpTask() {
    const work = wakeQueue.then(processScheduledTabs);
    wakeQueue = work.catch(console.error);
    return work;
}
async function processScheduledTabs() {
    const tabs = await getSnoozedTabs();
    for (const tab of tabs) {
        const now = Date.now();
        if (tab.opened || tab.paused || !tab.wakeUpTime || tab.wakeUpTime > now || (tab.retryAt && tab.retryAt > now)) continue;
        if (!tab.url && !tab.tabs?.length) continue;
        try {
            if (tab.tabs) await openScheduledGroup(tab);
            else await openTab(tab, null, true);
            // Do not overwrite items added while Chrome was opening this tab.
            const latest = await getSnoozedTabs();
            const current = latest.find(t => t.id === tab.id);
            if (!current) continue;
            if (current.wakeUpTime !== tab.wakeUpTime || current.paused || current.opened) continue;
            if (current.repeat) current.wakeUpTime = (await calculateNextSnoozeTime(current.repeat)).valueOf();
            else current.opened = Date.now();
            delete current.wakeError; delete current.retryAt; delete current.wakeProgress;
            await saveTabs(latest);
        } catch (error) {
            const latest = await getSnoozedTabs();
            const current = latest.find(t => t.id === tab.id);
            if (current && !current.opened) {
                current.wakeError = String(error);
                current.retryAt = Date.now() + 60000;
                await saveTabs(latest);
            }
            console.warn('Snoozz: keeping failed item for retry', tab.id, error);
        }
    }
    await setNextAlarm(await getSnoozedTabs());
}
async function openScheduledGroup(tab) {
    // Keep partial progress so retrying a failed group does not reopen its successful tabs.
    const windows = await chrome.windows.getAll({windowTypes:['normal']});
    let target = windows.find(w => w.id === tab.wakeProgress?.windowId);
    if (!target && (tab.incognito || !tab.selection || tab.newWindow || !windows.length)) {
        target = await chrome.windows.create({incognito:!!tab.incognito});
    }
    for (let i = 0; i < tab.tabs.length; i++) {
        if (tab.wakeProgress?.openedIndexes?.includes(i)) continue;
        await openTab({...tab.tabs[i],incognito:!!tab.incognito}, target?.id);
        const latest = await getSnoozedTabs();
        const current = latest.find(t => t.id === tab.id);
        if (!current || current.paused || current.opened || current.wakeUpTime !== tab.wakeUpTime) return;
        current.wakeProgress ||= {windowId:target?.id, openedIndexes:[]};
        current.wakeProgress.openedIndexes.push(i);
        tab.wakeProgress = current.wakeProgress;
        await saveTabs(latest);
    }
}
async function setNextAlarm(tabs) {
    const times = tabs.filter(t => !t.opened && !t.paused && t.wakeUpTime && (t.url || t.tabs?.length))
        .map(t => Math.max(Number(t.wakeUpTime), t.retryAt || 0));
    if (!times.length) return chrome.alarms.clear('wakeUpTabs');
    await createAlarm(Math.max(Date.now() + 100, Math.min(...times)), true);
}
async function wakeMeUp() { return wakeUpTask(); }

async function setUpContextMenus(cachedMenus) {
	var cm = cachedMenus || await getOptions('contextMenu');
	if (!cm || !cm.length) return chrome.contextMenus.removeAll();
	var choices = await getChoices();
	var contexts = getBrowser() === 'firefox' ? ['link', 'tab'] : ['link'];
	if (cm.length === 1) {
		await chrome.contextMenus.removeAll();
		await chrome.contextMenus.create({
			id: cm[0], 
			contexts: contexts, 
			title: `Snoozz ${choices[cm[0]].label.toLowerCase()}`, 
			documentUrlPatterns: ['<all_urls>'],
			...(getBrowser() === 'firefox') ? {icons: {32: `../icons/${cm[0]}.png`}} : {}
		});
	} else {
		await chrome.contextMenus.removeAll();
		await chrome.contextMenus.create({id: 'snoozz', contexts: contexts, title: 'Snoozz', documentUrlPatterns: ['<all_urls>']})
		for (var o of cm) await chrome.contextMenus.create({
			parentId: 'snoozz',
			id: o, 
			contexts: contexts,
			title: choices[o].menuLabel,
			...(getBrowser() === 'firefox') ? {icons: {32: `../icons/${o}.png`}} : {}
		});
	}


}
if (chrome.commands) chrome.commands.onCommand.addListener(async (command, tab) => {
	if (command === 'nap-room') return openExtensionTab('/html/nap-room.html');
	tab = tab || await getTabsInWindow(true);
	await snoozeInBackground({menuItemId: command, pageUrl: tab.url}, tab)
})

async function snoozeInBackground(item, tab) {
	var c = await getChoices(item.menuItemId);
	
	var isHref = item.linkUrl && item.linkUrl.length;
	var url = isHref ? item.linkUrl : item.pageUrl;
	if(!isValid({url})) return createNotification(null, `Can't snoozz that :(`, 'icons/logo.svg', 'The link you are trying to snooze is invalid.', true);

	var snoozeTime = c && c.time;
	if (c && ['weekend', 'monday', 'week', 'month'].includes(item.menuItemId)) snoozeTime = await getTimeWithModifier(item.menuItemId);
	if (!snoozeTime || c.disabled || dayjs().isAfter(dayjs(snoozeTime))) {
		return createNotification(null, `Can't snoozz that :(`, 'icons/logo.svg', 'The time you have selected is invalid.', true);
	}
	// add attributes
	var startUp = item.menuItemId === 'startup' ? true : undefined;
	var title = !isHref ? tab.title : (item.linkText ? item.linkText : item.selectionText);
	var wakeUpTime = snoozeTime.valueOf();
	var pinned = !isHref && tab.pinned ? tab.pinned : undefined;
	var assembledTab = Object.assign(item, {url, title, pinned, startUp, wakeUpTime})

	var snoozed = await snoozeTab(item.menuItemId === 'startup' ? 'startup' : snoozeTime.valueOf(), assembledTab);
	
	var msg = `${!isHref ? tab.title : getHostname(url)} will wake up ${formatSnoozedUntil(assembledTab)}.`
	createNotification(snoozed.tabDBId, 'A new tab is now napping :)', 'icons/logo.svg', msg, true);

	if (!isHref) await chrome.tabs.remove(tab.id);
	await sendUIMessage({updateDash: true});
}

async function contextMenuUpdater(menu) {
	var choices = await getChoices();
	for (c of menu.menuIds) {
		if (choices[c]) await chrome.contextMenus.update(c, {enabled: !choices[c].disabled});
	}
	await chrome.contextMenus.refresh();
}

async function cleanUpHistory(tabs) {
	var h = await getOptions('history') || 365;
	var tabsToDelete = tabs.filter(t => h && t.opened && dayjs().isAfter(dayjs(t.opened).add(h, 'd')));
	if (tabsToDelete.length === 0) return;
	bgLog(['Deleting old tabs automatically:',tabsToDelete.map(t => t.id)],['','red'], 'red')
	await saveTabs(tabs.filter(t => !tabsToDelete.includes(t)));
}

async function setUpExtension() {
	var snoozed = await getSnoozedTabs();
	if (!snoozed || !snoozed.length || snoozed.length === 0) await saveTabs([]);
	var options = await getOptions();
	options = Object.assign({
		morning: [9, 0],
		evening: [18, 0],
		hourFormat: 12,
		icons: 'human',
		notifications: 'on',
		history: 14,
		theme: 'light',
		badge: 'today',
		closeDelay: 1000,
		polling: 'on',
		napCollapsed: [],
		weekStart: 0,
		popup: {weekend: options.timeOfDay || 'morning', monday: options.timeOfDay || 'morning', week: options.timeOfDay || 'morning', month: options.timeOfDay || 'morning'},
		contextMenu: ['startup', 'in-an-hour', 'today-evening', 'tom-morning', 'weekend']
	}, options);
	options = upgradeSettings(options);
	await saveOptions(options);
	await init();
}
function sendToLogs([which, p1]) {
	try {
		if (['tab', 'window', 'group', 'selection'].includes(which)) bgLog(['Snoozing a new ' + which, p1.id, 'till', dayjs(p1.wakeUpTime).format('HH:mm:ss DD/MM/YY')],['', 'green', '', 'yellow'],'green')
		if (which === 'history') bgLog(['Sending tabs to history:', p1.join(', ')], ['', 'green'], 'blue');
		if (which === 'manually') bgLog(['Waking up tabs manually:', p1.join(', ')], ['', 'green'], 'blue');
		if (which === 'delete') bgLog(['Deleting tabs manually:', p1.join(', ')], ['', 'red'], 'red');
	} catch (e) {console.log('logError', e, which, p1)}
}

async function init(isBrowserStartup = false) {
	var allTabs = await getSnoozedTabs();
	if (isBrowserStartup && allTabs && allTabs.length && allTabs.some(t => (t.startUp || (t.repeat && t.repeat.type === 'startup')) && !t.opened)) {
		allTabs.filter(t => (t.startUp || (t.repeat && t.repeat.type === 'startup')) && !t.opened).forEach(t => t.wakeUpTime = dayjs().subtract(10, 's').valueOf());
		await saveTabs(allTabs);
	}
	await wakeUpTask();
	await setUpContextMenus();
}

chrome.contextMenus.onClicked.addListener((item, tab) => snoozeInBackground(item, tab).catch(console.error));
chrome.runtime.onInstalled.addListener(() => setUpExtension().catch(console.error));
chrome.runtime.onStartup.addListener(() => init(true).catch(console.error));
chrome.alarms.onAlarm.addListener(a => {
    if (a.name === 'wakeUpTabs') return wakeUpTask();
});
chrome.idle.onStateChanged.addListener(s => { if (s === 'active') return wakeUpTask(); });
// An update or restart may have removed alarms. Rebuild them on every worker start,
// but process "next launch" entries only on the actual onStartup event in init().
wakeUpTask().catch(console.error);
