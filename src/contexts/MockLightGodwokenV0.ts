import { BI, Hash, HashType, HexNumber, Script } from "@ckb-lumos/lumos";
import EventEmitter from "events";
import DefaultLightGodwoken from "../light-godwoken/lightGodwoken";
import {
  UnlockPayload,
  WithdrawalEventEmitter,
  WithdrawalEventEmitterPayload,
  GodwokenVersion,
  LightGodwokenV0,
  WithdrawResult,
  ProxyERC20,
  SUDT,
  GetErc20Balances,
  GetErc20BalancesResult,
  GetL2CkbBalancePayload,
  Token,
} from "../light-godwoken/lightGodwokenType";
import { GodwokenClient } from "../light-godwoken/godwoken/godwokenV0";
import LightGodwokenProvider from "../light-godwoken/lightGodwokenProvider";
export interface MockLightGodwokenV0Interface extends LightGodwokenV0 {
  unlock: (payload: UnlockPayload) => Promise<Hash>;
  withdrawToV1WithEvent: (payload: WithdrawalEventEmitterPayload) => WithdrawalEventEmitter;
}
export default class MockLightGodwokenV0 extends DefaultLightGodwoken implements MockLightGodwokenV0Interface {
  getMinimalDepositCapacity(): BI {
    throw new Error("Method not implemented.");
  }
  getMinimalWithdrawalCapacity(): BI {
    throw new Error("Method not implemented.");
  }
  getWithdrawalWaitBlock(): number | Promise<number> {
    throw new Error("Method not implemented.");
  }
  generateDepositLock(): Script {
    throw new Error("Method not implemented.");
  }
  godwokenClient;
  constructor(provider: LightGodwokenProvider) {
    super(provider);
    this.godwokenClient = new GodwokenClient(provider.getLightGodwokenConfig().layer2Config.GW_POLYJUICE_RPC_URL);
  }
  getMinimalWithdrawalToV1Capacity(): BI {
    throw new Error("Method not implemented.");
  }

  getVersion(): GodwokenVersion {
    return "v0";
  }
  getNativeAsset(): Token {
    return {
      name: "Common Knowledge Base",
      symbol: "CKB",
      decimals: 8,
      tokenURI: "",
    };
  }
  getBlockProduceTime(): number {
    return 45 * 1000;
  }
  getChainId(): Promise<string> {
    return Promise.resolve("0x01");
  }

  async getL2CkbBalance(payload?: GetL2CkbBalancePayload): Promise<HexNumber> {
    return "0x2939363918936";
  }

  getBuiltinErc20List(): ProxyERC20[] {
    const result = [
      {
        name: "USD Coin",
        symbol: "USDC",
        decimals: 18,
        address: "0xca6FcAAA5129aD9e5219397527A17c26E5AD6a6a",
        tokenURI: "https://cryptologos.cc/logos/usd-coin-usdc-logo.svg?v=002",
        sudt_script_hash: "0xdac0c53c572f451e56c092fdb520aec82f5f4bf8a5c02e1c4843f40c15f84c55",
      },
      {
        name: "Ethereum",
        symbol: "ETH",
        decimals: 18,
        address: "0xB1235Dd5bd72d9Ef2F0E311fC5ce7df0583B6458",
        tokenURI: "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=002",
        sudt_script_hash: "0xa9eb9df467715766b009ad57cf4c7a2977bc8377d51ace37a3653f3bbb540b7c",
      },
      {
        name: "NexisDAO TAI",
        symbol: "TAI",
        decimals: 18,
        address: "0x8290f27935A2D353adc834c9F3c5F6ef19635C2D",
        tokenURI:
          "data:image/png;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAQDAwQDAwQEAwQFBAQFBgoHBgYGBg0JCggKDw0QEA8NDw4RExgUERIXEg4PFRwVFxkZGxsbEBQdHx0aHxgaGxr/2wBDAQQFBQYFBgwHBwwaEQ8RGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhr/wAARCAAoACgDASIAAhEBAxEB/8QAGgAAAgMBAQAAAAAAAAAAAAAAAAgEBQYBCf/EADQQAAEDAwEEBwUJAAAAAAAAAAIAAQQDBRIGBxETURUhIjJCUmIWgYKisggUFyczNEFTZ//EABkBAAMBAQEAAAAAAAAAAAAAAAMFBgIEB//EACQRAAEEAgEDBQEAAAAAAAAAAAMAAQIEERIFEyHCFCIxMoKS/9oADAMBAAIRAxEAPwB85kwIdPI/c3NZyVc68ot+TgHJmVHtFmhV0xqApFSbTj04FdiKA2+QI8Msipevy+pKXC1zGgEIWXbHe7Mfhj6js9Qh+IxHFcsti7aSUtctkKTSH1Ti5Fv35OpsW5Vo795zDk6V32y2hjZBuhbRtAdBvW4PS2RfqY5YY445Y9rHJZGbrmNNMgvG2O93gvFH09ZzEfhPHH5ks9ObbaJP52l4oIpyD7op8YcsJdNiB+v+W5IWE2cy6Q6a08cc5px6lvoMJT/3BNgOL1fX5vUhbrXR2IPv8x7KpCRyQy6muzsT71An2O2XQSa5W+JMEv76An9SvLjGePJPyH1soqS2iyCSUVNtX6ctZJBgCgWzKJGKmBRvxSKjwsezjwy7KeqBYbZaxFrbbokPHu8CgIfSkJpVvy3hv/rZN8hL0HQebsSjGP68UyCHVdHvDihS7bQevIHyB1uhJqXHWLgurB8MmjCwr6ZDCVTcT9z8ln5FurR37ubc2QhW/KVBGC5JN3ZYmOMnylqD7L9YbBQs3T4vSpaz9pOL927WPDIeFj5t/iTLx7dWkP3cG5uhCj6zPylhh2HyzIg4sr6NFCIGFP3vzQhC9JEKAIMMbYZkRf/Z",
        sudt_script_hash: "0x47d6f0b2d2deda96123a0f28dc1a2814cd36f2c469d8809f4be20c0adf968321",
      },
    ];
    return result;
  }

  getBuiltinSUDTList(): SUDT[] {
    const result = [
      {
        type: {
          code_hash: "0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4",
          args: "0x58bef38794236b315b7c23fd8132d7f42676228d659b291936e8c6c7ba9f064e",
          hash_type: "type" as HashType,
        },
        name: "USD Coin",
        symbol: "USDC",
        decimals: 18,
        tokenURI: "https://cryptologos.cc/logos/usd-coin-usdc-logo.svg?v=002",
      },
      {
        type: {
          code_hash: "0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4",
          args: "0x1b072aa0ded384067106ea0c43c85bd71bafa5afdb432123511da46b390a4e33",
          hash_type: "type" as HashType,
        },
        name: "Ethereum",
        symbol: "ETH",
        decimals: 18,
        tokenURI: "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=002",
      },
      {
        type: {
          code_hash: "0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4",
          args: "0x13d640a864c7e84d60afd8ca9c6689d345a18f63e2e426c9623a2811776cf211",
          hash_type: "type" as HashType,
        },
        name: "NexisDAO TAI",
        symbol: "TAI",
        decimals: 18,
        tokenURI:
          "data:image/png;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAQDAwQDAwQEAwQFBAQFBgoHBgYGBg0JCggKDw0QEA8NDw4RExgUERIXEg4PFRwVFxkZGxsbEBQdHx0aHxgaGxr/2wBDAQQFBQYFBgwHBwwaEQ8RGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhr/wAARCAAoACgDASIAAhEBAxEB/8QAGgAAAgMBAQAAAAAAAAAAAAAAAAgEBQYBCf/EADQQAAEDAwEEBwUJAAAAAAAAAAIAAQQDBRIGBxETURUhIjJCUmIWgYKisggUFyczNEFTZ//EABkBAAMBAQEAAAAAAAAAAAAAAAMFBgIEB//EACQRAAEEAgEDBQEAAAAAAAAAAAMAAQIEERIFEyHCFCIxMoKS/9oADAMBAAIRAxEAPwB85kwIdPI/c3NZyVc68ot+TgHJmVHtFmhV0xqApFSbTj04FdiKA2+QI8Msipevy+pKXC1zGgEIWXbHe7Mfhj6js9Qh+IxHFcsti7aSUtctkKTSH1Ti5Fv35OpsW5Vo795zDk6V32y2hjZBuhbRtAdBvW4PS2RfqY5YY445Y9rHJZGbrmNNMgvG2O93gvFH09ZzEfhPHH5ks9ObbaJP52l4oIpyD7op8YcsJdNiB+v+W5IWE2cy6Q6a08cc5px6lvoMJT/3BNgOL1fX5vUhbrXR2IPv8x7KpCRyQy6muzsT71An2O2XQSa5W+JMEv76An9SvLjGePJPyH1soqS2iyCSUVNtX6ctZJBgCgWzKJGKmBRvxSKjwsezjwy7KeqBYbZaxFrbbokPHu8CgIfSkJpVvy3hv/rZN8hL0HQebsSjGP68UyCHVdHvDihS7bQevIHyB1uhJqXHWLgurB8MmjCwr6ZDCVTcT9z8ln5FurR37ubc2QhW/KVBGC5JN3ZYmOMnylqD7L9YbBQs3T4vSpaz9pOL927WPDIeFj5t/iTLx7dWkP3cG5uhCj6zPylhh2HyzIg4sr6NFCIGFP3vzQhC9JEKAIMMbYZkRf/Z",
      },
    ];
    return result;
  }

  async getErc20Balances(payload: GetErc20Balances): Promise<GetErc20BalancesResult> {
    const result = {
      balances: ["0x1ece0d86991eb100000", "0x0", "0x0"],
    };
    return Promise.resolve(result);
  }

  async listWithdraw(): Promise<WithdrawResult[]> {
    const result = [
      {
        cell: {
          cell_output: {
            capacity: "0xba43b7400",
            lock: {
              args: "0x4cc2e6526204ae6a2e8fcf12f7ad472f41a1606d5b9624beebd215d780809f6a598aebdbd519e94a7f13beb41a1682580c40b7038d2aa491945434e13b8b6c1909288aa53eafcac1a44cfdc8869733282066f387a10718afd09ea3f00d2a93c4b84003000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000743ba40b000000a3d117cb0c52e8d2bf352b1fcfd3eb08ae6db495afe2a83a2ff22e93031759b30000000000000000000000000000000000000000000000000000000000000000",
              code_hash: "0x170ef156e9f6132dbca6069dfd3e436f7d91c29d3ac7332c4b33e633b6a299b5",
              hash_type: "type" as HashType,
            },
            type: undefined,
          },
          data: "0x",
          out_point: {
            index: "0x3",
            tx_hash: "0x62fea33325f0681241d38b0a06f415be8b6ae9dbb8600923138ae9805cf43fdc",
          },
          block_number: "0x3a9526",
        },
        withdrawalBlockNumber: 213176,
        remainingBlockNumber: 0,
        capacity: "0xba43b7400",
        amount: "0x0",
        sudt_script_hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      },
      {
        cell: {
          cell_output: {
            capacity: "0xba43b7400",
            lock: {
              args: "0x4cc2e6526204ae6a2e8fcf12f7ad472f41a1606d5b9624beebd215d780809f6a598aebdbd519e94a7f13beb41a1682580c40b7038d2aa491945434e13b8b6c19d63d5b9abb0547ad25fd0c085213b18c77304318d7907f89c5a1bdee6445e6d3ba4003000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000743ba40b000000a3d117cb0c52e8d2bf352b1fcfd3eb08ae6db495afe2a83a2ff22e93031759b30000000000000000000000000000000000000000000000000000000000000000",
              code_hash: "0x170ef156e9f6132dbca6069dfd3e436f7d91c29d3ac7332c4b33e633b6a299b5",
              hash_type: "type" as HashType,
            },
            type: undefined,
          },
          data: "0x",
          out_point: {
            index: "0x3",
            tx_hash: "0xae3b3275eee81f026448120cd86d3912497b688699d7c52f02f200f524b1547c",
          },
          block_number: "0x3a9538",
        },
        withdrawalBlockNumber: 213178,
        remainingBlockNumber: 0,
        capacity: "0xba43b7400",
        amount: "0x0",
        sudt_script_hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      },
      {
        cell: {
          cell_output: {
            capacity: "0xba43b7400",
            lock: {
              args: "0x4cc2e6526204ae6a2e8fcf12f7ad472f41a1606d5b9624beebd215d780809f6a598aebdbd519e94a7f13beb41a1682580c40b7038d2aa491945434e13b8b6c19022f32e4d2c38fc82f2dfd8d9fb192b8ab784b62f0b3a4e0cfce29da13df85a7bc4003000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000743ba40b000000a3d117cb0c52e8d2bf352b1fcfd3eb08ae6db495afe2a83a2ff22e93031759b30000000000000000000000000000000000000000000000000000000000000000",
              code_hash: "0x170ef156e9f6132dbca6069dfd3e436f7d91c29d3ac7332c4b33e633b6a299b5",
              hash_type: "type" as HashType,
            },
            type: undefined,
          },
          data: "0x",
          out_point: {
            index: "0x3",
            tx_hash: "0xe6d465455f8dba0ec6ca437d53962043b9e9a12366dceaab1f9c373896567829",
          },
          block_number: "0x3a9554",
        },
        withdrawalBlockNumber: 213180,
        remainingBlockNumber: 0,
        capacity: "0xba43b7400",
        amount: "0x0",
        sudt_script_hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      },
      {
        cell: {
          cell_output: {
            capacity: "0xba43b7400",
            lock: {
              args: "0x4cc2e6526204ae6a2e8fcf12f7ad472f41a1606d5b9624beebd215d780809f6a598aebdbd519e94a7f13beb41a1682580c40b7038d2aa491945434e13b8b6c197fc222e500499d1513bf2d21d4c4225cd3214893f1e4910de120f8b926eb2c2abe4003000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000743ba40b000000a3d117cb0c52e8d2bf352b1fcfd3eb08ae6db495afe2a83a2ff22e93031759b30000000000000000000000000000000000000000000000000000000000000000",
              code_hash: "0x170ef156e9f6132dbca6069dfd3e436f7d91c29d3ac7332c4b33e633b6a299b5",
              hash_type: "type" as HashType,
            },
            type: undefined,
          },
          data: "0x",
          out_point: {
            index: "0x3",
            tx_hash: "0x18787896bebc9eccecb0c65fa7581760b8de7a8c3d01dacfe7bc2b70253cbb6e",
          },
          block_number: "0x3a956c",
        },
        withdrawalBlockNumber: 213182,
        remainingBlockNumber: 0,
        capacity: "0xba43b7400",
        amount: "0x0",
        sudt_script_hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      },
      {
        cell: {
          cell_output: {
            capacity: "0x143cc2df300",
            lock: {
              args: "0x4cc2e6526204ae6a2e8fcf12f7ad472f41a1606d5b9624beebd215d780809f6a598aebdbd519e94a7f13beb41a1682580c40b7038d2aa491945434e13b8b6c19121c5925d03231f0a8f576df1c584f7d27e9c129af7392c3580826e12bb38730c640030000000000dac0c53c572f451e56c092fdb520aec82f5f4bf8a5c02e1c4843f40c15f84c550000000000000000000000000000000000f32dcc43010000a3d117cb0c52e8d2bf352b1fcfd3eb08ae6db495afe2a83a2ff22e93031759b30000000000000000000000000000000000000000000000000000000000000000",
              code_hash: "0x170ef156e9f6132dbca6069dfd3e436f7d91c29d3ac7332c4b33e633b6a299b5",
              hash_type: "type" as HashType,
            },
            type: {
              args: "0x58bef38794236b315b7c23fd8132d7f42676228d659b291936e8c6c7ba9f064e",
              code_hash: "0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4",
              hash_type: "type" as HashType,
            },
          },
          data: "0x01000000000000000000000000000000",
          out_point: {
            index: "0x3",
            tx_hash: "0x33a287e21ecd0c8d7295f75c50cefd083b77e1d008186d6bf3c4633d9bc270a0",
          },
          block_number: "0x3a95b8",
        },
        withdrawalBlockNumber: 213190,
        remainingBlockNumber: 0,
        capacity: "0x143cc2df300",
        amount: "0x1",
        sudt_script_hash: "0xdac0c53c572f451e56c092fdb520aec82f5f4bf8a5c02e1c4843f40c15f84c55",
        erc20: {
          name: "USD Coin",
          symbol: "USDC",
          decimals: 18,
          address: "0xca6FcAAA5129aD9e5219397527A17c26E5AD6a6a",
          tokenURI: "https://cryptologos.cc/logos/usd-coin-usdc-logo.svg?v=002",
          sudt_script_hash: "0xdac0c53c572f451e56c092fdb520aec82f5f4bf8a5c02e1c4843f40c15f84c55",
        },
      },
      {
        cell: {
          cell_output: {
            capacity: "0x174876e800",
            lock: {
              args: "0x4cc2e6526204ae6a2e8fcf12f7ad472f41a1606d5b9624beebd215d780809f6a598aebdbd519e94a7f13beb41a1682580c40b7038d2aa491945434e13b8b6c19337a9a25371278b956210bbdfd5daaffdf4fa4c9a2b79274e69fe7168cc40a9e374103000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e8764817000000a3d117cb0c52e8d2bf352b1fcfd3eb08ae6db495afe2a83a2ff22e93031759b30000000000000000000000000000000000000000000000000000000000000000",
              code_hash: "0x170ef156e9f6132dbca6069dfd3e436f7d91c29d3ac7332c4b33e633b6a299b5",
              hash_type: "type" as HashType,
            },
            type: undefined,
          },
          data: "0x",
          out_point: {
            index: "0x3",
            tx_hash: "0x02b4a7db939ed9b53a701a9314d6938075d0a85da04cdeff862d9eb80ad2cc04",
          },
          block_number: "0x3a9962",
        },
        withdrawalBlockNumber: 213303,
        remainingBlockNumber: 0,
        capacity: "0x174876e800",
        amount: "0x0",
        sudt_script_hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      },
      {
        cell: {
          cell_output: {
            capacity: "0xa14e19100",
            lock: {
              args: "0x4cc2e6526204ae6a2e8fcf12f7ad472f41a1606d5b9624beebd215d780809f6a598aebdbd519e94a7f13beb41a1682580c40b7038d2aa491945434e13b8b6c1923ed0651d10175d4953e878a8ad8fed24ef0bae9568e30dc0b1ac2b6590dbc705741030000000000dac0c53c572f451e56c092fdb520aec82f5f4bf8a5c02e1c4843f40c15f84c55000000000000000000000000000000000091e1140a000000a3d117cb0c52e8d2bf352b1fcfd3eb08ae6db495afe2a83a2ff22e93031759b30000000000000000000000000000000000000000000000000000000000000000",
              code_hash: "0x170ef156e9f6132dbca6069dfd3e436f7d91c29d3ac7332c4b33e633b6a299b5",
              hash_type: "type" as HashType,
            },
            type: {
              args: "0x58bef38794236b315b7c23fd8132d7f42676228d659b291936e8c6c7ba9f064e",
              code_hash: "0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4",
              hash_type: "type" as HashType,
            },
          },
          data: "0x0000d01309468e150100000000000000",
          out_point: {
            index: "0x3",
            tx_hash: "0xe94e5a6a0b81f90ce00b0a39fbb819189752ba4cd8487755cf930ed4fb44253b",
          },
          block_number: "0x3a9a52",
        },
        withdrawalBlockNumber: 213335,
        remainingBlockNumber: 0,
        capacity: "0xa14e19100",
        amount: "0x1158e460913d00000",
        sudt_script_hash: "0xdac0c53c572f451e56c092fdb520aec82f5f4bf8a5c02e1c4843f40c15f84c55",
        erc20: {
          name: "USD Coin",
          symbol: "USDC",
          decimals: 18,
          address: "0xca6FcAAA5129aD9e5219397527A17c26E5AD6a6a",
          tokenURI: "https://cryptologos.cc/logos/usd-coin-usdc-logo.svg?v=002",
          sudt_script_hash: "0xdac0c53c572f451e56c092fdb520aec82f5f4bf8a5c02e1c4843f40c15f84c55",
        },
      },
      {
        cell: {
          cell_output: {
            capacity: "0x174876e800",
            lock: {
              args: "0x4cc2e6526204ae6a2e8fcf12f7ad472f41a1606d5b9624beebd215d780809f6a598aebdbd519e94a7f13beb41a1682580c40b7038d2aa491945434e13b8b6c19366a289fe452b68ab2373e5fbbcbcd42f5f70e97a05717c2ecf4cc6eda9aa144754103000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e8764817000000a3d117cb0c52e8d2bf352b1fcfd3eb08ae6db495afe2a83a2ff22e93031759b30000000000000000000000000000000000000000000000000000000000000000",
              code_hash: "0x170ef156e9f6132dbca6069dfd3e436f7d91c29d3ac7332c4b33e633b6a299b5",
              hash_type: "type" as HashType,
            },
            type: undefined,
          },
          data: "0x",
          out_point: {
            index: "0x3",
            tx_hash: "0x380af8d0ad90489b4b1738096302bb97e859f6a7a0e3e47d3ff5c0b1188d9e05",
          },
          block_number: "0x3a9b45",
        },
        withdrawalBlockNumber: 213365,
        remainingBlockNumber: 0,
        capacity: "0x174876e800",
        amount: "0x0",
        sudt_script_hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      },
      {
        cell: {
          cell_output: {
            capacity: "0x9502f9000",
            lock: {
              args: "0x4cc2e6526204ae6a2e8fcf12f7ad472f41a1606d5b9624beebd215d780809f6a598aebdbd519e94a7f13beb41a1682580c40b7038d2aa491945434e13b8b6c19b896901c80a056b7f7a920554bac99c8e8bd2842bdcb1eb355be250ba67364aa804103000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000902f5009000000a3d117cb0c52e8d2bf352b1fcfd3eb08ae6db495afe2a83a2ff22e93031759b30000000000000000000000000000000000000000000000000000000000000000",
              code_hash: "0x170ef156e9f6132dbca6069dfd3e436f7d91c29d3ac7332c4b33e633b6a299b5",
              hash_type: "type" as HashType,
            },
            type: undefined,
          },
          data: "0x",
          out_point: {
            index: "0x4",
            tx_hash: "0x0b871ecc5bcc693a5e9e65f9a0f0d64e1701bfe081838a646ee8ce59c8e7ec56",
          },
          block_number: "0x3a9b96",
        },
        withdrawalBlockNumber: 213376,
        remainingBlockNumber: 0,
        capacity: "0x9502f9000",
        amount: "0x0",
        sudt_script_hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      },
      {
        cell: {
          cell_output: {
            capacity: "0x9502f9000",
            lock: {
              args: "0x4cc2e6526204ae6a2e8fcf12f7ad472f41a1606d5b9624beebd215d780809f6a598aebdbd519e94a7f13beb41a1682580c40b7038d2aa491945434e13b8b6c197a30b2bf3a07e94eea9f970b84a8352e03c000fedf0ee9289e1300f25ace58bd844103000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000902f5009000000a3d117cb0c52e8d2bf352b1fcfd3eb08ae6db495afe2a83a2ff22e93031759b30000000000000000000000000000000000000000000000000000000000000000",
              code_hash: "0x170ef156e9f6132dbca6069dfd3e436f7d91c29d3ac7332c4b33e633b6a299b5",
              hash_type: "type" as HashType,
            },
            type: undefined,
          },
          data: "0x",
          out_point: {
            index: "0x3",
            tx_hash: "0xafa1bfa566b44e525e8c40d238c8857171f6df18cf964ac3a5f309a579da9f65",
          },
          block_number: "0x3a9bb0",
        },
        withdrawalBlockNumber: 213380,
        remainingBlockNumber: 0,
        capacity: "0x9502f9000",
        amount: "0x0",
        sudt_script_hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      },
      {
        cell: {
          cell_output: {
            capacity: "0x9502f9000",
            lock: {
              args: "0x4cc2e6526204ae6a2e8fcf12f7ad472f41a1606d5b9624beebd215d780809f6a598aebdbd519e94a7f13beb41a1682580c40b7038d2aa491945434e13b8b6c1980e81f4648712a2dce232e67288cee1de572cf7feffd4e115fa33619808b0e4df5330500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a3d117cb0c52e8d2bf352b1fcfd3eb08ae6db495afe2a83a2ff22e93031759b30000000000000000000000000000000000000000000000000000000000000000",
              code_hash: "0x170ef156e9f6132dbca6069dfd3e436f7d91c29d3ac7332c4b33e633b6a299b5",
              hash_type: "type" as HashType,
            },
            type: undefined,
          },
          data: "0x",
          out_point: {
            index: "0x5",
            tx_hash: "0x93f8500649582ca903ea9664bdbc29896265c1c21d4d8edd0272ec2baf5e188e",
          },
          block_number: "0x4a8795",
        },
        withdrawalBlockNumber: 340981,
        remainingBlockNumber: 0,
        capacity: "0x9502f9000",
        amount: "0x0",
        sudt_script_hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      },
      {
        cell: {
          cell_output: {
            capacity: "0x9502f9000",
            lock: {
              args: "0x4cc2e6526204ae6a2e8fcf12f7ad472f41a1606d5b9624beebd215d780809f6a598aebdbd519e94a7f13beb41a1682580c40b7038d2aa491945434e13b8b6c194a78093a2ae2ed9c62e9f9aeb88d1e099258a25ce9a4eb3f371252d070e8bcceb3600500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a3d117cb0c52e8d2bf352b1fcfd3eb08ae6db495afe2a83a2ff22e93031759b30000000000000000000000000000000000000000000000000000000000000000",
              code_hash: "0x170ef156e9f6132dbca6069dfd3e436f7d91c29d3ac7332c4b33e633b6a299b5",
              hash_type: "type" as HashType,
            },
            type: undefined,
          },
          data: "0x",
          out_point: {
            index: "0x3",
            tx_hash: "0xb541de84770cb86a1caa817f809a02d2b261e3578866220717cd75f716addd84",
          },
          block_number: "0x4da884",
        },
        withdrawalBlockNumber: 352435,
        remainingBlockNumber: 9536,
        capacity: "0x9502f9000",
        amount: "0x0",
        sudt_script_hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      },
      {
        cell: {
          cell_output: {
            capacity: "0x9502f9000",
            lock: {
              args: "0x4cc2e6526204ae6a2e8fcf12f7ad472f41a1606d5b9624beebd215d780809f6a598aebdbd519e94a7f13beb41a1682580c40b7038d2aa491945434e13b8b6c190553bff0609705add33e78b38c15fd248627918df1ac78ab5ab878151e152bc8c0600500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a3d117cb0c52e8d2bf352b1fcfd3eb08ae6db495afe2a83a2ff22e93031759b30000000000000000000000000000000000000000000000000000000000000000",
              code_hash: "0x170ef156e9f6132dbca6069dfd3e436f7d91c29d3ac7332c4b33e633b6a299b5",
              hash_type: "type" as HashType,
            },
            type: undefined,
          },
          data: "0x",
          out_point: {
            index: "0x3",
            tx_hash: "0x866a650bc123ba0e71c1d62fd1ff479961170db407e92ee56ff4fa1dfd8f4ec6",
          },
          block_number: "0x4da974",
        },
        withdrawalBlockNumber: 352448,
        remainingBlockNumber: 9549,
        capacity: "0x9502f9000",
        amount: "0x0",
        sudt_script_hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      },
      {
        cell: {
          cell_output: {
            capacity: "0x9502f9000",
            lock: {
              args: "0x4cc2e6526204ae6a2e8fcf12f7ad472f41a1606d5b9624beebd215d780809f6a598aebdbd519e94a7f13beb41a1682580c40b7038d2aa491945434e13b8b6c1906eb6b491be9a68b50690f28a4ca68f9f454b6229edaa886ed60fa140bb034ffc9600500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a3d117cb0c52e8d2bf352b1fcfd3eb08ae6db495afe2a83a2ff22e93031759b30000000000000000000000000000000000000000000000000000000000000000",
              code_hash: "0x170ef156e9f6132dbca6069dfd3e436f7d91c29d3ac7332c4b33e633b6a299b5",
              hash_type: "type" as HashType,
            },
            type: undefined,
          },
          data: "0x",
          out_point: {
            index: "0x3",
            tx_hash: "0x84558106f3652e8934ebd23f60197a49f047286a7a4b0e27a2d226e5b5487507",
          },
          block_number: "0x4da9ff",
        },
        withdrawalBlockNumber: 352457,
        remainingBlockNumber: 9558,
        capacity: "0x9502f9000",
        amount: "0x0",
        sudt_script_hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      },
      {
        cell: {
          cell_output: {
            capacity: "0x9502f9000",
            lock: {
              args: "0x4cc2e6526204ae6a2e8fcf12f7ad472f41a1606d5b9624beebd215d780809f6a598aebdbd519e94a7f13beb41a1682580c40b7038d2aa491945434e13b8b6c192c91c52d2c8d6b90ecc8ad98a16bf897191d3fef44ae3154b719578615f4c221cb600500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a3d117cb0c52e8d2bf352b1fcfd3eb08ae6db495afe2a83a2ff22e93031759b30000000000000000000000000000000000000000000000000000000000000000",
              code_hash: "0x170ef156e9f6132dbca6069dfd3e436f7d91c29d3ac7332c4b33e633b6a299b5",
              hash_type: "type" as HashType,
            },
            type: undefined,
          },
          data: "0x",
          out_point: {
            index: "0x3",
            tx_hash: "0x2766cd465c7af7e1b78f3692d639824626dde416a8944cbf907cfc52e442cd8f",
          },
          block_number: "0x4daa21",
        },
        withdrawalBlockNumber: 352459,
        remainingBlockNumber: 9560,
        capacity: "0x9502f9000",
        amount: "0x0",
        sudt_script_hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      },
    ];
    return Promise.resolve(result);
  }

  getWithdrawalCellSearchParams(ethAddress: string) {
    if (ethAddress.length !== 42 || !ethAddress.startsWith("0x")) {
      throw new Error("eth address format error!");
    }
    const accountScriptHash = "0x598aebdbd519e94a7f13beb41a1682580c40b7038d2aa491945434e13b8b6c19";
    const { layer2Config } = this.provider.getLightGodwokenConfig();
    return {
      script: {
        code_hash: layer2Config.SCRIPTS.withdrawal_lock.script_type_hash,
        hash_type: "type" as HashType,
        args: `${layer2Config.ROLLUP_CONFIG.rollup_type_hash}${accountScriptHash.slice(2)}`,
      },
      script_type: "lock",
    };
  }

  async getWithdrawal(txHash: Hash): Promise<unknown> {
    const result = this.godwokenClient.getWithdrawal(txHash);
    return result;
  }

  withdrawWithEvent(payload: WithdrawalEventEmitterPayload): WithdrawalEventEmitter {
    const eventEmitter = new EventEmitter();
    this.withdraw(eventEmitter, payload);
    return eventEmitter;
  }
  withdrawToV1WithEvent(payload: WithdrawalEventEmitterPayload): WithdrawalEventEmitter {
    const eventEmitter = new EventEmitter();
    this.withdraw(eventEmitter, payload);
    return eventEmitter;
  }

  async withdraw(eventEmitter: EventEmitter, payload: WithdrawalEventEmitterPayload): Promise<void> {
    eventEmitter.emit("sending");
    const txHash = await Promise.resolve("0xb352e1c8dbe5178cc6c40ef7a341d7b15209eb80bb97a0cb5e4fa1f846e8c4a9");
    eventEmitter.emit("sent", txHash);
  }

  async unlock(payload: UnlockPayload): Promise<Hash> {
    return "0xb352e1c8dbe5178cc6c40ef7a341d7b15209eb80bb97a0cb5e4fa1f846e8c4a9";
  }
}
