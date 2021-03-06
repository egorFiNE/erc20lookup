import { ethers } from 'ethers';

const LOOKUP_CONTRACT_ADDRESSES_BY_CHAINID = {
  0x7a69: '0x6e7285c3E47c242e3aD62eDD5D0F19886F1e7ef0', // developer code, anything

  0x01: '0x6e7285c3E47c242e3aD62eDD5D0F19886F1e7ef0',
  0x89: '0xFe35BC1Ff694883dE8D31f3a87C5a668BCE765B0', // polygon
  0x4e454152: '0x48cF154a086bAB5492A8D150f4d87a74eCf90743', // aurora
  43114: '0xCbCB78054731a6FCCa53920959033810Ff0A7D1d', // avalanche
  0x38: '0x9a8D6BB3c45E100c8456a8295C8b90b993bE20D4', // BSC
  0xfa: '0xD07b8Ddbb60aA59648F8697A2faCbDa4C8ed4994' // Fantom
};

const LOOKUP_ABI = [
  {
    'inputs': [
      {
        'internalType': 'address[]',
        'name': 'tokens',
        'type': 'address[]'
      }
    ],
    'name': 'lookup',
    'outputs': [
      {
        'components': [
          {
            'internalType': 'string',
            'name': 'symbol',
            'type': 'string'
          },
          {
            'internalType': 'string',
            'name': 'name',
            'type': 'string'
          },
          {
            'internalType': 'uint8',
            'name': 'decimals',
            'type': 'uint8'
          }
        ],
        'internalType': 'struct ERC20Lookup.LookupResult[]',
        'name': 'result',
        'type': 'tuple[]'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  }
];

export async function lookup(provider, contracts) {
  let chainId;
  if (provider.chainId) {
    chainId = provider.chainId;
  } else {
    const network = await provider.getNetwork();
    chainId = network.chainId;
  }

  const contractAddress = process.env.ERC20_LOOKUP_CONTRACT_ADDRESS || LOOKUP_CONTRACT_ADDRESSES_BY_CHAINID[chainId];
  if (!contractAddress) {
    throw new Error(`No lookup contract for chainId 0x${chainId.toString(16)}`);
  }

  const lookupContract = new ethers.Contract(contractAddress, LOOKUP_ABI, provider);
  const addresses = contracts.map(contract => contract.address);

  let results = null;
  try {
    results = await lookupContract.lookup(addresses);
  } catch (e) {
    throw new Error(`ERC20Lookup can't lookup contracts ${addresses.join(',')} via ${contractAddress} at 0x${chainId.toString(16)}`);
  }

  for (let i=0; i<contracts.length; i++) {
    contracts[i].erc20 = {
      name: results[i].name,
      symbol: results[i].symbol,
      decimals: parseInt(results[i].decimals, 10)
    };
  }
}
