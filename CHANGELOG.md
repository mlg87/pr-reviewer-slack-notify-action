## [4.8.0](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v4.7.0...v4.8.0) (2022-03-29)


### ⚠ BREAKING CHANGES

* **engineer github <=> slack mapping:** slack-users input deprecated; must now provide a JSON file from s3

### Features

* **engineer github <=> slack mapping:** change where the action is looking for reviewers ([185fb45](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/185fb45d500e49ce04227ba0936ffcda84e79fc0))

## [4.7.0](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v4.6.0...v4.7.0) (2022-03-28)


### ⚠ BREAKING CHANGES

* **release:** hopefully this works

### Features

* **release:** hopefully trigger breaking release ([db22393](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/db2239372bb68729e9456d73f693ecd6740b0cf6))

## [4.6.0](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v4.5.5...v4.6.0) (2022-03-28)


### ⚠ BREAKING CHANGES

* **reviewer mapping:** slack-users input no longer valid, must provide AWS inputs and creds

### Features

* **reviewer mapping:** change where the action is looking for reviewers ([97f9887](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/97f988794ddc6df7b5f878362577eda70d350682))

### [4.5.5](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v4.5.4...v4.5.5) (2021-12-16)


### Bug Fixes

* more "error" handling ([1f604fb](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/1f604fb829665920793f11a0f51fdd16bc5f152f))

### [4.5.4](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v4.5.3...v4.5.4) (2021-12-16)


### Bug Fixes

* throw error when getInitialMessage called without correct params ([36b0c7c](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/36b0c7cffbae5efb5c20bea405599ca44356914d))

### [4.5.3](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v4.5.2...v4.5.3) (2021-12-16)


### Bug Fixes

* slackMessageId was being called wihtout required params ([463eb19](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/463eb191f8cef764c3291106b70ece99f3373eb8))

### [4.5.2](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v4.5.1...v4.5.2) (2021-12-09)


### Bug Fixes

* module not found error ([bfe6843](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/bfe684303e3c62d917f9ed6f4908a162755082d4))

### [4.5.1](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v4.5.0...v4.5.1) (2021-12-08)


### Bug Fixes

* allow errors to fail silently ([d2ef9aa](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/d2ef9aabc3872d885241561a08981e3c7790cd46))

## [4.5.0](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v4.4.0...v4.5.0) (2021-03-31)


### Features

* **slack-thread-creation:** if a thread cannot be found, create one ([0b8e20c](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/0b8e20ca8446a68e6707ad2a6ad5306c130cf111))

## [4.4.0](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v4.3.0...v4.4.0) (2021-03-26)


### Bug Fixes

* **config:** allow quiet configuration ([e0f955a](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/e0f955ace6a619e7946243c8df01fa4492f8f9e4))


### Features

* **quiet-mode:** allow for quiet mode with configuration ([adbe8fd](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/adbe8fdfc6ed52955302ae5ac37a42899a72cade))

## [4.3.0](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v4.2.0...v4.3.0) (2021-03-24)


### Features

* allow quiet ([dff2b14](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/dff2b14540d4c475df8be9e274c52dafd923d8a1))

## [4.2.0](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v4.1.5...v4.2.0) (2021-03-23)


### Build System

* upgrade deps ([d29496a](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/d29496a14cae1df34f757269934362e87603d5ce))

### [4.1.5](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v4.1.4...v4.1.5) (2021-03-23)


### CI

* add missing variable ([fc51d8c](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/fc51d8ca1ba2388801bda8b3e38008ba71b87102))
* put correct repo url in release config ([210c75d](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/210c75d0830c3045c219983f21e6af06d810a498))
* set up ci ([4dac148](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/4dac14804d1aec2bf63f979ba268b49f3852dee1))