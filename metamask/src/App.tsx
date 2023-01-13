import { useState } from 'react'
import joyidLogo from './assets/logo.svg'
import './App.css'
import Button from '@mui/lab/LoadingButton';
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider';
import { detect, sendTx } from './action';

declare global {
  interface Window{
    ethereum?:any
  }
}

const AccountCard = ({ckbAdress, balance}: {ckbAdress: string; balance: string}) => {
  const [loading, setLoading] = useState(false)
  const [toAddress, setToAddress] = useState('')
  const [amount, setAmount] = useState('')

  const handleToAddress = (event: React.ChangeEvent<HTMLInputElement>) => {
    setToAddress(event.target.value);
  }

  const handleAmount = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(event.target.value);
  }

  return (
    <div className='account'>
      <h2>Account:</h2>
      <div>{ckbAdress}</div>
      <h4>
        <span>Balance:</span>
        <span>{balance} ckb</span>
      </h4>

      <Divider />

      <div>
        <h2>Transfer:</h2>
        <Box sx={{
          width: "800px",
          maxWidth: '100%',
          marginTop: '20px'
        }}>
          <TextField fullWidth label="To CKB Address" variant="outlined"  onChange={handleToAddress}/>
        </Box>
        <Box sx={{
          width: "800px",
          maxWidth: '100%',
          marginTop: '20px',
        }}>
          <TextField fullWidth label="Amount(ckb)" variant="outlined" onChange={handleAmount}/>
        </Box>

        <Button className='button' variant="contained" loading={loading} onClick={async () => {
          setLoading(true)
          await sendTx(ckbAdress, toAddress, amount)
          setLoading(false)
        }}>
          Transfer
        </Button>
      </div>
    </div>
  )
}

function App() {
  const [ckbAdress, setCkbAddress] = useState('')
  const [balance, setBalance] = useState("0")
  const [loading, setLoading] = useState(false)

  return (
      <div className="App">
      <img src={joyidLogo} className="logo joyid" alt="JoyID logo" />
      <h1>JoyID + MetaMask</h1>
      <div className="card">
        {!ckbAdress && (<Button className='button' variant="contained" loading={loading} onClick={async () => {
          setLoading(true)
          await detect(setCkbAddress, setBalance)
          setLoading(false)
        }}>
          Connect MetaMask
        </Button>)}
        { ckbAdress && <AccountCard ckbAdress={ckbAdress} balance={balance}/> }
      </div>
    </div>
    
  )
}

export default App
