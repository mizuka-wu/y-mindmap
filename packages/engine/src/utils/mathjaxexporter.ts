import { mathjax } from 'mathjax-full/js/mathjax';
import { TeX } from 'mathjax-full/js/input/tex';
import { SVG } from 'mathjax-full/js/output/svg';
import { liteAdaptor, LiteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages';
import { MathDocument } from 'mathjax-full/js/core/MathDocument';

import * as constants from '../common/constants/index';

import { getTextSize } from './strnodes';
import { utils as langsUtils } from './langs';

const ERROR_MESSAGE_FONT_SIZE = 13;
const ERROR_MESSAGE_TEXT_COLOR = '#FFF';
const ERROR_MESSAGE_BG_COLOR = '#FF2222';
const ERROR_MESSAGE_PADDING = 2;

type IMathJaxRenderOptions = ReturnType<typeof MathJaxRenderer.getDefaultOptions>;

export default class MathJaxRenderer {
  private static readonly texMacros = {
    AA: 'Å',
    alef: '\\aleph',
    alefsym: '\\aleph',
    Alpha: '\\mathrm{A}',
    and: '\\land',
    ang: '\\angle',
    Bbb: '\\mathbb',
    Beta: '\\mathrm{B}',
    bold: '\\mathbf',
    bull: '\\bullet',
    C: '\\mathbb{C}',
    Chi: '\\mathrm{X}',
    clubs: '\\clubsuit',
    cnums: '\\mathbb{C}',
    Complex: '\\mathbb{C}',
    coppa: 'ϙ',
    Coppa: 'Ϙ',
    Dagger: '\\ddagger',
    Digamma: 'Ϝ',
    darr: '\\downarrow',
    dArr: '\\Downarrow',
    Darr: '\\Downarrow',
    diamonds: '\\diamondsuit',
    empty: '\\emptyset',
    Epsilon: '\\mathrm{E}',
    Eta: '\\mathrm{H}',
    euro: '€',
    exist: '\\exists',
    geneuro: '€',
    geneuronarrow: '€',
    geneurowide: '€',
    H: '\\mathbb{H}',
    hAar: '\\Leftrightarrow',
    harr: '\\leftrightarrow',
    Harr: '\\Leftrightarrow',
    hearts: '\\heartsuit',
    image: '\\Im',
    infin: '\\infty',
    Iota: '\\mathrm{I}',
    isin: '\\in',
    Kappa: '\\mathrm{K}',
    koppa: 'ϟ',
    Koppa: 'Ϟ',
    lang: '\\langle',
    larr: '\\leftarrow',
    Larr: '\\Leftarrow',
    lArr: '\\Leftarrow',
    lrarr: '\\leftrightarrow',
    Lrarr: '\\Leftrightarrow',
    lrArr: '\\Leftrightarrow',
    Mu: '\\mathrm{M}',
    N: '\\mathbb{N}',
    natnums: '\\mathbb{N}',
    Nu: '\\mathrm{N}',
    O: '\\emptyset',
    officialeuro: '€',
    Omicron: '\\mathrm{O}',
    or: '\\lor',
    P: '¶',
    pagecolor: ['', 1],
    part: '\\partial',
    plusmn: '\\pm',
    Q: '\\mathbb{Q}',
    R: '\\mathbb{R}',
    rang: '\\rangle',
    rarr: '\\rightarrow',
    Rarr: '\\Rightarrow',
    rArr: '\\Rightarrow',
    real: '\\Re',
    reals: '\\mathbb{R}',
    Reals: '\\mathbb{R}',
    Rho: '\\mathrm{P}',
    sdot: '\\cdot',
    sampi: 'ϡ',
    Sampi: 'Ϡ',
    sect: '\\S',
    spades: '\\spadesuit',
    stigma: 'ϛ',
    Stigma: 'Ϛ',
    sub: '\\subset',
    sube: '\\subseteq',
    supe: '\\supseteq',
    Tau: '\\mathrm{T}',
    textvisiblespace: '␣',
    thetasym: '\\vartheta',
    uarr: '\\uparrow',
    uArr: '\\Uparrow',
    Uarr: '\\Uparrow',
    varcoppa: 'ϙ',
    varstigma: 'ϛ',
    vline: '\\smash{\\large\\lvert}',
    weierp: '\\wp',
    Z: '\\mathbb{Z}',
    Zeta: '\\mathrm{Z}',
    dashint: '\\unicodeInt{x2A0D}',
    ddashint: '\\unicodeInt{x2A0E}',
    oiint: '\\unicodeInt{x222F}',
    oiiint: '\\unicodeInt{x2230}',
    ointctrclockwise: '\\unicodeInt{x2233}',
    unicodeInt: [
      '\\mathop{\\vcenter{\\mathchoice{\\huge\\unicode{#1}\\,}{\\unicode{#1}}{\\unicode{#1}}{\\unicode{#1}}}\\,}\\nolimits',
      1,
    ],
    varointclockwise: '\\unicodeInt{x2232}',
    div: ['\\divsymbol'],
    Re: ['\\mathfrak{R}'],
  };
  public static readonly getDefaultOptions = () => ({
    applyLineBreaks: true,
    autoNumbering: false,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private document: MathDocument<any, any, any>;
  private readonly adaptor: LiteAdaptor;
  private options: IMathJaxRenderOptions;

  constructor(options?: Partial<IMathJaxRenderOptions>) {
    this.options = Object.assign(MathJaxRenderer.getDefaultOptions(), options);
    this.adaptor = liteAdaptor();
    RegisterHTMLHandler(this.adaptor);

    const tex = new TeX({
      packages: AllPackages,
      useLabelIds: true,
      macros: MathJaxRenderer.texMacros,
      tags: this.options.autoNumbering ? 'ams' : undefined,
    });
    const svg = new SVG();
    this.document = mathjax.document('', { InputJax: tex, OutputJax: svg });
  }

  render(str: string) {
    if ((str.includes('\\\\') || str.includes('\\newline')) && this.options.applyLineBreaks) {
      str = `\\displaylines{${str}}`;
    }
    const node = this.document.convert(str, {
      display: true,
      em: 16,
      ex: 8,
      containerWidth: 8 * 16,
    });

    const html = this.adaptor.innerHTML(node);
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'image/svg+xml');
    return doc;
  }
}

class MathJaxExporter {
  mathJaxRender: MathJaxRenderer;
  constructor() {
    this.mathJaxRender = new MathJaxRenderer();
  }
  export(text, options) {
    if (!(text === null || text === undefined ? undefined : text.trim())) {
      return;
    }
    let resultSVGDom;
    let originalErrorMessage;
    let errorCode;
    try {
      resultSVGDom = this.mathJaxRender.render(text.trim()).childNodes[0] as SVGElement;
      const resultErrorWrapperElem = resultSVGDom.querySelector('g[data-mml-node="merror"]');
      originalErrorMessage =
        (resultErrorWrapperElem === null || resultErrorWrapperElem === undefined
          ? undefined
          : resultErrorWrapperElem.getAttribute('data-mjx-error')) ?? '';
      errorCode = originalErrorMessage ? 1 : 0;
      if (errorCode) {
        resultSVGDom = this.generateErrorMessageSVG(options);
      } else {
        const gContainer = resultSVGDom.querySelector('g');
        gContainer.removeAttribute('fill');
        gContainer.removeAttribute('stroke');
      }
    } catch {
      resultSVGDom = this.generateErrorMessageSVG(options);
      originalErrorMessage = 'mathJax runtime error';
      errorCode = 1;
    }
    return {
      result: resultSVGDom,
      errorCode: errorCode,
      errorMessage: originalErrorMessage,
    };
  }
  refreshFallbackImage(branchView /*View.BranchView*/, options: any = {}) {
    const mathJaxView = branchView.topicView.mathJaxView;
    if (!mathJaxView) {
      return;
    }
    mathJaxView.figure.layoutWorker.generateFallbackImageData(mathJaxView, {
      forceRefresh: true,
      isInheritColor: options.isInheritColor,
    });
  }
  generateErrorMessageSVG(options) {
    const errorMessageSVGDom = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    errorMessageSVGDom.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:xlink', 'http://www.w3.org/1999/xlink');
    const errorMessageBgRectDom = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    errorMessageBgRectDom.setAttribute('x', '0');
    errorMessageBgRectDom.setAttribute('y', '0');
    errorMessageBgRectDom.setAttribute('fill', ERROR_MESSAGE_BG_COLOR);
    errorMessageSVGDom.append(errorMessageBgRectDom);
    const errorMessageTextDom = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    errorMessageTextDom.setAttribute('fill', ERROR_MESSAGE_TEXT_COLOR);
    if (options.fontFamily) {
      errorMessageTextDom.setAttribute('font-family', options.fontFamily);
    }
    errorMessageTextDom.setAttribute('font-size', `${ERROR_MESSAGE_FONT_SIZE}`);
    errorMessageSVGDom.append(errorMessageTextDom);
    const errorMessage = langsUtils.translate(options.lang || constants.LANGS.EN_US, 'MATH_JAX_INVALID_EQUATION');
    const errorMessageSize = getTextSize(errorMessage, {
      fontSize: ERROR_MESSAGE_FONT_SIZE,
      fontFamily: options.fontFamily || '',
    });
    const finalWidth = errorMessageSize.width + ERROR_MESSAGE_PADDING * 2;
    const finalHeight = errorMessageSize.height + ERROR_MESSAGE_PADDING * 2;
    errorMessageSVGDom.setAttribute('width', `${finalWidth}`);
    errorMessageSVGDom.setAttribute('height', `${finalHeight}`);
    errorMessageSVGDom.setAttribute('viewBox', `0 0 ${finalWidth} ${finalHeight}`);
    errorMessageBgRectDom.setAttribute('width', `${finalWidth}`);
    errorMessageBgRectDom.setAttribute('height', `${finalHeight}`);
    errorMessageTextDom.textContent = errorMessage;
    errorMessageTextDom.setAttribute('x', `${ERROR_MESSAGE_PADDING}`);
    errorMessageTextDom.setAttribute('y', `${errorMessageSize.height}`);
    return errorMessageSVGDom;
  }
}
export const mathJaxExporterUtil = new MathJaxExporter();
