const http = require('http')
const qs = require('querystring')
const fs = require('fs')

const getQ = new Map()
const postQ = new Map()
// 不限制监听数量
process.setMaxListeners(100)
const express = {
  get: (route, cb) => {
    getQ.set(route, cb)
  },
  post: (route, cb) => {
    postQ.set(route, cb)
  },
  entry: (req, res) => {
    res.send = function (data) {
      res.setHeader('Access-Control-Allow-Origin', "*")
      res.setHeader('Access-Control-Allow-Headers', "*")

      if (data instanceof Object)
        res.end(JSON.stringify(data))
      else {
        res.end(data)
      }
    }


    let [path, query] = req.url.split('?')
    req.query = qs.parse(query)

    // parseGet
    if (req.method === 'GET') {
      if (getQ.has(path)) {
        getQ.get(path)(req, res)
      } else {
        res.end('404')
      }
    } else {
      // parse Post
      if (postQ.has(path)) {
        let data = ''
        req.on('data', (d) => {
          data += d
        })
        req.on('end', () => {
          req.body = (data && JSON.parse(data)) || null
          postQ.get(path)(req, res)
        })
      } else {
        res.end('404')
      }
    }
  }
}

express.get('/', (req, res) => {
  res.send({
    code: 1,
    data: req.query
  })
})

express.post('/upload', (req, res) => {
  let { view, length, name } = req.body
  view.length = length
  const ws = fs.createWriteStream('./tem/' + name)
  ws.write(Buffer.from(view))
  res.send({
    code: 1,
    data: req.body
  })
})

express.post('/uploadChunks', async (req, res) => {
  let { index, name, chunk, length } = req.body
  chunk.length = length
  await createFile(`./tem/${name}`)
  const ws = fs.createWriteStream(`./tem/${name}/${index + name}`)
  ws.write(Buffer.from(chunk), (err) => {
    ws.close()
    if (!err) {
      res.send({
        code: 1,
        data: {
          index,
          name,
          chunk,
          length
        }
      })
    } else {
      res.send({
        code: 0,
        msg: "写入失败",
        data: {
          index,
          name,
          length
        }
      })
    }
  })
  return
})

function createFile(path) {
  return new Promise((r) => {
    fs.access(path, (err) => {
      if (err) {
        fs.mkdir(path, (e, s) => {
          r()
        })
      }
      r()
    })
  })
}

express.get('/finishUpload', async (req, res) => {
  let { name, len } = req.query
  let data = await merge(name, len)

  fs.rmdirSync(`./tem/${name}`)
  res.send({
    code: 1,
    data
  })
  return
})

async function merge(name, len) {
  // let size = 1024 * 1024
  const ws = fs.createWriteStream('./static/' + name)
  for (let i = 0; i < len; i++) {
    await pipe(`./tem/${name}/${i + name}`, ws)
  }
  ws.close()
  return {
    code: 1,
    msg: "Merge suc"
  }
}

function pipe(path, ws) {
  return new Promise((r) => {
    let rs = fs.createReadStream(path)

    rs.on('end', () => {
      rs.close()
      // ws.close()
      // r()
      fs.unlink(path, () => {
        r()
      })
    })
    // ws.write()
    rs.pipe(ws, {
      end: false
    })
  })
}

http.createServer(express.entry).listen(3000, () => {
  console.log("visit at localhost:3000");
})