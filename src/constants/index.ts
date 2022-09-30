export const FEE = BigInt(6000)
export const MIN_CAPACITY = BigInt(62) * BigInt(100000000)
export const WITNESS_NATIVE_MODE = "a0"
export const MODE_PUBKEY_SIG_LEN = (1 + 64 + 64) * 2

const TestnetInfo = {
  JoyIDLockScript: {
    codeHash: '0x726c205927bf90b3c1c8def979333e5a04f8f82e158e2a35dee85a6750d38cf1',
    hashType: 'type',
    args: '',
  } as CKBComponents.Script,

  JoyIDLockDep: {
    outPoint: { txHash: '0x2782dc9807748c0671593ea2d701b73ca1539954b066b13e22f9073b836ea139', index: '0x0' },
    depType: 'depGroup',
  } as CKBComponents.CellDep,

  CotaTypeScript: {
    codeHash: '0x89cd8003a0eaf8e65e0c31525b7d1d5c1becefd2ea75bb4cff87810ae37764d8',
    hashType: 'type',
    args: '0x',
  } as CKBComponents.Script,

  CotaTypeDep: {
    outPoint: { txHash: '0xad4b1985dde9f13cd6c3a8d875640b8e9a476542bc5d87c66220730ac694a350', index: '0x0' },
    depType: 'depGroup',
  } as CKBComponents.CellDep,
}

const MainnetInfo = {
  JoyIDLockScript: {
    codeHash: '0x9302db6cc1344b81a5efee06962abcb40427ecfcbe69d471b01b2658ed948075',
    hashType: 'type',
    args: '',
  } as CKBComponents.Script,

  JoyIDLockDep: {
    outPoint: { txHash: '0xfa683440f605af7cc117755f8bcf6acec70fc4a69265602117810dfa41444159', index: '0x0' },
    depType: 'depGroup',
  } as CKBComponents.CellDep,

  CotaTypeScript: {
    codeHash: '0x1122a4fb54697cf2e6e3a96c9d80fd398a936559b90954c6e88eb7ba0cf652df',
    hashType: 'type',
    args: '0x',
  } as CKBComponents.Script,

  CotaTypeDep: {
    outPoint: { txHash: '0x875db3381ebe7a730676c110e1c0d78ae1bdd0c11beacb7db4db08e368c2cd95', index: '0x0' },
    depType: 'depGroup',
  } as CKBComponents.CellDep,
}

export const getJoyIDLockScript = (isMainnet = false) =>
  isMainnet ? MainnetInfo.JoyIDLockScript : TestnetInfo.JoyIDLockScript

export const getJoyIDCellDep = (isMainnet = false) => (isMainnet ? MainnetInfo.JoyIDLockDep : TestnetInfo.JoyIDLockDep)

export const getCotaTypeScript = (isMainnet = false) =>
  isMainnet ? MainnetInfo.CotaTypeScript : TestnetInfo.CotaTypeScript

export const getCotaCellDep = (isMainnet = false) => (isMainnet ? MainnetInfo.CotaTypeDep : TestnetInfo.CotaTypeDep)