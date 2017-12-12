import Component, { tracked } from "@glimmer/component";

export default class GlimmerBench extends Component {
  nav = document.getElementById('links')

  @tracked
  results = [];
  item = 0
  constructor(injections) {
    super(injections);
    window['fetch']('/api/top').then((result) => result.json()).then((data) => {
      performance.mark('didFetch');
      this.results = data.data;
    });
  }

  didUpdate() {
    performance.mark('didUpdate');
  }
}
