## [8.2.1](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v8.2.0...v8.2.1) (2025-07-08)


### Bug Fixes

* prevent action from failing when label-for-initial-notification is missing ([5a4a26a](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/5a4a26a3750aea9c0afb1f8d18af63e81638a733))

## [8.2.0](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v8.1.0...v8.2.0) (2025-07-08)


### Features

* add label-for-initial-notification input to control when notifications are sent ([d787afb](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/d787afba7ee0a37f1f21eced325372463fb048d3))

## [8.1.0](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v8.0.0...v8.1.0) (2025-07-08)


### Build System

* **deps:** bump braces from 3.0.2 to 3.0.3 ([8f6d2cb](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/8f6d2cbc17ca4ecfa21272cbb0f4e5d45dc86f2d))

## [8.0.0](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v7.8.1...v8.0.0) (2024-05-11)


### ⚠ BREAKING CHANGES

* **npm:** node
* **npm:** node 20

### Bug Fixes

* **team-requested-reviewers:** attempt to clean up getRequestedReviewersAsIndividuals ([3970fdd](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/3970fddfcc749801a0d7a960652ae62a96f5a7e2))
* **logger:** fix incorrect import of formatISO ([20245d2](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/20245d2902611d919cd17111685e5bb5dc64c5ef))


### Build System

* **npm:** bREAKING npm deps to latest, node to 20.13.1, release workflow updated ([b57b6a9](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/b57b6a9a833df6f5a95a239b2c425b89441d52ec)), closes [#63](https://github.com/mlg87/pr-reviewer-slack-notify-action/issues/63)
* **npm:** set conventional-changelog-conventionalcommits to 7.0.2 ([1cd64e9](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/1cd64e96958674c9b5d7b38ebf505f1c35a7f671)), closes [/github.com/semantic-release/release-notes-generator/issues/633#issuecomment-2100094407](https://github.com/mlg87//github.com/semantic-release/release-notes-generator/issues/633/issues/issuecomment-2100094407)
* **npm:** update npm deps, node to 20 ([b170fd2](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/b170fd27d1af4e3e0f23f929e2ce25926b2f46f1)), closes [#63](https://github.com/mlg87/pr-reviewer-slack-notify-action/issues/63)
* **npm:** updates yarn.lock ([4ee76d4](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/4ee76d4be77208f162a51548d128c79c31ffbd1e))

### [7.8.1](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v7.8.0...v7.8.1) (2023-05-10)


### Bug Fixes

* **pr review dismiss:** pull action from payload ([b513e2f](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/b513e2f4a323c0d2c619c484a4a64c8a31746162))

## [7.8.0](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v7.7.0...v7.8.0) (2023-05-10)


### Features

* **run:** add handler for pr review dismissals ([fbcc4bf](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/fbcc4bf52f5238f627f6ed784c83747bb9deacc9))

## [7.7.0](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v7.6.0...v7.7.0) (2023-02-10)


### Build System

* **deps:** bump npm from 8.8.0 to 8.12.0 ([8110d13](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/8110d135662f77f29bb9309aa5f8c023f47599b8))

## [7.6.0](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v7.5.1...v7.6.0) (2022-10-20)


### Features

* add verbose mode option to minimize slack notification size ([#51](https://github.com/mlg87/pr-reviewer-slack-notify-action/issues/51)) ([f19b20f](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/f19b20fcad711393f2050a56ef67f181aa7827bc))

### [7.5.1](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v7.5.0...v7.5.1) (2022-05-19)


### Bug Fixes

* **retrieving the pr:** should handle all scenarios now ([37c94a2](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/37c94a2824053cfb6dc71628c3bf27d4f5bf74fc))

## [7.5.0](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v7.4.5...v7.5.0) (2022-05-19)


### Bug Fixes

* fix createInitiialMessage for action === "opened" ([0cc0a98](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/0cc0a98dc89c08b9c3d79482fd2070b6e1b9d7f6))


### Build System

* **ts:** no implicit any, only explicit any here ([7e0ca29](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/7e0ca2995da02f3be85aef6b83aafe4f4a787696))

### [7.4.5](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v7.4.4...v7.4.5) (2022-05-18)


### Bug Fixes

* **slack messages:** ensure there is a pr found when creating the initial message ([cd5cab7](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/cd5cab7ddc8b4045975c10922f26cadaf9939b68))

### [7.4.4](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v7.4.3...v7.4.4) (2022-05-18)


### Bug Fixes

* **initial slack message:** ensure that it is created on push event ([42faa63](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/42faa630bdc5167d17c53087bbd6b1d429b113b1))

### [7.4.3](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v7.4.2...v7.4.3) (2022-05-18)


### Bug Fixes

* await a promise instead of not ([ec828d4](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/ec828d48dbbb65e37fa0b4727f949b7d07e96f4f))

### [7.4.2](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v7.4.1...v7.4.2) (2022-05-18)


### Bug Fixes

* handle pull_request not being on the context.payload ([03df4d7](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/03df4d739f283538eac942c46f7c3941931aec99))

### [7.4.1](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v7.4.0...v7.4.1) (2022-05-18)


### Performance

* **logging:** more logging ([8b5ec42](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/8b5ec42a928e9dc5c71135aefd788b63ec4fd785))

## [7.4.0](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v7.3.2...v7.4.0) (2022-05-18)


### Build System

* **ts:** fix return value for function typed as Promise<void> ([091a50e](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/091a50e119764d587b7089abe26d2532efb955f7))


### Performance

* **logging:** add a logger util (winston) ([0336d1a](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/0336d1a10b201f0ab087427f4c9e220d6eb9b749))

### [7.3.2](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v7.3.1...v7.3.2) (2022-05-18)


### Bug Fixes

* **dependencies:** change github package imports to import * as ___ ([9b5a58b](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/9b5a58b1f8aa2a703e76f5c2356ef266fbdbc4b2))

### [7.3.1](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v7.3.0...v7.3.1) (2022-05-17)


### CI

* **release:** minify output ([a9f6653](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/a9f665399bc96c70c19b42ce639476ff947dfbda))

## [7.3.0](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v7.2.1...v7.3.0) (2022-05-17)


### Build System

* update source map ([a25f0c9](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/a25f0c9240d0e3cf34744485f1e9218ee9719ddf))

### [7.2.1](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v7.2.0...v7.2.1) (2022-05-17)


### Bug Fixes

* **core inputs:** move retrieval of core inputs out of function calls ([8016e87](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/8016e87f02b7c835ba14c501f6928b67e5d3add3))

## [7.2.0](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v7.1.3...v7.2.0) (2022-05-17)


### Build System

* **release:** change source for ncc package step ([98c3f03](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/98c3f033c3f7d32b910e84583fe3c08091d43367))


### CI

* **release:** alksdjflkasjdf ([dc11ed6](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/dc11ed6874ad1e6d20681e1c3bc663feba1aa4e0))
* **release:** change main in pkg.json ([24efd71](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/24efd71a71ca8496e74de900a9b89f6c1bdb916b))
* **release:** comment out compile ts step ([fad9441](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/fad944177820aedec55a16adfc54447a70c8968e))
* **release:** fix path for entry file ([dd73f04](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/dd73f04e147ceb7fdcfa4e6ff2d4064f9732d3e7))
* **release:** force deploy ([32fabbc](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/32fabbc47457b5f94a8bccba291b568976f23b93))
* **release:** remove node_modules ([d5ded39](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/d5ded39cc341c5a737cd6a4e78bd6d5fbcc5e9bf))

### [7.1.3](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v7.1.2...v7.1.3) (2022-05-17)


### CI

* **release:** try more shit ([14625d8](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/14625d8f294641a440effd7a9c33a6da52fe82d0))

### [7.1.2](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v7.1.1...v7.1.2) (2022-05-17)


### CI

* **release:** remove asset param from add-and-commit action step ([48b4ffe](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/48b4ffea71259f017e9ab425734c1c56473753db))

### [7.1.1](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v7.1.0...v7.1.1) (2022-05-17)


### CI

* **release:** try to get add-and-commit action to work ([f24963c](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/f24963cab7f16ceee351ca8e0efff3c4def628be))

## [7.1.0](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v7.0.0...v7.1.0) (2022-05-17)


### Build System

* dont minify bundle ([10512b5](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/10512b546d6e3fdbf27a84b4cd69b49246ad7e8e))

## [7.0.0](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v6.0.0...v7.0.0) (2022-05-17)


### ⚠ BREAKING CHANGES

* **typescript:** JS => TS

### CI

* **release:** add dist dir to assets checked in as part of release action ([d1be2df](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/d1be2dfe5de6e5875461bcedb40b4a1d096ed347))
* **release:** package and commit the minified action prior to cutting release in ci ([f4339cf](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/f4339cf9641aee43e4466d7594c13801faa0251c))


### Refactors

* **typescript:** converts app to typescript ([152520d](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/152520d1787981bdac2689f449287617b631cfb4))

## [6.0.0](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v5.0.3...v6.0.0) (2022-05-03)


### ⚠ BREAKING CHANGES

* **node_modules:** all of the deps have been blindly upgraded

### Build System

* **node_modules:** upgrade more or less all deps ([2142e24](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/2142e24d5bf18ccff37395c75d9e6dcd0f32ba80))


### CI

* **node version:** fix the node version to 16.15.0 for ci ([766c887](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/766c88718bc10cd90a6aadf1ffd02a4c3ceecd2b))

### [5.0.3](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v5.0.2...v5.0.3) (2022-05-03)


### Bug Fixes

* **slack:** make sure that the initial slack message is created when it should be ([273b883](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/273b8839481b32e42e37f9d9bb4d680c9ca941f7))


### CI

* upgrade commitizen ([6732888](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/6732888f912f73dbf2f673bd64fb3e3dc8fe1ba2))

### [5.0.2](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v5.0.1...v5.0.2) (2022-03-29)


### Bug Fixes

* **getengineersfroms3:** fix references in code for new JSON expected shape ([1fd9a8d](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/1fd9a8d4c43fd311dbf10a336423f0ed4eb32252))

### [5.0.1](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v5.0.0...v5.0.1) (2022-03-29)


### Refactors

* **logging:** fixing it live in prod ([9d4093d](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/9d4093d2559534d336cfd3225485b36e6b4faabf))

## [5.0.0](https://github.com/mlg87/pr-reviewer-slack-notify-action/compare/v4.8.0...v5.0.0) (2022-03-29)


### ⚠ BREAKING CHANGES

* **engineer github <=> slack mapping:** slack-users input deprecated; must now provide a JSON file from s3

### Features

* **engineer github <=> slack mapping:** change where the action is looking for reviewers ([126a524](https://github.com/mlg87/pr-reviewer-slack-notify-action/commit/126a5248ca78c9c370c69e903a0baa342b97758a))

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
