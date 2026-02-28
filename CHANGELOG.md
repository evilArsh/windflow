## v0.8.3

- chore: upadte version
- ci: fix the pnpm version to prevent errors after CI packaging
- chore: update deps
- ci: add conditional build options and tag-only release steps
- ci: exclude chore commits from release notes generation
- feat: happy chinese new year
- fix(storage): ensure all model types are preserved during v4 migration
- feat(storage): cascade delete chat messages with associated media
- fix(core): improve request tracking ,fix image request and handler error
- feat(core): refactor message content handling and topic cleanup
- fix(chat): prevent duplicate shortcut triggers
- feat(media): enhance media handling and RAG file processing
- perf(rag): refactor text tile reading algorithm and add image transformer support
- feat(components): enhance ContentBox with button mode and loading states
- fix(chat): fix topic deletion logic error
- fix(chat): optimize media retrieval and file upload handling
- refactor(storage): add disableQueue option to storage operations
- feat(chat): enhance bulk topic deletion with media cleanup
- fix(chat): fix condition for clearing current topic after deletion
- fix(chat): trim whitespace-only messages before/after sending
- feat(core): improve abort handling and media file management
- chore: update deps
- feat(core): add media management and refactor message handling
- feat: add file upload support with validation and UI components
- fix(openai): exclude latest chat models from reasoning support
- chore: update dependencies
- feat: remove ChatReasoner model type and migrate to Chat type
- feat(core): fix reasoning enable condition for siliconflow models
- feat(openai): add reasoning support detection and conditional logic
- fix(model-detail): initialize type group on model detail initialization
- refactor(core): simplify model filtering and reasoning parameter handling
- feat(core): refactor request handling to use param handler, refactor deep thinking logic
- feat(chat): add ctrl+arrowUp shortcut for simple mode
- feat(ui): refactor ContentBox component styling and variants
- chore(components): update PopConfirm and knowledge components
- chore: fix release version error
- ci: update changelog for v0.7.15

## v0.7.15

- chore: fix decode-named-character-reference path, update dependencies
- feat(mac): add library validation disable entitlement
- fix(message): refactor event system and improve context management. fix refresh and terminate bug
- chore(markdown): move decode-named-character-reference patch to root
- ci: update changelog for v0.7.14

## v0.7.14

- feat(autoUpdate): using AI assistant to automatically translate release notes
- feat(button): add text loading support and improve loading animation
- feat(core): track model usage frequency and improve data handling
- refactor: add storage manager classes for centralized data access
- refactor(message): extract message storage logic into dedicated class
- fix(chat): add transparent divider and optimize theme toggle logic
- feat(chat): add anchor links to message bubbles for navigation
- feat(message): add batch message removal and topic creation methods
- feat(auto-update): add app name display and UI enhancements
- feat(auto-update): refactor UI and enhance AutoUpdate handling
- chore(Style): delete unrelated files
- perf(chat): optimize affix icon styling in single message content
- ci: update changelog for v0.7.13

## v0.7.13

- feat(chat): add chat panel width setting and improve message alignment
- feat(chat): add chat debugger setting and shortcut item component
- refactor(MsgBubble): restructure layout and add icon slot
- chore(deps): update @toolmain/components to 1.2.24 and bump related packages
- chore(ui): refactor table component and add shortcut binding hook
- feat(components): add SidebarToggle component with teleport support
- feat(chat): add input height default and fix panel toggle icons
- feat(chat): add chat list display style setting and UI improvements
- refactor: rename Markdown component event and update locale
- feat(settings): add sidebar and chat panel toggle shortcuts
- ci: update changelog for v0.7.12

## v0.7.12

- feat(chat): complete message sending shortcut
- fix(chat): ensure the correct order when creating or modifying topics
- feat(chat): add new chat and sub-chat shortcut settings
- fix(chat): fix send shortcut condition and improve dialog button layout
- fix(chat): fix thinking component collapse logic
- fix(ui): update ContentBox background and remove redundant props
- perf(chat): improve input handling and shortcut configuration
- feat(chat): add simple mode shortcut and improve content layout resizing
- perf(ui): improve MCP tool call display and markdown word wrapping
- ci: update changelog for v0.7.11

## v0.7.11

- chore(release): bump version from 0.7.10 to 0.7.11
- feat(chat): refactor settings UI and add new item component
- feat(settings): refactor dataBind to return reactive data and improve null safety
- refactor(settings): refactor dataWatcher to support null wrapData
- feat: reduce minimum window size for improved usability
- feat(icons): add new icon components for enhanced UI functionality
- feat(chat): add reusable UI components for message handler actions
- ci: update changelog for v0.7.10

## v0.7.10

- chore: bump version to 0.7.10
- build: switch electron-builder to catalog version and downgrade to 26.0.20
- ci: update changelog for v0.7.9
- feat: bump version to 0.7.9
- feat(markdown): update remark/rehype dependenciesl, add new remark/rehype plugins
- feat(markdown): improve Vue runtime and CodeBlock component performance
- feat(markdown): replace empty root fragment with span element
- feat(markdown): add remark-comment plugin and handle empty root nodes
- feat(chat): apply consistent flex layout to user message content
- ci: exclude ci commits from release notes generation
- feat(chat): conditionally render plaintext or markdown in user messages
- perf: improve the accuracy of `Affix`
- chore(deps): update multiple dependencies to latest versions
- chore: update changelog for v0.7.8

## v0.7.9

- feat: bump version to 0.7.9
- feat(markdown): update remark/rehype dependenciesl, add new remark/rehype plugins
- feat(markdown): improve Vue runtime and CodeBlock component performance
- feat(markdown): replace empty root fragment with span element
- feat(markdown): add remark-comment plugin and handle empty root nodes
- feat(chat): apply consistent flex layout to user message content
- ci: exclude ci commits from release notes generation
- feat(chat): conditionally render plaintext or markdown in user messages
- perf: improve the accuracy of `Affix`
- chore(deps): update multiple dependencies to latest versions
- chore: update changelog for v0.7.8

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

