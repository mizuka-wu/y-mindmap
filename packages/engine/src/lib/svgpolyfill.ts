import SVG from 'svg.js';
import 'svg.filter.js';

SVG.defaults.attrs.stroke = 'none';
const Text = SVG.Text;
SVG.Text = SVG.invent({
  inherit: Text,
  create: function (this: SVG.Text) {
    // eslint-disable-next-line prefer-rest-params
    (Text as unknown as () => number).apply(this, arguments);
    this.style('user-select', 'none');
    this.style('cursor', 'default');
    this.style('webkit-user-select', 'none');
    this.style('moz-user-select', 'none');
  },
});

export default SVG;
