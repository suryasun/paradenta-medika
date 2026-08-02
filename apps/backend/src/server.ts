import { ConfigService } from './shared/config/ConfigService';
import { createApp } from './app';
import { logger } from './shared/logging/logger';

const config = new ConfigService();
const app = createApp(config);

app.listen(config.get('appPort'), () => {
  logger.info('Server started', {
    module: 'bootstrap',
    appName: config.get('appName'),
    port: config.get('appPort'),
  });
});
