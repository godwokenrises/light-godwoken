# Light Godwoken

This is a demo for withrawing assets from Godwoken, which is a CKB Layer 2 chain to CKB chain. You will need to have metamask installed to use this demo.

## Quick Start

```sh
yarn install
yarn start
```

## How to withdraw assets

There are two steps withdrawing assets from a layer 2 address to layer 1 address. 

### Step 1. Withdraw from layer 2

The first step is to call `gw_submit_withdrawal_request` RPC method to burn assets on layer 2 chain and in the meantime godwoken creates the assets on layer 1 which can later be unlocked by receiver address. Note that when making such a request you need to provide some info as parameters, such as sender layer 2 address: `account`, receiver layer 1 address: `owner`, ckb amount: `capacity`, sudt amount and script hash(optional): `amount` and `sudtTypeHash`. See this [example](https://github.com/classicalliu/gw-demos/blob/d2780e4c20824796f21a8277ea357dcce34c8e9f/src/withdrawal.ts?_pjax=%23js-repo-pjax-container%2C%20div%5Bitemtype%3D%22http%3A%2F%2Fschema.org%2FSoftwareSourceCode%22%5D%20main%2C%20%5Bdata-pjax-container%5D#L26-L126) for more infomation.  Here is a example of withdrawal request:

```json
{
    "raw": {
        "nonce": "0x2e",
        "capacity": "0x9502f9000", //amount of ckb to withdraw in shannon unit 
        "amount": "0x0",// amount of sUDT to withdraw, default to 0x0 if you don't need to withdraw sUDT
        "sudt_script_hash": "0x0000000000000000000000000000000000000000000000000000000000000000",// l1 sudt script hash, default to all zero if you don't need to withdraw sUDT
        "account_script_hash": "0x1ddfd18bee966192f8e35e8fbaaae93b88c476960754077d039cf1e56c633c22",// withdrawer layer 2 ckb account lock hash, layer 2 address -> layer 2 lock script -> lock hash
        "sell_amount": "0x0",
        "sell_capacity": "0x0",
        "owner_lock_hash": "0xfda77156f5ec403242a03875b2b29e14ba1c910b14a62fbe0baa3e367ae1f0a6",// owner ckb account lock hash, layer 1 address -> lock script -> lock hash
        "payment_lock_hash": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "fee": {
            "sudt_id": "0x1",
            "amount": "0x0"
        }
    },
    "signature": "0x8109666e73e8e2ce0bc95d95e08a3a77844c9c5e8049882d863c765843f14af57107bf22c00bce8ea1e45cdbc85415d4f497061913bcbfa97258b2b27897a53a01"
}
```

In the example above, `owner_lock_hash` is calculated from `owner`, `account_script_hash` is calculated from `account`, `rollup_type_hash` and `eth_account_type_hash`: 

```ts
import { utils, helpers } from '@ckb-lumos/lumos'
const ownerLock = helpers.parseAddress(owner);
const ownerLockHash = utils.computeScriptHash(ownerLock);
const l2AccountScript: Script = {
      code_hash: ethAccountTypeHash,
      hash_type: "type",
      args: rollupTypeHash + account.slice(2),
    };
const accountScriptHash = utils.computeScriptHash(l2AccountScript);
```

Once you have successfully submitted the rpc request, the return hash value can be used to query the state of withdrawal by calling `gw_get_withdrawal` method: 

```json
{
    "id": 2,
    "jsonrpc": "2.0",
    "method": "gw_get_withdrawal",
    "params": ["the_return_value"]
}
```

the return value should look like:

```json
{
    "jsonrpc": "2.0",
    "id": 2,
    "result": {
        "withdrawal": {
            "raw": {
                "nonce": "0x2e",
                "capacity": "0x9502f9000",
                "amount": "0x0",
                "sell_amount": "0x0",
                "sell_capacity": "0x0",
                "sudt_script_hash": "0x0000000000000000000000000000000000000000000000000000000000000000",
                "account_script_hash": "0x1ddfd18bee966192f8e35e8fbaaae93b88c476960754077d039cf1e56c633c22",
                "owner_lock_hash": "0xfda77156f5ec403242a03875b2b29e14ba1c910b14a62fbe0baa3e367ae1f0a6",
                "payment_lock_hash": "0x0000000000000000000000000000000000000000000000000000000000000000",
                "fee": {
                    "sudt_id": "0x1",
                    "amount": "0x0"
                }
            },
            "signature": "0x8109666e73e8e2ce0bc95d95e08a3a77844c9c5e8049882d863c765843f14af57107bf22c00bce8ea1e45cdbc85415d4f497061913bcbfa97258b2b27897a53a01"
        },
        "status": "committed"
    }
}
```

The `status` field could be `pending` or `committed`, indicating different state of the withdrawal.

Then a cell containing the assets is created on layer 1, to list all withdrawal cells requested by a layer 2 account, let's name it `AliceL2`, we can make a query using `@ckb-lumos/ckb-indexer` like this:

```ts
    const getWithdrawalCellSearchParams = function(AliceL2: string) {
        const layer2Lock: Script = {
            code_hash: SCRIPTS.eth_account_lock.script_type_hash,
            hash_type: "type",
            args: ROLLUP_CONFIG.rollup_type_hash + AliceL2.slice(2).toLowerCase(),
            };
        const accountScriptHash = utils.computeScriptHash(layer2Lock);

        return {
            script: {
                    code_hash: SCRIPTS.withdrawal_lock.script_type_hash,
                    hash_type: "type" as HashType,
                    args: `${ROLLUP_CONFIG.rollup_type_hash}${accountScriptHash.slice(2)}`,
                },
                    script_type: "lock",
            };  
    }
    const searchParams = getWithdrawalCellSearchParams(AliceL2);
    const collectedCells: WithdrawResult[] = [];
    const collector = ckbIndexer.collector({ lock: searchParams.script });
```

### Step 2. Unlock from layer 1

The second step is to unlock the asset created in step one, it needs to take some time(about 5 days) before one can unlock the assets for safty reasons. We will support fast withdraw in near future. When the waiting time is due, the receiver address can make a layer 1 transaction to unlock the asset cell, the transaction should take the asset cell as input and another ckb cell  to pay transaction fee, in the output cell, just change the lock of asset cell to receiver lock. Here is an example: 

```json
{
    "version": "0x0",
    "cell_deps": [
        {
            "out_point": {
                "tx_hash": "0xb4b07dcd1571ac18683b515ada40e13b99bd0622197b6817047adc9f407f4828",
                "index": "0x0"
            },
            "dep_type": "code"
        },
        {
            "out_point": {
                "tx_hash": "0x6ab0949b8ce8e7b268d12848c2668a049c3c0ac0d5e803311dd2512c96ce3072",
                "index": "0x0"
            },
            "dep_type": "code"
        },
        {
            "out_point": {
                "tx_hash": "0x9154df4f7336402114d04495175b37390ce86a4906d2d4001cf02c3e6d97f39c",
                "index": "0x0"
            },
            "dep_type": "code"
        },
        {
            "out_point": {
                "tx_hash": "0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37",
                "index": "0x0"
            },
            "dep_type": "dep_group"
        }
    ],
    "header_deps": [],
    "inputs": [
        {
            "since": "0x0",
            "previous_output": {
                "index": "0x27",
                "tx_hash": "0xfd6b226ca0cf63860b6958b75c498d44d780b273b9a5dd5563925dfb99c7b2d8"
            }
        },
        {
            "since": "0x0",
            "previous_output": {
                "index": "0x0",
                "tx_hash": "0xe68156b56efe7da6143a4f4c6b1fd6e57cad34d5677a3eb2ebe0ab4a5a8b8c07"
            }
        }
    ],
    "outputs": [
        {
            "capacity": "0xba43b7400",
            "lock": {
                "code_hash": "0x79f90bb5e892d80dd213439eeab551120eb417678824f282b4ffb5f21bad2e1e",
                "hash_type": "type",
                "args": "0x01a08bcc398854db4eaffd9c28b881c65f91e3a28b00"
            },
            "type": null
        },
        {
            "capacity": "0x95623ea60",
            "lock": {
                "code_hash": "0x79f90bb5e892d80dd213439eeab551120eb417678824f282b4ffb5f21bad2e1e",
                "hash_type": "type",
                "args": "0x01a08bcc398854db4eaffd9c28b881c65f91e3a28b00"
            }
        }
    ],
    "outputs_data": [
        "0x",
        "0x"
    ],
    "witnesses": [
        "0x1c000000100000001c0000001c000000080000000000000004000000",
        "0x69000000100000006900000069000000550000005500000010000000550000005500000041000000765ee6841102021a458554a6b545522aeb53e58f968ce362297ec92d3e5ce8fb380302eea541b117141e9f21d2aa0a44c4401dbd5ab7ff62505d2ca745754e8a00"
    ]
}
```

Note that the cell deps should contain `rollup cellDep` and `withdraw cellDep`, `sudt cellDep` if you have any sudt withdrawed, then other deps required by the receiver lock. You can get `withdraw cellDep` and `sudt cellDep` from static config file, while `rollup cellDep` must be obtained on chain: 

```ts

  async getRollupCellDep(): Promise<CellDep> {
    const result = await this.godwokenClient.getLastSubmittedInfo();
    const txHash = result.transaction_hash;
    const tx = await this.getPendingTransaction(txHash);

    if (tx == null) {
      throw new Error("Last submitted tx not found!");
    }

    let rollupIndex = tx.transaction.outputs.findIndex((o: any) => {
      return o.type && utils.computeScriptHash(o.type) === ROLLUP_CONFIG.rollup_type_hash;
    });
     return {
       out_point: {
         tx_hash: txHash,
         index: `0x${rollupIndex.toString(16)}`,
       },
       dep_type: "code",
     }
  }
```