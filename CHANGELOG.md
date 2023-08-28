# [Changelog](https://keepachangelog.com/en/1.0.0/)

# 0.4.5 (2023-08-22)
- Update block_interval_seconds of Godwoken mainnet_v1 ([#320](https://github.com/godwokenrises/light-godwoken/pull/320))

# 0.4.4 (2023-06-21)
### Bug Fixes
- update readme file and godwoken bridge script for development([#308](https://github.com/godwokenrises/light-godwoken/commit/1d347d2e3c7af53efa5597606d84ea4f3523d35f))(@lee920217)
- Fix multi pending list problem ([#311](https://github.com/godwokenrises/light-godwoken/pull/311))(@lee920217)

# 0.4.3 (2023-05-12)
### Bug Fixes
- Fix the status of a long time l2Pending withdrawal ([#300](https://github.com/godwokenrises/light-godwoken/pull/300)) (@Flouse)
- https.Agent is not a constructor ([#301](https://github.com/godwokenrises/light-godwoken/pull/301)) (@classicalliu)
- Remove outdated failed withdrawals ([#304](https://github.com/godwokenrises/light-godwoken/pull/304)) (@ShookLyngs)

# 0.4.2 (2023-04-17)
### Features
- Refactor the Withdrawal Pending List ([#280](https://github.com/godwokenrises/light-godwoken/pull/280)) (@GitOfJason)
- refactor: migrate create-react to vite ([#289](https://github.com/godwokenrises/light-godwoken/pull/289)) (@frmachao)

# 0.4.1 (2023-02-27)
### Godwoken Bridge
- Refactor UI/UX for network mismatch notification by @GitOfJason in https://github.com/godwokenrises/light-godwoken/pull/273


# 0.4.0 (2023-02-15)

### Breaking Changes
- Migration of ckb-lumos to 0.20.0 ([#251](https://github.com/godwokenrises/light-godwoken/pull/251)) (@ShookLyngs)
  > The light-godwoken sdk used to use a relatively old version of ckb-lumos, later versions of ckb-lumos contain some breaking changes. To migrate to ckb-lumos version 0.20.0, we also had to refactor some structures of the sdk. The migration also fixes issues caused by breaking changes to the `CkbIndexer.tip()` method. Please check on the PR if you want to know more details about the changes.

### Bug Fixes
- Fix the display of fast withdrawal time ([#246](https://github.com/godwokenrises/light-godwoken/pull/246)) (@ShookLyngs)
- Fix z-index conflict of tooltips and modals ([#258](https://github.com/godwokenrises/light-godwoken/pull/258)) (@GitOfJason)
- Fix the open/close state of withdrawal confirmation modal ([#259](https://github.com/godwokenrises/light-godwoken/pull/259)) (@GitOfJason)
- Fix the issue of no prompt when triggering a double spend error ([#266](https://github.com/godwokenrises/light-godwoken/pull/266)) (@GitOfJason)

### Features
- Optimize page style ([#253](https://github.com/godwokenrises/light-godwoken/pull/253)) (@ShookLyngs)
- Optimize MetaMask install tips ([#256](https://github.com/godwokenrises/light-godwoken/pull/256)) (@miaosun009)
- Network switching strategy adjustment ([#260](https://github.com/godwokenrises/light-godwoken/pull/260)) (GitOfJason)
- Adds the link of Godwoken NFT Bridge (Beta) to header ([#261](https://github.com/godwokenrises/light-godwoken/pull/261)) (@ShookLyngs)


# 0.3.3 (2022-12-27)

### Bug Fixes
- Fix the display of fast withdrawal time ([#246](https://github.com/godwokenrises/light-godwoken/pull/246))

### Features
- Improve the display logic of pending withdrawals  ([#240](https://github.com/godwokenrises/light-godwoken/pull/240))
  > Previously, pending v1 withdrawals were not properly displayed while waiting to be unlocked. Now added the logic: when a withdrawal's time is up, it will show a loading indicator instead of "00:00". Also, to improve user experience, I added an interval which reloads the v1 pending withdrawal list every 60 seconds.

- Watch network changes ([#241](https://github.com/godwokenrises/light-godwoken/pull/241))
  > Now Godwoken Bridge can detect if the current network has changed.


# 0.3.2 (2022-12-1)

### Bug Fixes
- Fix ckb faucet display logic on mainnet ([#232](https://github.com/godwokenrises/light-godwoken/pull/232))

### Features
- Update block produce time on v1 networks ([#231](https://github.com/godwokenrises/light-godwoken/pull/231))
  > We have updated the average block produce time on Godwoken Bridge so the estimated withdrawal time left is displayed more accurately. Thanks to @alejandroRbit for the suggestion.

- Support dotbit forward/reverse search features ([#234](https://github.com/godwokenrises/light-godwoken/pull/234))
  > Dotbit is now supported by Godwoken Bridge. You can check your dotbit alias on Godwoken Bridge. And when l1-transferring, you can enter the recipient's dotbit account and select an address to transfer assets instead of copying and pasting a CKB address.


# 0.3.1 (2022-11-10)

### Bug Fixes
- Fix misplaced UAN of dCKB and YOK ([#224](https://github.com/godwokenrises/light-godwoken/pull/224)) 
- Fix l1-transfer status update logic and ckb balance validation issues ([#228](https://github.com/godwokenrises/light-godwoken/pull/228))  

### Features
- Improve styles of Header/Footer/Body ([#221](https://github.com/godwokenrises/light-godwoken/pull/221))
  > We've added some official links into the menu popover, including GitHub and our Godwoken Docs.
  > In addition, the layout style of Godwoken Bridge has also been beautified.

- Add `waitForCompletion` option to deposit/withdraw functions ([#222](https://github.com/godwokenrises/light-godwoken/pull/222))
  > This feature gives developers an option to avoid listen to the final result of the deposit/withdrawal.
  > For more details, please visit: [Feat: add waitForCompletion to deposit/withdraw](https://github.com/godwokenrises/light-godwoken/pull/222).


# 0.3.0 (2022-11-01)

### Bug Fixes
-Fix ckb validation in withdrawal_v1 route ([#195](https://github.com/godwokenrises/light-godwoken/issues/195))

### Features
- Support unlocking legacy withdrawal cells from Godwoken_v0 ([#200](https://github.com/godwokenrises/light-godwoken/pull/200))
  > This feature provides a convenient function for users to unlock legacy(v0) withdrawal cells through https://bridge.godwoken.io/#/v0/withdrawal/pending
  > [What is legacy withdrawal cells (v0)?](https://github.com/godwokenrises/godwoken/blob/develop/docs/deposit_and_withdrawal.md#legacy-withdrawal-cells-v0)

- Support layer1-transfer ([#210](https://github.com/godwokenrises/light-godwoken/pull/210))
  > This feature provides a handy function for users to send CKB to their CEX or wallet or other L1 addresses through Godwoken Bridge. It helps users to transfer the extra CKB inside a sUDT cell (usually a withdrawal cell), a tool that was missing in Nervos ecosystem.
  > Thanks @alejandroRbit for [the feature request](https://github.com/godwokenrises/light-godwoken/issues/189).

- Replace testnet_v1 tokens with Goerli tokens ([#208](https://github.com/godwokenrises/light-godwoken/pull/208))
- Add token logo for "COOP" ([#212](https://github.com/godwokenrises/light-godwoken/pull/212))


# 0.2.0 (2022-10-09)

### Bug Fixes
- Token logo for "YOK" and "TAI" ([#178](https://github.com/nervosnetwork/light-godwoken/issues/178))
- Testnet_v0 is officially deprecated ([#184](https://github.com/nervosnetwork/light-godwoken/issues/184))
- Withdrawal history list might need pagination ([#190](https://github.com/nervosnetwork/light-godwoken/issues/190))
- Deposit/Withdraw canceling signature in metamask prompts unknown error ([#192](https://github.com/nervosnetwork/light-godwoken/issues/192))

### Features
- Replace LightGodwokenConfigMap with LightGodwokenConfig ([f89547d](https://github.com/nervosnetwork/light-godwoken/commits/f89547df037cd6eebe04330ec23edb36db44a47c))
- Make predefined tokens customizable ([ff4ec424](https://github.com/nervosnetwork/light-godwoken/commits/ff4ec4246d73611a079f7c899453089c8fe54ae7))
- L1-deposit-address and display QRCode for addresses ([eea43ae](https://github.com/nervosnetwork/light-godwoken/commit/eea43aef0fd6a725a90978ceeb4d9d962e4adfcd))
