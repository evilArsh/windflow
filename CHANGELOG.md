## v0.7.8

- fix: platform map error
- feat: comment out macOS notarization in electron-builder config
- feat: add macOS notarization setup with placeholder script
- feat(chat): emit render finish event and throttle affix updates
- feat(chat): remove borders from child message textareas
- feat(markdown): add plaintext rendering option and improve component handling
- feat(markdown): enhance Vue runtime component configuration
- feat(provider): add search bar visibility setting and collapse UI for model config
- feat(autoUpdate): display release notes in update dialog
- chore: update changelog for v0.7.7

## v0.7.7

- feat(model): enhance model detail validation and UI improvements
- feat(main): add single instance lock and window focus on second instance
- feat(i18n): improve English locale consistency and clarity
- feat(ui): remove line clamp from model name display
- feat: improve app shutdown process and cleanup
- chore(ci): streamline build workflow and update dependencies
- feat(core): add topic summarization and message finish flag
- feat: update CSP, commitlint config, and add validation for empty models
- feat(chat): centralize message utility imports in Vue components
- feat: update import paths and tsconfig alias for better module resolution
- chore(deps): update multiple dependencies to latest versions
- fix: delete update log
- chore: update changelog for v0.7.6

## v0.7.6

- feat: add GitHub workflow permissions and disable auto-publishing
- feat(ci): add GH_TOKEN env variable to build steps
- chore: update ci
- feat: bump version to 0.7.6 and add electron-updater script
- refactor(markdown): replace async imports with direct imports for code components
- feat: add system tray with window management and close behavior
- feat: handle aborted requests and add chat message update function
- feat(ci): improve pnpm caching and dependency installation
- feat: implement auto-update with GitHub releases provider
- docs: update README with enhanced documentation and download links
- chore(release): bump version from 0.7.4 to 0.7.5
- feat(markdown): improve worker message processing with animation frame batching
- refactor(storage): remove unused params and use direct db access when doing query
- refactor(core): remove transaction wrapper from message storage
- feat(core): add abort check and improve message handling
- docs(markdown): add comprehensive README documentation
- feat: add electron-builder configuration and build scripts

## v0.7.3

- chore(release): bump version from 0.7.2 to 0.7.3
- refactor(message): replace direct function calls with class method calls
- fix(chat): update terminate and restart functions to use message ID
- fix: fix chat random icon error
- chore: update changelog for v0.7.2

## v0.7.2

- ci: fix build error
- chore: update changelog for v0.7.1

## v0.7.1

- ci: update permissions

