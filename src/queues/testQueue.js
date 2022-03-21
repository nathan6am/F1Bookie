import { createRequire } from "module";
const require = createRequire(import.meta.url);
require("dotenv").config();
console.log(process.env.REDIS_QUEUE_URL);
const Queue = require("bull");

const testQueue = new Queue("test", process.env.REDIS_QUEUE_URL);

const job = await testQueue.add({
  foo: "bar",
});

testQueue.process(async (job) => {
  console.log(job.data.foo);
  return;
});
