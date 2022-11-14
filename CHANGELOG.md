# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.


# 0.3.1 (2022-11-10)

### Bug Fixes
* Fix misplaced UAN of dCKB and YOK ([#224](https://github.com/godwokenrises/light-godwoken/pull/224)) 
* Fix l1-transfer status update logic and ckb balance validation issues ([#228](https://github.com/godwokenrises/light-godwoken/pull/228))  

### Features
* Improve styles of Header/Footer/Body ([#221](https://github.com/godwokenrises/light-godwoken/pull/221))
> We've added some official links into the menu popover, including GitHub and our Godwoken Docs.
> In addition, the layout style of Godwoken Bridge has also been beautified.

* Add `waitForCompletion` option to deposit/withdraw functions ([#222](https://github.com/godwokenrises/light-godwoken/pull/222))
> This feature gives developers an option to avoid listen to the final result of the deposit/withdrawal.
> For more details, please visit: [Feat: add waitForCompletion to deposit/withdraw](https://github.com/godwokenrises/light-godwoken/pull/222).


# 0.3.0 (2022-11-01)

### Bug Fixes
* Fix ckb validation in withdrawal_v1 route ([#195](https://github.com/godwokenrises/light-godwoken/issues/195))

### Features
* Support unlocking legacy withdrawal cells from Godwoken_v0 ([#200](https://github.com/godwokenrises/light-godwoken/pull/200))
> This feature provides a convenient function for users to unlock legacy(v0) withdrawal cells through https://bridge.godwoken.io/#/v0/withdrawal/pending
> [What is legacy withdrawal cells (v0)?](https://github.com/godwokenrises/godwoken/blob/develop/docs/deposit_and_withdrawal.md#legacy-withdrawal-cells-v0)

* Support layer1-transfer ([#210](https://github.com/godwokenrises/light-godwoken/pull/210))
> This feature provides a handy function for users to send CKB to their CEX or wallet or other L1 addresses through Godwoken Bridge. It helps users to transfer the extra CKB inside a sUDT cell (usually a withdrawal cell), a tool that was missing in Nervos ecosystem.
> Thanks @alejandroRbit for [the feature request](https://github.com/godwokenrises/light-godwoken/issues/189).

* Replace testnet_v1 tokens with Goerli tokens ([#208](https://github.com/godwokenrises/light-godwoken/pull/208))
* Add token logo for "COOP" ([#212](https://github.com/godwokenrises/light-godwoken/pull/212))


# 0.2.0 (2022-10-09)

### Bug Fixes
* Token logo for "YOK" and "TAI" ([#178](https://github.com/nervosnetwork/light-godwoken/issues/178))
* Testnet_v0 is officially deprecated ([#184](https://github.com/nervosnetwork/light-godwoken/issues/184))
* Withdrawal history list might need pagination ([#190](https://github.com/nervosnetwork/light-godwoken/issues/190))
* Deposit/Withdraw canceling signature in metamask prompts unknown error ([#192](https://github.com/nervosnetwork/light-godwoken/issues/192))

### Features
* Replace LightGodwokenConfigMap with LightGodwokenConfig ([f89547d](https://github.com/nervosnetwork/light-godwoken/commits/f89547df037cd6eebe04330ec23edb36db44a47c))
* Make predefined tokens customizable ([ff4ec424](https://github.com/nervosnetwork/light-godwoken/commits/ff4ec4246d73611a079f7c899453089c8fe54ae7))
* L1-deposit-address and display QRCode for addresses ([eea43ae](https://github.com/nervosnetwork/light-godwoken/commit/eea43aef0fd6a725a90978ceeb4d9d962e4adfcd))
