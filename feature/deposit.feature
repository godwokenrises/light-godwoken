Feature: Deposite From L1 to L2

    Background:
        Given I am on the "Deposit" page
        And I have connected the "Alice" account into MetaMask:
            | name  | pk                                                                 | address_eth                                | address_ckb                                                                                     |
            | Alice | 0x1111111111111111111111111111111111111111111111111111111111111111 | 0xFeE2F3b8597B67C57dA0AFA943B15d5eabBBa2B4 | ckt1q3vvtay34wndv9nckl8hah6fzzcltcqwcrx79apwp2a5lkd07fdx8lhz7wu9j7m8c476ptafgwc46h4thw3tg8cyspx |
        And "Alice" holding the L1 assets:
            | asset | amount |
            | CKB   | 10000  |
            | USDC  | 1000   |
        And "Alice" holding the L2 assets:
            | asset | amount |
            | CKB   | 0      |

    Scenario: deposit max CKB amount
        Given I was in deposit page
        When I press the "Max" button on CKB input
        Then I should see the ckb input:
            | asset | amount |
            | CKB   | 9936   |
        And I should see "Deposit" button clickable

        When I press the "Deposit" button
        Then MetaMask should pop up a window ask me to sigh ckb transaction

        When I click "Confirm" in MetaMask popup
        Then MetaMask should be closed
        And I should see the "Deposit transaction send" tip with a transaction id

        When I wait for a faw mins and refresh page
        Then I can see "Alice" L1 and L2 ckb balance changed
        And "Alice" holding the L1 assets:
            | asset | amount |
            | CKB   | 64     |
            | USDC  | 1000   |
        And "Alice" holding the L2 assets:
            | asset | amount |
            | CKB   | 9936   |

    Scenario: deposit max SUDT amount
        Given I was in deposit page
        When I input 400 in CKB input
        Then I should see the ckb input:
            | asset | amount |
            | CKB   | 400    |
        And I should see "Deposit" button clickable

        When I click the "select a currency" button
        Then I should see a modal:
            | asset | amount |
            | USDC  | 1000   |

        When I press the "USDC" button
        Then I should see the modal closed
        And I should see SUDT input shows selected SUDT and balance:
            | asset | amount |
            | USDC  | 1000   |
        And I should see "Max" button on SUDT input

        When I press the "Max" button
        Then I can see "1000" sudt input

        When I press the "Deposit" button
        Then MetaMask should pop up a window ask me to sigh ckb transaction

        When I click "Confirm" in MetaMask popup
        Then MetaMask should be closed
        And I should see the "Deposit transaction send" tip with a transaction id

        When I wait for a faw mins and refresh page
        Then I can see "Alice" L1 and L2 ckb balance changed
        And "Alice" holding the L1 assets:
            | asset | amount |
            | CKB   | 9600   |
            | USDC  | 0      |
        And "Alice" holding the L2 assets:
            | asset | amount |
            | CKB   | 400    |
            | USDC  | 1000   |

    Scenario Outline: Attempt to deposit ckb over deposit max amout
        Given I have "1000" CKB
        When I typed "1000" to From
        Then I Click "Deposit" button
        And I should see "Deposit" button disabled

    Scenario Outline: Attempt to deposit sudt over deposit max amout
        Given I have "1000" USDC
        When I typed "2000" to From
        Then I Click "Deposit" button
        And I should see "Deposit" button disabled

    Scenario Outline: Attempt to deposit ckb and sudt over deposit max amout
        Given I have assets
            | asset | amount |
            | CKB   | 1000   |
            | USDC  | 1000   |
        When I typed "2000" to ckb input
        Then I typed "2000" to sudt input
        Then I Click "Deposit" button
        And I should see "Deposit" button disabled