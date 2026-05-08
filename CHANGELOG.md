## [1.10.0](https://github.com/PVAS-Development/whisperdesk/compare/v1.9.0...v1.10.0) (2026-05-08)

### ✨ Features

- add media player toggle functionality and update related UI components ([ec8d489](https://github.com/PVAS-Development/whisperdesk/commit/ec8d48906a5a6d9f933629b980dcea8c55b014ab))
- add TranscriptMediaPlayer component and related functionality ([a461994](https://github.com/PVAS-Development/whisperdesk/commit/a461994c00ccf97f66ca76cc1138e4cb864d161d))
- add volume, mute, and playback speed controls to TranscriptMediaPlayer ([69afff1](https://github.com/PVAS-Development/whisperdesk/commit/69afff196044420dafb329424ccacbcde6cd9552))
- enhance ETA calculation for batch processing in useBatchQueue ([ba14a4b](https://github.com/PVAS-Development/whisperdesk/commit/ba14a4b74335e91b929e9011b354189e248813e0))
- enhance TranscriptMediaPlayer with media source state management and loading behavior tests ([939b0bd](https://github.com/PVAS-Development/whisperdesk/commit/939b0bdc94c5d99b2aaffc2dee4ffbcb982a90e7))
- implement media file validation and approval process with associated tests ([d8eab8e](https://github.com/PVAS-Development/whisperdesk/commit/d8eab8e41a680650274895926a5ffe9e093caa52))

### 🐛 Bug Fixes

- add estimated time remaining calculation for batch processing ([80f6b54](https://github.com/PVAS-Development/whisperdesk/commit/80f6b544b958c72aeac443ce8d4b1d2211e88862))
- enhance media protocol tests with range request handling and error responses ([1a7e844](https://github.com/PVAS-Development/whisperdesk/commit/1a7e8449bd9405f6d79686e97b82fc9d461cbdc1))
- implement media protocol handling with expiration and eviction logic ([2994a0c](https://github.com/PVAS-Development/whisperdesk/commit/2994a0c56e6ddfa8766641ea7a376f3cebdda50b))

## [1.9.0](https://github.com/PVAS-Development/whisperdesk/compare/v1.8.0...v1.9.0) (2026-02-20)

### ✨ Features

- add estimated time remaining feature to file queue and batch processing ([51d51ad](https://github.com/PVAS-Development/whisperdesk/commit/51d51ad1252e516f52f734e900a57280f2b0ac0e))
- add queue resume functionality with UI prompt and local storage handling ([e5df5ca](https://github.com/PVAS-Development/whisperdesk/commit/e5df5ca6c9ca61b58e83fe5e73bb2c206f7da31b))
- add retry functionality for failed and cancelled transcription items ([5011ecc](https://github.com/PVAS-Development/whisperdesk/commit/5011ecc985cfc8988a51f6dabf1c80214e4e9376))
- add search functionality to transcription history with filtering and clear option ([a3e6735](https://github.com/PVAS-Development/whisperdesk/commit/a3e67352c2befded0173adabec9473b765a3971a))
- add support for additional audio formats (OPUS, OGA, AMR) and update related components ([f4b332c](https://github.com/PVAS-Development/whisperdesk/commit/f4b332cffc1d56ffe9ff3c2f7386e9748b0e309b))
- enhance FileQueue with user-friendly error messages and toast notifications for failed items ([5143d07](https://github.com/PVAS-Development/whisperdesk/commit/5143d07b887475902a9cb092d6e0754e7c9ba070))
- estimate remaining time during transcription processing ([854be2c](https://github.com/PVAS-Development/whisperdesk/commit/854be2c7f5b45ee7ad617a35dd6b9b42696fab10))
- implement duplicate file handling in batch queue and UI updates ([f6746dd](https://github.com/PVAS-Development/whisperdesk/commit/f6746dda1be8e9302b13b36f97004439d60bcdcd))
- implement safeSend utility for IPC communication and enhance error handling ([0466600](https://github.com/PVAS-Development/whisperdesk/commit/04666002369eb75ccaac060c30dcbd9acdbbfb41))
- implement showItemInFolder functionality and related tests ([ca1973b](https://github.com/PVAS-Development/whisperdesk/commit/ca1973bbacf5f010066deaee7db62b7597ff8a3c))
- update README and documentation to reflect new features ([f02eb73](https://github.com/PVAS-Development/whisperdesk/commit/f02eb738724d02b45cde37ebbee319a2183afb77))

### 🐛 Bug Fixes

- adjust margin-top in FileQueue CSS for better layout ([586b979](https://github.com/PVAS-Development/whisperdesk/commit/586b9794edacfecd9011d55225d8fa7d5110b344))
- improve error handling and resource management in file fingerprint generation ([35c312c](https://github.com/PVAS-Development/whisperdesk/commit/35c312c04d42200d02a4a2ad62970af1173fea3b))
- resolve file path validation logic and enhance language auto-detection comment ([afe0a64](https://github.com/PVAS-Development/whisperdesk/commit/afe0a64e1a3c7262d30e6abee4b327b7ba7bc414))
- simplify language argument handling in transcribe function ([d6b7302](https://github.com/PVAS-Development/whisperdesk/commit/d6b73027e299c7ca105124a65153afe7b0742df1))

## [1.8.0](https://github.com/PVAS-Development/whisperdesk/compare/v1.7.1...v1.8.0) (2025-12-21)

### ✨ Features

- add batch transcription support ([f74957c](https://github.com/PVAS-Development/whisperdesk/commit/f74957cc5768e06359dbcf0cbeb7d4aed5813fe9))
- enhance FileQueue component to prevent removal of processing items ([4340e17](https://github.com/PVAS-Development/whisperdesk/commit/4340e179bf78582327e7874311aad24339faac20))

## [1.7.1](https://github.com/PVAS-Development/whisperdesk/compare/v1.7.0...v1.7.1) (2025-12-19)

### 🐛 Bug Fixes

- ensure progress percentage does not exceed 100 in transcribe function ([23ef4ff](https://github.com/PVAS-Development/whisperdesk/commit/23ef4ff3c4d47c84e608a9c42c180319c91fc277))

## [1.7.0](https://github.com/PVAS-Development/whisperdesk/compare/v1.6.2...v1.7.0) (2025-12-18)

### ✨ Features

- add .nvmrc file and update package.json with node engine requirements ([f12d01a](https://github.com/PVAS-Development/whisperdesk/commit/f12d01a69363a2cfd09473b7abf9b0e1e846ad6b))
- add debug logs modal and integrate logging functionality across components ([6bcb9fa](https://github.com/PVAS-Development/whisperdesk/commit/6bcb9fa2e67d6b135fd228e6c52c2fafaef29423))
- add ErrorMessage, TranscriptionActions, and TranscriptionProgress components ([4e20511](https://github.com/PVAS-Development/whisperdesk/commit/4e20511c95466bff066ac2f31508565aff235842))
- add Privacy Policy & Terms page and update README for privacy details ([883b214](https://github.com/PVAS-Development/whisperdesk/commit/883b21463ecfe6bd7c13ef4e0e2204dd141de50c))
- add support section with donation links to README ([093d79f](https://github.com/PVAS-Development/whisperdesk/commit/093d79f9806c595d2e8b20b49eb244bceb4f028f))
- add TypeScript build artifacts to .gitignore for improved project structure ([3d616dc](https://github.com/PVAS-Development/whisperdesk/commit/3d616dc51c5f048f1a447740ce505159e736f12f))
- enhance electronAPI tests with additional functionality checks and event tracking ([9dde448](https://github.com/PVAS-Development/whisperdesk/commit/9dde448e68e3836483e1b6a06a5024e05cf4589e))
- implement ErrorBoundary component with error handling UI and styles ([4cc92bb](https://github.com/PVAS-Development/whisperdesk/commit/4cc92bb2be9519794a291b98ca6b3adbdd975972))
- implement sanitizePath utility and update logging in various components ([840dd0e](https://github.com/PVAS-Development/whisperdesk/commit/840dd0e6ca637dace58c0a2c11dde4edd3264980))
- implement useFFmpegStatus hook ([2eeba4c](https://github.com/PVAS-Development/whisperdesk/commit/2eeba4cd16d852edcd2e864448ffdd78de78a1c5))
- integrate FFmpeg availability checks into transcription components ([82b0616](https://github.com/PVAS-Development/whisperdesk/commit/82b06168f47e1adc7e1e5bd2011abdbae56d972e))
- refactor SystemWarning and SettingsPanel to use updated service methods ([8b6f31d](https://github.com/PVAS-Development/whisperdesk/commit/8b6f31d368225026497d674d7532b62c9ecc0cb5))
- refactor transcription and menu handling to use centralized electronAPI services ([9f517c1](https://github.com/PVAS-Development/whisperdesk/commit/9f517c15c492e9a609f7f8fd68fb48629d5964ec))

### 🐛 Bug Fixes

- update CI badge in README to reflect current branch ([fe649eb](https://github.com/PVAS-Development/whisperdesk/commit/fe649eba9f473ab887de3e73a98340ed4e98ae2e))
- update DMG background color for improved visibility ([bdc2232](https://github.com/PVAS-Development/whisperdesk/commit/bdc22324ee87f4ca8cabce29c4484add6591eba7))

## [1.6.2](https://github.com/PVAS-Development/whisperdesk/compare/v1.6.1...v1.6.2) (2025-12-09)

### 🐛 Bug Fixes

- use Electron API for retrieving file paths ([9ced370](https://github.com/PVAS-Development/whisperdesk/commit/9ced370b756cf4bf9114c6e6a57850b7b85be2f6))

## [1.6.1](https://github.com/PVAS-Development/whisperdesk/compare/v1.6.0...v1.6.1) (2025-12-08)

### 🐛 Bug Fixes

- add aria-label to FFmpeg download button for accessibility ([9740975](https://github.com/PVAS-Development/whisperdesk/commit/9740975935dc8ecad9443592032c7c3b56293b50))
- add error handling for FFmpeg status refresh ([6ba719e](https://github.com/PVAS-Development/whisperdesk/commit/6ba719e0614c574ffa840026b2f25090b77aa5be))
- enhance FFmpeg installation guidance and improve donation section functionality ([b45e51c](https://github.com/PVAS-Development/whisperdesk/commit/b45e51cb2ae114958e33b95542475d1a7d3fdb5a))

## [1.6.0](https://github.com/PVAS-Development/whisperdesk/compare/v1.5.0...v1.6.0) (2025-12-08)

### ✨ Features

- add confirmation dialog for clearing all transcription history ([d46e80d](https://github.com/PVAS-Development/whisperdesk/commit/d46e80d1d46f13520d46487b9300dca0402194b9))
- add donation section with PayPal and Buy Me a Coffee links ([43de640](https://github.com/PVAS-Development/whisperdesk/commit/43de640324d6b9e81acc43aa061df01846115118))
- implement auto-update functionality with notifications ([5dd231c](https://github.com/PVAS-Development/whisperdesk/commit/5dd231c6caaabaf60cf304f4a49780265c017f92))

### 🐛 Bug Fixes

- enhance auto-update and donation features with new tests and improved file size formatting ([3961325](https://github.com/PVAS-Development/whisperdesk/commit/396132566c50400f9e044d0f38f6710d6be93942))

## [1.5.0](https://github.com/PVAS-Development/whisperdesk/compare/v1.4.2...v1.5.0) (2025-12-08)

### ✨ Features

- add analytics tracking for FFmpeg events ([71cf9a0](https://github.com/PVAS-Development/whisperdesk/commit/71cf9a09e99f89b39fdcb59e65d2ac08b5d090f8))
- add FFmpeg availability check and system warning component ([ecfd089](https://github.com/PVAS-Development/whisperdesk/commit/ecfd089d0c4a3b64fcad383023bbd1714c60bef6))

### 🐛 Bug Fixes

- enhance FFmpeg availability check and improve UI feedback for system requirements ([d1b6d3a](https://github.com/PVAS-Development/whisperdesk/commit/d1b6d3a58b7e33eb443e0564f27aea3d39b83730))
- improve FFmpeg availability check and enhance accessibility in UI components ([facd62f](https://github.com/PVAS-Development/whisperdesk/commit/facd62f80b517b891f4b41f92469fc8896702e00))

## [1.4.2](https://github.com/PVAS-Development/whisperdesk/compare/v1.4.1...v1.4.2) (2025-12-05)

### 🐛 Bug Fixes

- initialize analytics only once during app startup ([1b46600](https://github.com/PVAS-Development/whisperdesk/commit/1b46600ab620b27d4c37a30033a68e48e36ed5be))

## [1.4.1](https://github.com/PVAS-Development/whisperdesk/compare/v1.4.0...v1.4.1) (2025-12-05)

### 🐛 Bug Fixes

- remove stdoutSnippet from transcription error handling ([0e41522](https://github.com/PVAS-Development/whisperdesk/commit/0e415227e7e89f914fc5b0ee4786aedd2ac661b6))
- update whisper service with improved file handling and cleanup logic during transcription ([8a11a86](https://github.com/PVAS-Development/whisperdesk/commit/8a11a86ea14bb0ebe53b5374adfa5206e95ea94d))

## [1.4.0](https://github.com/PVAS-Development/whisperdesk/compare/v1.3.0...v1.4.0) (2025-12-04)

### ✨ Features

- enhance SEO and accessibility in index.html with updated metadata and structured data ([1e88f0b](https://github.com/PVAS-Development/whisperdesk/commit/1e88f0b03b3a91e91947addd4c939be5e17ac902))

### 🐛 Bug Fixes

- improve accessibility by updating aria attributes and enhancing layout structure ([cdc8d3c](https://github.com/PVAS-Development/whisperdesk/commit/cdc8d3ca7a6849e62b6be57def2c7f5b708496b4))
- update aria-label for download button and adjust icon sizes for better accessibility ([1b85a13](https://github.com/PVAS-Development/whisperdesk/commit/1b85a139d1a80c3a1374e610bf68bf7d45e97e5f))

## [1.3.0](https://github.com/PVAS-Development/whisperdesk/compare/v1.2.1...v1.3.0) (2025-12-04)

### ✨ Features

- enhance analytics tracking and add warning for missing APTABASE_APP_KEY ([430f05f](https://github.com/PVAS-Development/whisperdesk/commit/430f05fc9c1277a4e5622a7b9b95df106b73cc38))
- integrate Aptabase and google analytics for event tracking ([cc9a090](https://github.com/PVAS-Development/whisperdesk/commit/cc9a0901d07ceef400d151663c49138028c1ef04))

## [1.2.1](https://github.com/PVAS-Development/whisperdesk/compare/v1.2.0...v1.2.1) (2025-12-04)

### 🐛 Bug Fixes

- update README links and add auto updates feature ([06ed6bf](https://github.com/PVAS-Development/whisperdesk/commit/06ed6bfcc569ba83350b57d2e698959b8333ea4f))

## [1.2.0](https://github.com/PVAS-Development/whisperdesk/compare/v1.1.6...v1.2.0) (2025-12-04)

### ✨ Features

- add initial HTML structure, styles, and assets for WhisperDesk documentation ([ad12525](https://github.com/PVAS-Development/whisperdesk/commit/ad1252525498ec725ec1db7218a568fc66ba8fbc))
- add new landing page and update design ([cb907fb](https://github.com/PVAS-Development/whisperdesk/commit/cb907fbd7837ad98e5336e32afe6d78cdc4d67c4))
- refactor IPC handler registration and improve window handling in transcription service ([c9afb51](https://github.com/PVAS-Development/whisperdesk/commit/c9afb51dc7e9490cf3dcd651d630fda1fb9446b1))
- update design elements and styles for improved UI consistency and new features ([5ab4e19](https://github.com/PVAS-Development/whisperdesk/commit/5ab4e19ce99ad607fe6f2beaf68ef286319f9732))
- update GitHub API URL for fetching latest release version ([ef22202](https://github.com/PVAS-Development/whisperdesk/commit/ef22202cf38fe5dc0bde2ff63f504dccb550c8ea))
- update icon and screenshot assets, enhance AppHeader with new logo ([fde6c33](https://github.com/PVAS-Development/whisperdesk/commit/fde6c33b0718469ba56d5e0696e3cb372b76efb0))
- update repository URLs to reflect new ownership ([757bfa7](https://github.com/PVAS-Development/whisperdesk/commit/757bfa72e2bfcb9814072ac39099eb4c2fb6eea5))
- update styles for improved UI consistency and transitions across components ([6090387](https://github.com/PVAS-Development/whisperdesk/commit/6090387c8075ebcce79cf9dc920b3d259848de64))

## [1.1.6](https://github.com/pedrovsiqueira/whisperdesk/compare/v1.1.5...v1.1.6) (2025-12-02)

### 🐛 Bug Fixes

- set timeout for macOS Electron build step to 60 minutes ([e2cbac5](https://github.com/pedrovsiqueira/whisperdesk/commit/e2cbac5cc2d103f4b7ebe416e8ea216f4fbda934))

## [1.1.5](https://github.com/pedrovsiqueira/whisperdesk/compare/v1.1.4...v1.1.5) (2025-12-02)

### 🐛 Bug Fixes

- improve wording in README for drag and drop feature ([db592c2](https://github.com/pedrovsiqueira/whisperdesk/commit/db592c221346c123e2166b77dbd3cf9b6b390724))

## [1.1.4](https://github.com/pedrovsiqueira/whisperdesk/compare/v1.1.3...v1.1.4) (2025-12-02)

### 🐛 Bug Fixes

- enhance CI workflows with caching and environment variables ([#24](https://github.com/pedrovsiqueira/whisperdesk/issues/24)) ([5b11369](https://github.com/pedrovsiqueira/whisperdesk/commit/5b113691c9e292e9e3049b02882d04f683e0816d))

## [1.1.3](https://github.com/pedrovsiqueira/whisperdesk/compare/v1.1.2...v1.1.3) (2025-12-02)

### 🐛 Bug Fixes

- format entitlements.mac.plist for consistency ([d3512f2](https://github.com/pedrovsiqueira/whisperdesk/commit/d3512f2b77911f88d1c8de9e118452ee09afbdba))

## [1.1.2](https://github.com/pedrovsiqueira/whisperdesk/compare/v1.1.1...v1.1.2) (2025-12-02)

### 🐛 Bug Fixes

- update .gitignore to include entitlements.mac.plist and add entitlements file for code signing ([778e4f2](https://github.com/pedrovsiqueira/whisperdesk/commit/778e4f2dada7ab9459e6f05e97d7aeb56493c2f3))

## [1.1.1](https://github.com/pedrovsiqueira/whisperdesk/compare/v1.1.0...v1.1.1) (2025-12-02)

### 🐛 Bug Fixes

- add security section to README highlighting local processing and code signing ([169579d](https://github.com/pedrovsiqueira/whisperdesk/commit/169579d2687e72be55c396d11c710a01af430207))

## [1.1.0](https://github.com/pedrovsiqueira/whisperdesk/compare/v1.0.2...v1.1.0) (2025-12-02)

### ✨ Features

- refactor electron architecture ([#19](https://github.com/pedrovsiqueira/whisperdesk/issues/19)) ([1c9d7eb](https://github.com/pedrovsiqueira/whisperdesk/commit/1c9d7eb5dc1060419c85f83b6d9117c9ab898cfa))

## [1.0.2](https://github.com/pedrovsiqueira/whisperdesk/compare/v1.0.1...v1.0.2) (2025-12-01)

### 🐛 Bug Fixes

- enforce required version input for deployment and update package.json versioning ([7ae3db0](https://github.com/pedrovsiqueira/whisperdesk/commit/7ae3db0c203c4d44d598406fa22efba74b980bd8))

## [1.0.1](https://github.com/pedrovsiqueira/whisperdesk/compare/v1.0.0...v1.0.1) (2025-12-01)

### 🐛 Bug Fixes

- update latest release tag retrieval to exclude pre-releases ([c4693a9](https://github.com/pedrovsiqueira/whisperdesk/commit/c4693a958bf91183813422d64094a851c4c78f69))

## 1.0.0 (2025-12-01)

### ✨ Features

- add .DEVELOPMENT_PLAN.md to .gitignore ([f1546c0](https://github.com/pedrovsiqueira/whisperdesk/commit/f1546c0f8e174c0c4ccabd7284c2516a82226270))
- Add changelog generation and update release process ([fae312e](https://github.com/pedrovsiqueira/whisperdesk/commit/fae312e5c732468bf1b7dfb8c4b269e4c26fcaf4))
- add CODEOWNERS file and Copilot review workflow ([f5a821e](https://github.com/pedrovsiqueira/whisperdesk/commit/f5a821e7d65256647dad84f6a907d0921f16f890))
- add file removal functionality and display supported formats in FileDropZone ([5ed7f5e](https://github.com/pedrovsiqueira/whisperdesk/commit/5ed7f5e594d50bad612e7014afbda6ac1dddd1c2))
- add file validation for supported formats in FileDropZone ([ed77b84](https://github.com/pedrovsiqueira/whisperdesk/commit/ed77b8406f57a12200dd64cc0102d71def8251db))
- Add GitHub Actions workflow for building and releasing macOS artifacts ([e9a92d2](https://github.com/pedrovsiqueira/whisperdesk/commit/e9a92d2812b67a3cb1537266e46e7944d29fda7d))
- Add release script for version bumping and tagging ([d272ccf](https://github.com/pedrovsiqueira/whisperdesk/commit/d272ccf1373aed0a041325016a6970bafd5709b1))
- Bump version to 1.0.2 in package.json ([e9f85b3](https://github.com/pedrovsiqueira/whisperdesk/commit/e9f85b3589bd6c947e8a71a6540026311b688f58))
- Complete development phases for React UI components, core functionality, and model management ([262b530](https://github.com/pedrovsiqueira/whisperdesk/commit/262b53027ac8b5dcc841e1f9d7acf8d271512b1d))
- complete Phase 3 and Phase 4 of transcription app development ([f08017f](https://github.com/pedrovsiqueira/whisperdesk/commit/f08017feae1634b3544f6709677155ba7f05206e))
- Complete Phase 8 of transcription app development with menu integration, error handling, and accessibility improvements ([9c63701](https://github.com/pedrovsiqueira/whisperdesk/commit/9c6370108977501da5a861147eedca388dfdc878))
- Enhance FFmpeg detection and update PATH handling in transcription process ([1031fe8](https://github.com/pedrovsiqueira/whisperdesk/commit/1031fe82d4c6ea6c64c9dbd9c1e5e551873e4b48))
- Enhance Python integration and icon generation ([f8e040f](https://github.com/pedrovsiqueira/whisperdesk/commit/f8e040f14929a2ef5567c2473f2af893f91f6472))
- Implement auto-updater with notification UI and update handling ([c726254](https://github.com/pedrovsiqueira/whisperdesk/commit/c726254bfc1b6d4305307eeed0d7253ffba5f3f1))
- implement graceful cancellation handling for transcription process ([bb1e953](https://github.com/pedrovsiqueira/whisperdesk/commit/bb1e9531ee654057a26dd486a4a074c0ceb62dea))
- implement search functionality in OutputDisplay and enhance TranscriptionHistory item selection ([b6c69df](https://github.com/pedrovsiqueira/whisperdesk/commit/b6c69dff7a5983966c3202ebcdcbf48f394b32ba))
- Implement theme toggle, enhance UI styles, and improve context menu functionality ([5c4b4f9](https://github.com/pedrovsiqueira/whisperdesk/commit/5c4b4f998d50414c2e0822261526666243d1252d))
- Include package-lock.json in release commits ([9f67d43](https://github.com/pedrovsiqueira/whisperdesk/commit/9f67d43088483c76626308251220a8f185b629e5))
- initialize WhisperDesk transcription app with Electron and React ([98ef5c6](https://github.com/pedrovsiqueira/whisperdesk/commit/98ef5c67ac9c1fa0dcb1fdbf84207315ef7f13ae))
- migrate from OpenAI Whisper to whisper.cpp integration ([6d9c606](https://github.com/pedrovsiqueira/whisperdesk/commit/6d9c6064d8ad5dbcdc5d20b143de13bb8f8d0be2))
- refactor application structure with context and layout components ([d1fcbb9](https://github.com/pedrovsiqueira/whisperdesk/commit/d1fcbb9f225caa0216a0dfb6ba0f638a91cffc30))
- Refactor output format handling and enhance save functionality in OutputDisplay component ([3bd43ab](https://github.com/pedrovsiqueira/whisperdesk/commit/3bd43ab15e22b2f6d4138561df58e0155341c49d))
- remove CODEOWNERS file and update documentation ([dca7d8a](https://github.com/pedrovsiqueira/whisperdesk/commit/dca7d8a7b477f48047c93bc2312310e1d55008f3))
- **transcription:** update the overall structure of the application ([55824df](https://github.com/pedrovsiqueira/whisperdesk/commit/55824df0b782de718fa4f54b8022be7d672ffa8f))
- update version to 1.0.0 and remove version bump scripts ([5bd0df9](https://github.com/pedrovsiqueira/whisperdesk/commit/5bd0df93294b038ae7bcde306189b70a628bc476))
- Update version to 1.0.1 and add version bumping script ([9beba57](https://github.com/pedrovsiqueira/whisperdesk/commit/9beba575f8708749ad8e04d003aef23111858008))

### 🐛 Bug Fixes

- add build step for universal binary of whisper.cpp in deployment workflow ([#17](https://github.com/pedrovsiqueira/whisperdesk/issues/17)) ([cffec12](https://github.com/pedrovsiqueira/whisperdesk/commit/cffec12230ff7cb1ac16b33d656f0019d36719ec))
- automate version bump in package.json during release deployment ([225b88c](https://github.com/pedrovsiqueira/whisperdesk/commit/225b88c0479c695465ff91c7fab1c9f2b372b932))
- convert generate-icons.js to ES modules ([#6](https://github.com/pedrovsiqueira/whisperdesk/issues/6)) ([67afa1b](https://github.com/pedrovsiqueira/whisperdesk/commit/67afa1b4767c61bd1eb0610f8623c7c5a766f537))
- correct entry for DEVELOPMENT_PLAN.md in .gitignore ([83b3692](https://github.com/pedrovsiqueira/whisperdesk/commit/83b36925f70266f36525659cae265bcb1a8379fc))
- enhance setup script to support universal binary builds for whisper.cpp ([7f0b51d](https://github.com/pedrovsiqueira/whisperdesk/commit/7f0b51d0b050f61b254344088e781bf37be4b974))
- enhance setup scripts for universal binary support and update README ([#13](https://github.com/pedrovsiqueira/whisperdesk/issues/13)) ([b7a5e46](https://github.com/pedrovsiqueira/whisperdesk/commit/b7a5e461f6e63a890832863845f9e643a2242c4e))
- include additional directories in package files list ([#10](https://github.com/pedrovsiqueira/whisperdesk/issues/10)) ([1a19bdd](https://github.com/pedrovsiqueira/whisperdesk/commit/1a19bdd468da4c53dc4fcaa6ef6b5ceea009f22f))
- include binary files in the package distribution ([49e0730](https://github.com/pedrovsiqueira/whisperdesk/commit/49e0730617f8f46b64d68acf70d8fd2ce0280857))
- revert version to 1.0.0 in package-lock.json ([2d634f5](https://github.com/pedrovsiqueira/whisperdesk/commit/2d634f56b443c03f93b6d90794b800845ee1e183))
- revert version to 1.0.0 in package.json ([0d623aa](https://github.com/pedrovsiqueira/whisperdesk/commit/0d623aa5952809f50b9ac2c453fe2b496f7d0b33))
- simplify setup script for building whisper.cpp with Metal support ([3957c26](https://github.com/pedrovsiqueira/whisperdesk/commit/3957c261e9a2fe77c2151853ad70b5cdc7321a9b))
- update deploy script to include package-lock.json in version check ([f1966a1](https://github.com/pedrovsiqueira/whisperdesk/commit/f1966a132def4eafbd7f3001a9ec30cc8ecd1f3b))
- update deploy workflow to allow latest version deployment and improve version resolution ([dea8793](https://github.com/pedrovsiqueira/whisperdesk/commit/dea8793d6e602b70ee5c0956d87225e5e53ba7c1))
- update output formats in README to include Word, PDF, and Markdown options ([#16](https://github.com/pedrovsiqueira/whisperdesk/issues/16)) ([187022d](https://github.com/pedrovsiqueira/whisperdesk/commit/187022d16edd74cc8314d88b535660ec7adc649b))
- update tsconfig to include additional component paths ([#12](https://github.com/pedrovsiqueira/whisperdesk/issues/12)) ([605ac82](https://github.com/pedrovsiqueira/whisperdesk/commit/605ac82962ef6633abdb5444a6542ae4cf602afb))

# Changelog

All notable changes to WhisperDesk will be documented in this file.

This project uses [Semantic Versioning](https://semver.org/) and is automatically generated by [semantic-release](https://semantic-release.gitbook.io/).
