import * as lib from '../../../../lib/index';

export class MathJaxRenderWorker {
  figure: any;
  svg: any;
  s$mathJaxOutPutNestedSVG: any;
  s$mathJaxActionRect: any;
  constructor(figure) {
    this.figure = figure;
    this.svg = new lib.SVG.G().data('name', 'mathjax-group');
    this.s$mathJaxOutPutNestedSVG = this.svg.put(new lib.SVG.Nested());

    this.s$mathJaxOutPutNestedSVG
      .data('name', 'mathjax-output-nested-svg')
      .attr('xmlns', lib.SVG.ns)
      .attr('xmlns:xlink', lib.SVG.xlink)
      .attr('version', lib.SVG.version);
    this.s$mathJaxActionRect = this.svg.put(new lib.SVG.Rect()).data('name', 'mathjax-action-rect').attr({
      fill: 'none',
      'pointer-events': 'all',
    });
    this.figure.viewController.setElement(this.svg.node);
  }
  work() {
    const parentFigure = this.figure.getParent();
    if (!parentFigure) {
      return;
    }
    if (this.figure.sizeDirty) {
      this.s$mathJaxActionRect.attr(this.figure.size);
      this.s$mathJaxOutPutNestedSVG.attr(this.figure.size);
      this.figure.sizeDirty = false;
    }
    if (this.figure.SVGOutputDirty) {
      this.s$mathJaxOutPutNestedSVG.attr({
        viewBox: this.figure.SVGOutput.getAttribute('viewBox'),
      });
      Array.from(this.figure.SVGOutput.children).forEach((childElem: any) => {
        this.s$mathJaxOutPutNestedSVG.node.appendChild(childElem.cloneNode(true));
      });
      this.figure.SVGOutputDirty = false;
      this.figure.textDirty = false;
    }
    if (this.figure.positionDirty) {
      this.svg.translate(this.figure.position.x, this.figure.position.y);
      this.figure.positionDirty = false;
    }
    if (this.figure.textColorDirty) {
      this.s$mathJaxOutPutNestedSVG.attr('fill', this.figure.textColor);
      this.figure.textColorDirty = false;
    }
    parentFigure.renderWorker.appendChild('mathjax', this.svg);
  }
  getContent() {
    return this.svg;
  }
  dispose() {
    this.svg.remove();
  }
  appendChild(type, childNode) {
    switch (type) {
      case 'resizebox':
        if (childNode.parent !== this.svg) {
          this.svg.add(childNode);
        }
        break;
      default:
        break;
    }
  }
}
