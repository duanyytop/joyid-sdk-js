function derToIEEE(signature) {
    const rLength = parseInt(signature.substr(6, 2), 16) * 2
    console.log(signature.substr(6, 2))
    console.log('rlen: ', rLength)
    let r = signature.substr(8, rLength)
    console.log('r: ', r)
    let s = signature.substr(12 + rLength)
    console.log('s: ', s)
    r = r.length > 64 ? r.substr(-64) : r.padStart(64, '0')
    s = s.length > 64 ? s.substr(-64) : s.padStart(64, '0')
    const p1363Sig = `${r}${s}`
    return new Uint8Array(
      p1363Sig.match(/[\da-f]{2}/gi).map((h) => parseInt(h, 16))
    )
  }

  const ArrayBufferToHex = (arrayBuffer) => {
    return Array.prototype.map.call(new Uint8Array(arrayBuffer), x => ('00' + x.toString(16)).slice(-2)).join('')
  }


  const derSig = '3044022010a71b13692b64ce1bdfef6d5c6a512a8196b133bb65de2ec2ba5109caf33d98022058e1b97bcafcebfa791b9bb5af2b6650899ff8a25a427a916705c03dc729ecda'
  const ieeeSig = derToIEEE(derSig)

  console.log(ArrayBufferToHex(ieeeSig))

