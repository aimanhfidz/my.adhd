# my.adhd — iOS

The `WKWebView` shell in `ios/`. Read **`ios/README.md`** first — it has the
full picture: what the five native features are and why each needed the native
side, how to build and sign on a device, the keychain handover, the widgets and
the wallpaper, and where the App Store submission stands. This file is standing
rules for working in here.

`CLAUDE.md` holds the boundary between this and the web app. It applies whatever
the focus is, and it is the one thing not to work around.

## Hard rules

- **No file outside `ios/` is edited to make an iOS feature work.** Not a
  selector, not an endpoint, not a stylesheet. The shell is a wrapper and an
  injection, and that is what lets it work against whatever happens to be
  deployed. When something looks like it needs the site changed, stop and ask —
  `CLAUDE.md` says what that conversation looks like.
- **The team id lives only in `ios/Local.xcconfig`**, which is git-ignored.
  Nothing tracked writes it down, including prose. `Signing.xcconfig`
  `#include?`s it.
- **Every new target's build configs need
  `baseConfigurationReference = Signing.xcconfig`.** There is no
  `DEVELOPMENT_TEAM` anywhere in the pbxproj — it arrives only through that
  xcconfig, attached per target rather than to the project. Omit it and the
  other targets sign while the new one fails with an error that names nothing
  useful.
- **An extension must carry the same `MARKETING_VERSION` and
  `CURRENT_PROJECT_VERSION` as the app**, and the build number has to increase
  on every upload, for ever, including ones that get rejected.
- **`MyADHDWidgets` touches neither `UserDefaults` nor the filesystem.** That is
  what keeps `MyADHDWidgets/PrivacyInfo.xcprivacy` declaring no accessed APIs at
  all: `SecItem*` is not a required-reason API, but `UserDefaults` (CA92.1),
  file timestamps (C617.1) and free disk space (E174.1) are. State belongs in
  the app target.
- **`TaskBridge.write` sits above the notification-permission gate in
  `Reminders.sync`.** That gate returns early for anyone who declined
  notifications. Below it, the widget is silently and permanently empty for
  those users — the worst kind of bug, because it looks like nothing.
- **Never clear the snapshot or the wallpaper on a failed read.** No page, an
  unparseable store, a phone rebooted overnight and not yet unlocked — none of
  those means "the list is empty". Yesterday's data beats a blank tile, and a
  cold launch reads before the page has painted.
- **Don't declare `NSSupportsLiveActivities`** until something actually needs
  it; a push-updated Live Activity needs paid APNs anyway. Same for
  `ControlWidget`, which is iOS 18 against a project that targets 17.0.
- **Images are not accepted by the share extension, deliberately.** Nothing in
  the app can read one, so offering it would be a button that captures nothing.

## Building it

```bash
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcodebuild \
  -project ios/MyADHD.xcodeproj -scheme MyADHD -sdk iphonesimulator \
  -configuration Debug CODE_SIGNING_ALLOWED=NO build
```

`xcode-select` points somewhere else on this machine, so `DEVELOPER_DIR` is not
optional. A simulator build will **not** catch a missing
`baseConfigurationReference`, because that failure is signing-only — build to a
device before believing a new target works.

**There are no simulator runtimes installed.** A SwiftUI view that avoids UIKit
can be compiled for macOS and rendered straight to a PNG with `swiftc` and
`ImageRenderer`, which is how the wallpaper and the timeline band were checked
without a phone. Keep views UIKit-free where it is free to do so — `Font.custom`
already falls back to the system face, so no `UIFont` lookup is needed.

**Signing expires weekly on a free team, and it now expires across all three
targets.** Re-running from Xcode is also a re-add for the widget, because iOS
removes an expired one rather than blanking it. `ios/README.md` has what that
costs day to day, and why renaming a target is not free.

## Two things that are easy to get wrong

**`ios/Shared/` is not a synchronised group.** A new `.swift` in `MyADHD/` or
`MyADHDWidgets/` is picked up with no project edit; one in `Shared/` needs a
`PBXFileReference` plus one `PBXBuildFile` per consuming target, by hand.

**The shell's promises about the web app are listed in `ios/README.md`.** Read
them there. They have grown — the grounds and ids and selectors, and since the
widgets the task field names `TaskBridge` reads, the invented category palette,
and the bundled copy of the web app's font. No count is given on purpose.
