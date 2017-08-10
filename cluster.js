// cluster.js

// from https://medium.freecodecamp.org/scaling-node-js-applications-8492bd8afadc
// code tested using 'ab -c200 -t10 http://localhost:8080/' while running

const cluster = require('cluster');
const os = require('os');

// Mock DB Call
const numberOfUsersInDB = function() {
  this.count = this.count || 5;
  this.count = this.count * this.count;
  return this.count;
}

if (cluster.isMaster) {
  const cpus = os.cpus().length;

  console.log(`Master PID: ${process.pid}`);
  console.log(`Forking for ${cpus} CPUs`);
  for (let i = 0; i < cpus; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    // checks to see if process crashed and was not manually killed by master process
    if (code !== 0 && !worker.exitedAfterDisconnect) {
      console.log(`Worker ${worker.id} crashed. ` + 'Starting a new worker...');
      cluster.fork();
    }
  });

  // One DB call on one process, refreshed every 10 seconds
  const updateWorkers = () => {
    const usersCount = numberOfUsersInDB();

    Object.values(cluster.workers).forEach(worker => {
      worker.send({ usersCount });
    });
  };

  updateWorkers();
  setInterval(updateWorkers, 10000);

  // Zero-downtime restarts, i.e. when code updates, restart each process individually
  const workers = Object.values(cluster.workers);

  const restartWorker = (workerIndex) => {
    const worker = workers[workerIndex];
    if (!worker) return;

    worker.on('exit', () => {
      if (!worker.exitedAfterDisconnect) return;
      console.log(`Exited process ${worker.process.pid}`);

      cluster.fork().on('listening', () => {
        restartWorker(workerIndex + 1);
      });
    });

    worker.disconnect();
  };

  restartWorker(0);

  //Broadcast messages to all workers
  // Object.values(cluster.workers).forEach(worker => {
  //   worker.send(`Hello Worker ${worker.id}`);
  // });

} else {
  require('./server');
}
