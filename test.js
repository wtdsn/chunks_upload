const fs = require('fs')
const http = require('http')
let view = {
  '0': 228,
  '1': 189,
  '2': 160,
  '3': 229,
  '4': 165,
  '5': 189,
  '6': 49,
  '7': 50,
  '8': 51,
  '9': 97,
  '10': 98,
  '11': 99,
  '12': 46,
  '13': 59,
  '14': 63,
  '15': 123,
  '16': 93,
  length: 17
}

http.createServer((req, res) => {
  let bf = Buffer.from(view)
  // const rs = fs.createReadStream('./abc.text')
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
  createFile('./test').then(() => {
    const ws = fs.createWriteStream('./test/2')
    /* fs.unlinkSync('./abc.text') */
    ws.write(bf)
    ws.close(() => {
      console.log("CLOSE");
      setTimeout(() => {
        fs.unlinkSync('./test/2')
      }, 3000)
    })
    /*   fs.access('./test/abc2.text', fs.constants.W_OK, (err) => {
        if (err) {
          console.log('文件被占用或无法写入');
          return;
        }
        console.log('文件可以被访问和写入');
      });
     */
  })
  res.end("123")
}).listen(3001)


// ws.on()

/* rs.on('end', (err) => {
  console.log(err);
  console.log("END");
}) */
// const rs = fs.createReadStream('./abc.text')
// rs.write(ws)
/* console.log(bf); */

/* const fs = require('fs')
/* console.log(fs.mkdirSync('./asd')); */
/* fs.access('./asd', (err) => {
  if (err) {
    fs.mkdir('./asd', (e, s) => {
      console.log(e, s);
    })
  }
  console.log(err);
})  */