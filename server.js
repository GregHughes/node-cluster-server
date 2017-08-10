// server.js

// from https://medium.freecodecamp.org/scaling-node-js-applications-8492bd8afadc
// code tested using 'ab -c200 -t10 http://localhost:8080/' while running

const http = require('http');
const pid = process.pid;

let usersCount;

http.createServer((req, res) => {
  for (let i = 0; i < 1e7; i++); //simulate CPU work
  res.write(`Handled by process ${pid}\n`);
  res.end(`Users: ${usersCount}`);
}).listen(8080, () => {
  console.log(`Started process ${pid}`);
});

// Handler to read message received from master process
process.on('message', msg => {
  // console.log(`Message from master: ${msg}`);
  usersCount = msg.usersCount; // userCount sent to response body on page.
});

//Simulates single instance crashing at random
// setTimeout(() => {
//   process.exit(1)
// }, Math.random() * 10000);
