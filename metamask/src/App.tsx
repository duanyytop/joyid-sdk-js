import { useState } from 'react'
import detectEthereumProvider from '@metamask/detect-provider'
import { MetaMaskInpageProvider } from "@metamask/providers";
import reactLogo from './assets/react.svg'
import './App.css'
import { Maybe } from '@metamask/providers/dist/utils';
import { scriptToAddress } from '@nervosnetwork/ckb-sdk-utils';
import { Collector, getJoyIDLockScript, remove0x } from '@nervina-labs/joyid-sdk';

declare global {
  interface Window{
    ethereum?:MetaMaskInpageProvider
  }
}

const detect = async (setCkbAddress: Function) => {
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
        setCkbAddress(ckbAddress)
      }
    }
  } else {
    console.log('Please install MetaMask!')
  }
}

function App() {
  const [ckbAdress, setCkbAddress] = useState('')

  return (
    <div className="App">
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo" alt="Vite logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>JoyID + MetaMask</h1>
      <div className="card">
        <button onClick={() => {
          detect(setCkbAddress)
        }}>
          Connect MetaMask
        </button>
        <p>{ckbAdress}</p>

      </div>
    </div>
  )
}

export default App
