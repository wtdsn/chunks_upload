let file
input.onchange = () => {
  file = input.files[0]
}
let finishUpload
button.onclick = () => {
  if (!file) return

  // upload(file)
  sliceUpload(file)
    .then(uploadChunks => {
      return uploadChunks('http://localhost:3000/uploadChunks')
    })
    .then(_finishUpload => {
      finishUpload = _finishUpload
      // 合并
      return finishUpload('http://localhost:3000/finishUpload')
    })
    .then(res => {
      console.log(res);
    })
}
button2.onclick = () => {
  finishUpload('http://localhost:3000/finishUpload')
    .then(res => {
      console.log(res);
    })
}
function upload(file) {
  let names = file.name.split('.')
  names[names.length - 2] += Date.now()
  let read = new FileReader()
  read.readAsArrayBuffer(file)
  read.onload = function () {
    const view = new Uint8Array(read.result)
    fetch('http://localhost:3000/upload', {
      method: "POST",
      body: JSON.stringify({ view: view, length: view.length, name: names.join('.') })
    }).then(res => {
      return res.json()
    })
      .then(res => {
        console.log(res);
      })
  }
}


function sliceUpload(file) {
  let maxLen
  let chunks = []
  let chunkSize = 1024 * 1024  // 1M
  console.log(file.size / chunkSize);
  let names = file.name.split('.')
  names[names.length - 2] += Date.now()
  let name = names.join('.')

  let read = new FileReader()
  read.readAsArrayBuffer(file)

  return new Promise((r) => {
    read.onload = function () {
      const view = new Uint8Array(read.result)
      maxLen = view.length
      console.log("MAXLEN", maxLen);
      for (let i = 0; i < maxLen; i += chunkSize) {
        let c = view.slice(i, i + chunkSize)
        chunks.push({
          index: chunks.length,
          name,
          chunk: c,
          length: c.length
        })
      }
      r(uploadChunks)
    }
  })

  function uploadChunks(url) {
    return Promise.all(chunks.map(v => {
      return fetch(url, {
        method: "POST",
        body: JSON.stringify(v)
      }).then(res => {
        return res.json()
      })
    }))
      .then(res => {
        // 错误重发
        console.log("uploadChunks", res);
      })
      .then(() => {
        return finishUpload
      })
  }

  function finishUpload(url) {
    return fetch(`${url}?name=${name}&len=${chunks.length}`).then(r => r.json())
  }
}

