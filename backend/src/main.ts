import './environment';
import { createApp } from './app';
import { readConfig } from './config';
async function main() {
  const config = readConfig(),
    app = await createApp();
  await app.listen(config.port, process.env.HOST ?? '127.0.0.1');
  console.log(
    `CampusFind API http://${process.env.HOST ?? '127.0.0.1'}:${config.port}/api/v1; docs: /docs`,
  );
}
void main();
