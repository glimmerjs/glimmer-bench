import Application, { RuntimeCompilerLoader, DOMBuilder, SyncRenderer } from '@glimmer/application';
import Resolver, { BasicModuleRegistry } from '@glimmer/resolver';
import moduleMap from '../config/module-map';
import resolverConfiguration from '../config/resolver-configuration';


export default class App extends Application {
  constructor() {
    let moduleRegistry = new BasicModuleRegistry(moduleMap);
    let resolver = new Resolver(resolverConfiguration, moduleRegistry);
    let loader = new RuntimeCompilerLoader(resolver);
    let builder = new DOMBuilder({ element: document.body, nextSibling: null });
    let renderer = new SyncRenderer();
    super({
      builder,
      renderer,
      loader,
      resolver,
      rootName: resolverConfiguration.app.rootName
    });
  }
}
