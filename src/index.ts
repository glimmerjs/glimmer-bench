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

performance.mark('beforeRender');
app.renderComponent('glimmer-bench', containerElement, null);

app.boot();


  requestAnimationFrame(() => {


    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
         performance.mark('afterPaint');
        });
      })
    })

    setTimeout(() => {
      if (location.search === '?perf.tracing') {
        document.location.href = 'about:blank';
      } else {

        performance.measure('render', 'beforeRender', 'afterPaint');
      }
    }, 100);
  });
