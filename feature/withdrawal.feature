    Scenario Outline: Attempt to withdrawal ckb over max amout
        Given I have "1000" CKB in Godwoken L2
        When I typed "2000" to From
        Then I Click "Withdrawal" button
        And I should see "Godwoken balance 1,000 is less than 2,000" error message
    Scenario Outline: Attempt to withdrawal ckb and sudt over max amout
        Given I have assets in Godwoken L2
            | asset | amount |
            | CKB   | 1000   |
            | USDC  | 1000   |
        When I typed "2000" to ckb input
        Then I typed "2000" to sudt input
        Then I Click "Withdrawal" button
        And I should see "Godwoken balance 1,000 is less than 2,000" error message
    Scenario Outline: Attempt to withdrawal sudt over max amout(faild now)
        Given I have assets in Godwoken L2
            | asset | amount |
            | CKB   | 1000   |
            | USDC  | 1000   |
        When I typed "400" to ckb input
        Then I typed "2000" to sudt input
        Then I Click "Withdrawal" button
        And I should see "Godwoken balance 1,000 is less than 2,000" error message
    Scenario Outline: should close modal and show error if cancal sign transaction
        Given I have assets in Godwoken L2
            | asset | amount |
            | CKB   | 1000   |
            | USDC  | 1000   |
        When I typed "400" to ckb input
        Then I typed "200" to sudt input
        Then I Click "Withdrawal" button
        And I should see MetaMask ask me to sign transaction
        When I click "cancal" to cancal sign this transaction
        And I should see MetaMask modal close
        And "confirm requeset" modal close
        And I should see "transaction need to be sign first" error message

