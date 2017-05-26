import App from './main';
import { ComponentManager, setPropertyDidChange } from '@glimmer/component';

const app = new App();
const containerElement = document.getElementById('app');

setPropertyDidChange(() => {
  app.scheduleRerender();
});

app.registerInitializer({
  initialize(registry) {
    registry.register(`component-manager:/${app.rootName}/component-managers/main`, ComponentManager)
  }
});

app.renderComponent('glimmer-bench', containerElement, null);

requestAnimationFrame(() => {
  performance.mark('beforeRender');
  app.boot();
  performance.mark('afterRender');
  requestAnimationFrame(() => {
    performance.mark('afterPaint');

    setTimeout(() => {
      if (location.search === '?perf.tracing') {
        document.location.href = 'about:blank';
      } else {
        performance.measure('render', 'beforeRender', 'afterRender');
      }
    }, 100);
  });
});
