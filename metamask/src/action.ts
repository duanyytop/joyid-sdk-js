import detectEthereumProvider from '@metamask/detect-provider'
import { Maybe } from '@metamask/providers/dist/utils';
import { addressToScript, bytesToHex, hexToBytes, scriptToAddress, serializeWitnessArgs } from '@nervosnetwork/ckb-sdk-utils';
import { Collector, getJoyIDLockScript, remove0x, generateSecp256k1Tx } from '@nervina-labs/joyid-sdk';
import { utils } from 'elliptic';
import { hashMessage } from 'ethers/lib/utils';
import { ethers } from 'ethers';

export const detect = async (setCkbAddress: Function, setBalance: Function) => {
    const provider = await detectEthereumProvider()
    if (provider?.isMetaMask) {
      if (provider !== window.ethereum) {
        console.error('Do you have multiple wallets installed?');
      } else {
        const accounts: Maybe<string[]> = await window.ethereum.request({ method: 'eth_requestAccounts' })
        if (accounts?.length && accounts?.length > 0) {
          const ethAddress = accounts[0]
          if (!ethAddress) {
            throw new Error('Ethereum address error')
          }
          const lock = {
            ...getJoyIDLockScript(false),
            args: `0x0002${remove0x(ethAddress)}`,
          }
          const ckbAddress = scriptToAddress(lock, false)
          const balance = await getBalance(ckbAddress)
          setCkbAddress(ckbAddress)
          setBalance(balance)
        }
      }
    } else {
      console.log('Please install MetaMask!')
    }
  }
  
export const getBalance = async (address: string): Promise<string> => {
    const collector = new Collector({ckbNodeUrl: 'https://testnet.ckb.dev/rpc', ckbIndexerUrl: 'https://testnet.ckb.dev/indexer'})
    const lock = addressToScript(address)
    const capacity = (await collector.getCapacity(lock))?.capacity
    if (capacity) {
        return (BigInt(capacity)/BigInt(100000000)).toString()
    }
    return "0"
}

export const sendTx =async (from: string, to: string, amount: string) => {
    const collector = new Collector({ckbNodeUrl: 'https://testnet.ckb.dev/rpc', ckbIndexerUrl: 'https://testnet.ckb.dev/indexer'})
    const result = await generateSecp256k1Tx(collector, from, to, BigInt(amount)*BigInt(100000000))
    const rawTx = result[0] as CKBComponents.RawTransactionToSign
    const message = hexToBytes(`0x${result[1]}`)
    const ethAddress = addressToScript(from).args.slice(6)

    if (!window.ethereum) {
        throw new Error('window ethereum error')
    }
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    let signature = await provider.getSigner().signMessage(message)

    let v = Number.parseInt(signature.slice(-2), 16);
    if (v >= 27) v -= 27;
    signature = signature.slice(0, -2) + v.toString(16).padStart(2, '0');

    const witnessGroup = rawTx.witnesses
    if (!witnessGroup.length) {
      throw new Error('WitnessGroup cannot be empty')
    }
    if (typeof witnessGroup[0] !== 'object') {
      throw new Error('The first witness in the group should be type of WitnessArgs')
    }

    witnessGroup[0].lock = `0x01${ethAddress}${signature.slice(2)}`
    const signedWitnesses = [serializeWitnessArgs(witnessGroup[0]), ...witnessGroup.slice(1)]
  
    const signedTx = {
      ...rawTx,
      witnesses: signedWitnesses.map(witness => (typeof witness === 'string' ? witness : serializeWitnessArgs(witness))),
    }
    let txHash = await collector.getCkb().rpc.sendTransaction(signedTx, 'passthrough')
    console.info(`The transfer tx hash with metamask unlock: ${txHash}`)
}