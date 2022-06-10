export const TOKEN_LIST_V0 = [
  {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 18,
    tokenURI: "https://cryptologos.cc/logos/usd-coin-usdc-logo.svg?v=002",
    sudt_script_hash: "",
    address: "0xca6FcAAA5129aD9e5219397527A17c26E5AD6a6a",
    issuerLockHash: "0x58bef38794236b315b7c23fd8132d7f42676228d659b291936e8c6c7ba9f064e",
    l1Lock: {
      code_hash: "0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4",
      hash_type: "type",
      args: "0x58bef38794236b315b7c23fd8132d7f42676228d659b291936e8c6c7ba9f064e",
    },
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    tokenURI: "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=002",
    sudt_script_hash: "",
    address: "0xB1235Dd5bd72d9Ef2F0E311fC5ce7df0583B6458",
    issuerLockHash: "0x1b072aa0ded384067106ea0c43c85bd71bafa5afdb432123511da46b390a4e33",
    l1Lock: {
      code_hash: "0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4",
      hash_type: "type",
      args: "0x1b072aa0ded384067106ea0c43c85bd71bafa5afdb432123511da46b390a4e33",
    },
  },
  {
    symbol: "TAI",
    name: "NexisDAO TAI",
    decimals: 18,
    tokenURI:
      "data:image/png;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAQDAwQDAwQEAwQFBAQFBgoHBgYGBg0JCggKDw0QEA8NDw4RExgUERIXEg4PFRwVFxkZGxsbEBQdHx0aHxgaGxr/2wBDAQQFBQYFBgwHBwwaEQ8RGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhr/wAARCAAoACgDASIAAhEBAxEB/8QAGgAAAgMBAQAAAAAAAAAAAAAAAAgEBQYBCf/EADQQAAEDAwEEBwUJAAAAAAAAAAIAAQQDBRIGBxETURUhIjJCUmIWgYKisggUFyczNEFTZ//EABkBAAMBAQEAAAAAAAAAAAAAAAMFBgIEB//EACQRAAEEAgEDBQEAAAAAAAAAAAMAAQIEERIFEyHCFCIxMoKS/9oADAMBAAIRAxEAPwB85kwIdPI/c3NZyVc68ot+TgHJmVHtFmhV0xqApFSbTj04FdiKA2+QI8Msipevy+pKXC1zGgEIWXbHe7Mfhj6js9Qh+IxHFcsti7aSUtctkKTSH1Ti5Fv35OpsW5Vo795zDk6V32y2hjZBuhbRtAdBvW4PS2RfqY5YY445Y9rHJZGbrmNNMgvG2O93gvFH09ZzEfhPHH5ks9ObbaJP52l4oIpyD7op8YcsJdNiB+v+W5IWE2cy6Q6a08cc5px6lvoMJT/3BNgOL1fX5vUhbrXR2IPv8x7KpCRyQy6muzsT71An2O2XQSa5W+JMEv76An9SvLjGePJPyH1soqS2iyCSUVNtX6ctZJBgCgWzKJGKmBRvxSKjwsezjwy7KeqBYbZaxFrbbokPHu8CgIfSkJpVvy3hv/rZN8hL0HQebsSjGP68UyCHVdHvDihS7bQevIHyB1uhJqXHWLgurB8MmjCwr6ZDCVTcT9z8ln5FurR37ubc2QhW/KVBGC5JN3ZYmOMnylqD7L9YbBQs3T4vSpaz9pOL927WPDIeFj5t/iTLx7dWkP3cG5uhCj6zPylhh2HyzIg4sr6NFCIGFP3vzQhC9JEKAIMMbYZkRf/Z",
    sudt_script_hash: "",
    address: "0x8290f27935A2D353adc834c9F3c5F6ef19635C2D",
    issuerLockHash: "0x13d640a864c7e84d60afd8ca9c6689d345a18f63e2e426c9623a2811776cf211",
    l1Lock: {
      code_hash: "0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4",
      hash_type: "type",
      args: "0x13d640a864c7e84d60afd8ca9c6689d345a18f63e2e426c9623a2811776cf211",
    },
  },
];

export const TOKEN_LIST_V1 = [
  {
    id: 80,
    symbol: "USDC",
    name: "USD Coin",
    decimals: 18,
    tokenURI: "https://cryptologos.cc/logos/usd-coin-usdc-logo.svg?v=002",
    sudt_script_hash: "",
    address: "0x088338e5Df007e2d7B38fd6A1eBc1EB766c6E360",
    issuerLockHash: "0x58bef38794236b315b7c23fd8132d7f42676228d659b291936e8c6c7ba9f064e",
    l1Lock: {
      code_hash: "0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4",
      hash_type: "type",
      args: "0x58bef38794236b315b7c23fd8132d7f42676228d659b291936e8c6c7ba9f064e",
    },
  },
];

export const getTokenList = () => {
  return {
    v0: TOKEN_LIST_V0,
    v1: TOKEN_LIST_V1,
  };
};
