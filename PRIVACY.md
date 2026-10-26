# Privacy Policy - Snoozz Local

Effective date: October 26, 2026

This policy applies to Snoozz Local - Tabs & Windows, the independent Manifest V3 update maintained by LibertusRex. It describes this version, not the original Snoozz extension or its website.

## In plain language

Your snoozed tabs and settings stay in your browser. Snoozz Local does not require an account, operate a cloud synchronization service, or send your tab data or usage analytics to the developer. The developer cannot view or recover your locally stored schedules.

## Data the extension uses

To provide its tab-snoozing features, the extension reads information about open tabs, including URLs, titles, tab and window identifiers, and relevant tab properties. It uses this information to display available tabs, save your selected tabs, close them, and reopen their URLs later. When you snooze a link, it saves that link's URL and available title.

The extension stores the following in chrome.storage.local:

- Saved tab URLs and titles, including tabs within snoozed windows or selections.
- Wake-up times, creation times, recurrence rules, paused or completed status, and reopening progress or error information where applicable.
- A local history of snoozed and reopened tabs, subject to your history settings.
- Preferences such as appearance, notifications, context menus, shortcuts-related settings, and scheduling defaults.

URLs and titles may contain personal or sensitive information. The extension does not need page contents, passwords, cookies, payment details, or the contents of forms to perform its function. It does not read Chrome's browsing-history database or record all websites you visit.

## Why permissions are needed

- **tabs:** Read URLs and titles for tab selection and snoozing, and manage the tabs being closed, reopened, or focused.
- **storage:** Keep schedules, history, and preferences locally.
- **alarms:** Check schedules and reopen tabs when they are due.
- **contextMenus:** Offer snooze actions in the right-click menu.
- **idle:** Check overdue schedules when you become active again. Activity states are not logged or transmitted.
- **notifications:** Show optional wake-up notifications and let you return to reopened tabs. Notifications may reveal tab titles on your screen; you can disable them in the extension's settings.

## Local processing, network activity, and third parties

This version does not transmit saved URLs, titles, schedules, preferences, or usage analytics to the developer or an analytics provider. It does not sell or share this data, use it for advertising, or use remote code. Its executable scripts and libraries are bundled with the extension. A legacy analytics preference or reference may remain in the interface; analytics transmission is disabled in this version regardless of that preference.

Reopening a saved URL loads the website normally. That website and your browser may then make network requests and process data according to their own settings and privacy policies. Links to GitHub, the original project website, support pages, or Ko-fi open external services governed by their own policies. Payment information for voluntary support is handled by the payment service, not by the extension.

Chrome, the Chrome Web Store, your operating system, and any backup software operate independently of this extension. Their own diagnostics, updates, account features, and backups are outside the developer's control. Local extension storage is not cloud synchronization, but device or profile backups may contain it.

## Import and export

Importing reads a file you explicitly select and saves valid schedules locally. The extension does not upload the imported file to a server. Exporting creates a local text file containing your saved tab records, which may include URLs, titles, schedules, and history. Exported files are not encrypted by the extension. Anyone you share them with may be able to read that information.

## Retention, deletion, and control

Pending schedules remain until you remove or change them, or they are processed. Completed records are retained according to the extension's history settings and cleanup behavior. Preferences remain until changed or extension data is cleared.

You can manage saved entries and history through the extension's interface, change history retention and notification settings, and export records for your own backup. Removing the extension through Chrome removes its extension storage from that Chrome profile. Files you exported, copies you shared, and device backups must be deleted separately. The developer has no server-side copy to delete or restore.

## Security

Data relies on the protection of your Chrome profile and device. The extension does not add its own encryption to local storage or exports. Other people or software with access to your device, profile, backups, or exported files may be able to access the data. No storage method can be guaranteed completely secure.

## Children

The extension is a general-purpose productivity tool and is not specifically directed at children. The developer does not knowingly receive personal information from children through the extension.

## Changes to this policy

Material changes to the extension's data practices will be reflected in this policy with an updated effective date. Future versions that introduce different data handling must describe those changes accurately.

## Contact

Maintainer: LibertusRex

For privacy questions or to report a problem, use the project's issue tracker:
https://github.com/LibertusRex/snoozz-local/issues

GitHub issues are public. Do not post private URLs, passwords, exported schedules, or other sensitive information there.
