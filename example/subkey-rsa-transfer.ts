import { Aggregator } from '../src/aggregator'
import { Collector } from '../src/collector'
import { addressFromPemKey, exportPubKey, pemToKey, SigAlg } from '../src/utils'
import { sendCKBWithSubkeyUnlock } from '../src/service/subkey'

const MAIN_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC2BbnAeCcYCWUf
F93Gf74LcJSxDPgttyAxe3SdEtSWVpb7IqeWeqr64EHiDld9NusW5gRc7FeYdhG3
jlGbqOvVPBNZuQGFJzZ7hBUJgbd1oQf9Sd2MS0VPW/cODCAGo0UZPmN8PAR+XfYy
ZsnpkuEobfb7vumOSGFTUXR5rA9LKyYtFAs6mWNNQ4pZm+M4iH7IMmy55/tqxAIq
EiKiaZArkCk0J0VxA5WMrVfSjwfGiXw3rvrw4RNgUWLNhFeGN8lRqDt4tVRgqw7g
Zpe5xvMTXrC2uLyuGR2SQjj6TMSY1IzZdebIXvXH1CqzMFpZeLsLZGXJ7DUQIX9U
wc6ftmcjAgMBAAECggEAS2nO3lvJkq9dyoaYV2PYiKPRrxMZBdO/zlCAbY1+L3Vb
o1vlxDY5fayJD0/y1ol42ClfeGJhHmUYjQy1agEQCG4V9E/uvcyTyZPdJW2tZVpc
1YeTd0s+QZVwI81JPYbKm51aGYBCOlrSpGoq0I+OorIAqKed21nInPz7/WcYhQL9
4alJdZ3eNHR+F9UYL5ZA9qY969sNLTzYiHrFjwaocTXHRPzqMxYKsl/LvykOlZLh
8A9niPFSKVIP7GRBrfPCf6EW3ig0+uq/lZLN5bHIAipDh6B/30H3LVPzW6NjUtcg
b/mOI+KzMtiPlEcIJEJxWUAbqk7PtxOpqiqHY+sjRQKBgQDlPR5c8O63zF4PvZDS
Eud39ynEXBJ/pLMLDO6qo+vH5p3u3QKO414ex9GNK45A2EBOLcBxjExsUN2aLKcO
UCMTqwgCFDgieX+HCjbwX+VReCXbPOsQXb5w1bWTFiOJMqWlP2lpZpHXArd9+qnD
Pmhf6M6u0jN9WdQ4daOu2iz9/QKBgQDLRYdZvH6lgQzTw7hcxOQnt547LWMg0Rx5
f5qmjqzaYKKEYesLJx3lwRGICGwMldg7+DQXsdFuQQJ5Essd+xk1EdowYHeaSovP
yjVo8OHYoUbulY4c2f0wk/9UzFfROJMa9NQc0skztHWVZs9rXFbloRan7jCY66qy
6nx9oBxznwKBgF4NwoxtifQ9VIZux6F5giDVdvyKrkhSwecRykaW9OFSvI/JfAg2
P2Kvp0mdikMOtuucl+2+m4iBcTqVgYE83fdu391CgHmckfdM+JeNMOBJRHb8OpG/
dKiE9ne/yJq8/fub1dsZ61JlWfXFR6vEyjw3n71YnymaFpmHor3V5EndAoGAZ81i
uA2M8wF6xm1NKXqWND4NPJUJ6QlALD9gfyue04nDlCzYtYJNPzWfuULrwmWG3eD6
4Rq6Iz5pf+B7/xxqG/K45Dlu+kiVKxBMxAE2o8SAD3gp8UvUgskg+3G6aqokXQCn
jOyLOK8v2JJ+24l1CqB/jFQTVxQJwIID/rcTsGsCgYAyAxp35Mqk720dItGsTpQ3
pTQ1kpjksDPq2p3T/G/ojhJIyRyqPnvrytJjTbED9oEA150+IWw5E05RfIcn9tDg
+jMICgNdjOFoEYPEsYdnR/T906kXMqAcGFDguQrVVr20U6scW3dXS8TXOw3/xUX0
+D5xeVBcZFflqR3zh+/QAw==
-----END PRIVATE KEY-----`
// const ADDRESS = 'ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqq03dwzcucjtl5qcg72kxx9euah4avhq3dvsstzgn'

const SUB_PRIVATE_KEY = `
-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC4dKVX4lyuT8Py
GlAtx9ETBK/fhTS2h9SOvLUK9cSG7FStSsQmiPq1qJlbOlJqADG6f0fQK0JN7yTz
7f0BhjroPNa06X2y0IHjC50BkoDXttMQKGkJeI7jgw9jjaFnvhbKuFqX4cViKnaO
gfxuUtjkPLYtH+aMAaEZI+a5oGkZJc0bw2hhYXjy8nIsrRaOppP00MQC7206IWTM
uNlYYlf8Jd2agnGTfmZjz56cjFAhgDytDNEeeirE9NqjdOhnTwq/UUAsiyCGPwgf
Wm+ZkMJ4cX/gSeLOB/YQE9OU5m2Bqmofo2scKon+x/AAo1W+wRyNIn86nW2rGCaf
74A2YL4TAgMBAAECggEAVPap6JrkfQhR5hVXxFarh9qbVlapysAzWRI0RFmjjlCS
yoXLZ0KmVQHVre9l4dy4C0MwpYMflf1nZJLFfSvCu5G2hnucwj6H7bi+N+ivP22/
t8wdYdbt3n9SmdU1uS8WmYckd5xvyoFrvcXDLGAt9qe+dHeivu/LMGTYlL1+W63C
xyfyl72QP7UBZ0mM2/Jdaj2NvO+xuiyVovoN8hxoQnalkX0mZB5dx1te5Rv3Zcdw
fS1XU9i/QsnmAwDka9019BSiWS+fcDcnv0k177SXJtgQgrMU/btF5dvfu/zmUy9J
3VUL68HLDAQDUHNvh0VrgH3/zgYGjgDFY3WnEG4y7QKBgQD9ZWMtBcI1FoofjDaR
/WYrP1bVXrJ7hURzn0tg7k+oQtJ1I53bFD0s7/CoAQQ3REvQUT3K6lwj0OTdPWzK
qXjrT+0E3IELeWVJqd3B5brCp37r0jHFdgEKRIRSRHkEdszbFef2L1w/KSi9Dsnp
kFujUrh4VvwF1t3MYK1oSxbD3wKBgQC6WeVe9xhPJnW4guJLCoS4IWsgLwlFqbNG
jXuS5aMMVraMDzknnmRyxxu+c3I/W8RBgsGMh8rGW77x69f6bEwCabeqgQjk2Fou
4y4zHI0Dt7vUnz87ly2FvvgeIjVcdPhsjCgAuZZJH4CDrYM+4b0mPYscQ39yB9Yj
GyTzWNKsTQKBgHJVxBk1hvqzT+GKP7lB0E7lRoYCM6CeclOFZdq3zQOMGzA1wO1w
RWY4Yas8wi05yMeXUL11X9vdTtcw9xy+uUvcBYNzB1spDHXfiqsJwGpCb3dyoXiK
lU+PuPDx6nUEMc0NJlwj5IivRq1/tcWImICqO4g5H4B3Ah9M5BGyB/SbAoGABwU9
++7pLoovYy0jI1qZF2rC42qCOeqjw2OvJSCbnOpjZDFqoNB5zk0sAWfOBQ8K/MDV
U9sFy6VHM0wETf3oeyrKbZUA5cY015FdezV3Jo20eNUrB66xW1mPdWsqgXoypbw+
AZD8VXLnX46Y5DSS8K7e38i3M2+SJK5wHO7auP0CgYALoEnuFEVmfu9TqADABz3y
XZT2U2zJS+SXZN1Zmt0HINYz9vtCSv3YO1zZewxgWz7xQKYMJ9DZw+P5fPhTQ+Za
hu4Ss3k1FkDO7/Eg8/5RtegWxlB3kJXIvZseTyx13ly9yb71HQI+PE6O0OTy81aA
WWyDY+jYI2/YSB9T8YBM/Q==
-----END PRIVATE KEY-----
`

const TO_ADDRESS = 'ckt1qyq897k5m53wxzup078jwkucvvsu8kzv55rqqm6glm'

// unlock with subkey and transfer ckb to another address
const run = async () => {
  const servicer = {
    collector: new Collector({
      ckbNodeUrl: 'https://testnet.ckb.dev/rpc',
      ckbIndexerUrl: 'https://testnet.ckb.dev/indexer',
    }),
    aggregator: new Aggregator('https://cota.nervina.dev/aggregator'),
  }
  const fromAddress = addressFromPemKey(MAIN_PRIVATE_KEY)
  console.log('from address: ', fromAddress)

  const subPubkey = exportPubKey(pemToKey(SUB_PRIVATE_KEY))
  console.log('subkey pubkey: ', subPubkey)

  const subkeyAlgIndex = 3

  await sendCKBWithSubkeyUnlock(servicer, SUB_PRIVATE_KEY, subkeyAlgIndex, fromAddress, TO_ADDRESS, BigInt(20000000000), SigAlg.RSA2048)
}

run()
