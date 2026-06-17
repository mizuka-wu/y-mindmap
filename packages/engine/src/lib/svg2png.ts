import { resourceManager } from "../common/resourcemanager";

import * as constants from "../common/constants/index";
import config from "../common/config";

const SVG_DOCTYPE =
  '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';
const cachedImages = {};
class SvgGenerator {
  el: any;
  options: any;
  constructor(el, options: any = {}) {
    this.el = el;
    if (!(this.el instanceof HTMLElement) && !(this.el instanceof SVGElement)) {
      throw new Error(
        "an HTMLElement or SVGElement is required; got " + this.el,
      );
    }
    options.scale = options.scale || 1;
    this.options = options;
  }
  prepareSVGWithDoctype() {
    return this.prepareSVG().then((newSvg) => SVG_DOCTYPE + newSvg);
  }
  prepareSVG() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return Promise.all([this._inlineImages(), this._inlineFonts()]).then(
      ([_, fontFaceCss]) => {
        return this._genSvg(fontFaceCss);
      },
    );
  }
  _genSvg(fontFaceCss?) {
    const outer = document.createElement("div");
    let clone = this.el;
    let width;
    let height;
    if (this.el.tagName === "svg") {
      width = this.options.width || getDimension(this.el, clone, "width");
      height = this.options.height || getDimension(this.el, clone, "height");
    } else if (this.el.getBBox) {
      const box = this.el.getBBox();
      width = box.x + box.width;
      height = box.y + box.height;
      clone.setAttribute(
        "transform",
        clone.getAttribute("transform").replace(/translate\(.*?\)/, ""),
      );
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.appendChild(clone);
      clone = svg;
    } else {
      config
        .get(constants.CONFIG.LOGGER)
        .error("Attempted to render non-SVG element", this.el);
      return;
    }
    clone.setAttribute("version", "1.1");
    if (!clone.getAttribute("xmlns")) {
      clone.setAttributeNS(
        "http://www.w3.org/2000/xmlns/",
        "xmlns",
        "http://www.w3.org/2000/svg",
      );
    }
    if (!clone.getAttribute("xmlns:xlink")) {
      clone.setAttributeNS(
        "http://www.w3.org/2000/xmlns/",
        "xmlns:xlink",
        "http://www.w3.org/1999/xlink",
      );
    }
    if (this.options.responsive) {
      clone.removeAttribute("width");
      clone.removeAttribute("height");
      clone.setAttribute("preserveAspectRatio", "xMinYMin meet");
    } else {
      clone.setAttribute("width", width * this.options.scale);
      clone.setAttribute("height", height * this.options.scale);
    }
    clone.setAttribute(
      "viewBox",
      [this.options.left || 0, this.options.top || 0, width, height].join(" "),
    );
    const fos = clone.querySelectorAll("foreignObject > *");
    for (let i = 0; i < fos.length; i++) {
      if (!fos[i].getAttribute("xmlns")) {
        fos[i].setAttributeNS(
          "http://www.w3.org/2000/xmlns/",
          "xmlns",
          "http://www.w3.org/1999/xhtml",
        );
      }
    }
    outer.appendChild(clone);
    // here all fonts are inlined, so that we can render them properly.
    const defs = document.createElement("defs");
    if (fontFaceCss) {
      const s = document.createElement("style");
      s.setAttribute("type", "text/css");
      s.innerHTML = "<![CDATA[\n" + fontFaceCss + "\n]]>";
      defs.appendChild(s);
    }
    clone.insertBefore(defs, clone.firstChild);
    let outHtml = outer.innerHTML;
    // for safari
    outHtml = outHtml.replace(
      /NS\d+:href/gi,
      'xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href',
    );
    // /[^\u{0009}\u{000a}\u{000d}\u{0020}-\u{D7FF}\u{E000}-\u{FFFD}\u{10000}-\u{10FFFF}]/ug 原始的
    // eslint-disable-next-line no-control-regex
    outHtml = outHtml.replace(
      /[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\uF000-\uFFFF]/g,
      " ",
    );
    return outHtml;
  }
  _inlineImages() {
    return new Promise((resolve) => {
      const images = this.el.querySelectorAll("image");
      let imageCount = images.length;
      if (imageCount === 0) {
        resolve(images);
      }
      const checkDone = () => {
        imageCount--;
        if (imageCount === 0) {
          resolve(images);
        }
      };
      images.forEach((image) => {
        const width =
          parseInt(image.getAttribute("width")) * this.options.scale || 0;
        const height =
          parseInt(image.getAttribute("height")) * this.options.scale || 0;
        const href =
          image.getAttributeNS("http://www.w3.org/1999/xlink", "href") ||
          image.getAttribute("href");
        if (!href) {
          return checkDone();
        }
        if (isExternal(href)) {
          return checkDone();
        }
        const cachedImage = cachedImages[href];
        if (/^data:/.test(href)) {
          return checkDone();
        }
        if (/\.svg$/.test(href)) {
          if (cachedImage) {
            image.setAttributeNS(
              "http://www.w3.org/1999/xlink",
              "href",
              cachedImage.data,
            );
            return checkDone();
          }
          const onLoadSVGImage = () => {
            const dataUri =
              "data:image/svg+xml;base64," +
              window.btoa(reEncode(xhr.responseText));
            cachedImages[href] = {
              data: dataUri,
            };
            image.setAttributeNS(
              "http://www.w3.org/1999/xlink",
              "href",
              dataUri,
            );
            return checkDone();
          };
          const xhr = new XMLHttpRequest();
          xhr.onload = onLoadSVGImage;
          xhr.onerror = checkDone;
          xhr.onabort = checkDone;
          xhr.open("GET", href);
          xhr.send();
          return;
        }
        if (
          cachedImage &&
          cachedImage.width === width &&
          cachedImage.height === height
        ) {
          image.setAttributeNS(
            "http://www.w3.org/1999/xlink",
            "href",
            cachedImage.data,
          );
          return checkDone();
        }
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = href;
        img.onload = function () {
          function resolveSize(minSize, actualSize) {
            let ratio = Math.max(
              minSize.height / actualSize.height,
              minSize.width / actualSize.width,
            );
            ratio = ratio > 0 ? Math.min(1, ratio) : 1;
            return {
              width: actualSize.width * ratio,
              height: actualSize.height * ratio,
            };
          }
          const { width: resolvedWidth, height: resolvedHeight } = resolveSize(
            {
              width,
              height,
            },
            img,
          );
          if (
            cachedImage &&
            cachedImage.width === width &&
            cachedImage.height === height
          ) {
            image.setAttributeNS(
              "http://www.w3.org/1999/xlink",
              "href",
              cachedImage.data,
            );
            return checkDone();
          }
          canvas.width = resolvedWidth;
          canvas.height = resolvedHeight;
          ctx.drawImage(
            img,
            0,
            0,
            img.width,
            img.height,
            0,
            0,
            resolvedWidth,
            resolvedHeight,
          );
          const imageDataUrl = canvas.toDataURL("image/png");
          cachedImages[href] = {
            data: imageDataUrl,
            width: resolvedWidth,
            height: resolvedHeight,
          };
          image.setAttributeNS(
            "http://www.w3.org/1999/xlink",
            "href",
            imageDataUrl,
          );
          return checkDone();
        };
        img.onerror = function () {
          config.get(constants.CONFIG.LOGGER).error("Could not load " + href);
          checkDone();
        };
      });
    });
  }
  async _inlineFonts() {
    // if (resourceManager.hasFontFaceGenerator()) {
    const fontFamilies = this.options.fonts;
    if (fontFamilies && fontFamilies.length > 0) {
      const fontTasks = [];
      fontFamilies.forEach((fontFamily) => {
        fontTasks.push(resourceManager.getFontFaces(fontFamily));
      });
      return Promise.all(fontTasks).then((fontFaces) => {
        let css = "";
        fontFaces.forEach((ffs) => {
          if (Array.isArray(ffs)) {
            ffs.forEach((fontFaceCss) => {
              css = css + fontFaceCss + "\n";
            });
          }
        });
        return css;
      });
    }
    // }
  }
}
function isExternal(url) {
  return (
    url &&
    url.lastIndexOf("http", 0) === 0 &&
    url.lastIndexOf(window.location.host) === -1
  );
}
function reEncode(data) {
  data = encodeURIComponent(data);
  data = data.replace(/%([0-9A-F]{2})/g, function (match, p1) {
    const c = String.fromCharCode(("0x" + p1) as any);
    if (c === "%") {
      return "%25";
    } else {
      return c;
    }
  });
  return decodeURIComponent(data);
}
function getDimension(el, clone, dim) {
  const v =
    (el.viewBox && el.viewBox.baseVal && el.viewBox.baseVal[dim]) ||
    (clone.getAttribute(dim) !== null &&
      !clone.getAttribute(dim).match(/%$/) &&
      parseFloat(clone.getAttribute(dim))) ||
    el.getBoundingClientRect()[dim] ||
    parseInt(clone.style[dim]) ||
    parseInt(window.getComputedStyle(el).getPropertyValue(dim));
  if (typeof v === "undefined" || v === null || isNaN(parseFloat(v))) {
    return 0;
  } else {
    return v;
  }
}
function isWebKit() {
  const ua = navigator.userAgent;
  return ua.includes("WebKit") && !ua.includes("Edge");
}
function newSvg(el, options = {}) {
  const svgGenerator = new SvgGenerator(el, options);
  return svgGenerator.prepareSVGWithDoctype();
}
function newSvgWithoutDoctype(el, options = {}) {
  const svgGenerator = new SvgGenerator(el, options);
  return new Promise((resolve) => resolve(svgGenerator._genSvg()));
}
function svgAsDataUri(el, options: any = {}) {
  if (options.isPureSVG) {
    return new Promise((res) => res(null)).then(() => {
      return svgToBase64(SVG_DOCTYPE + el.outerHTML);
    });
  } else {
    return newSvg(el, options).then((svg) => {
      return svgToBase64(svg);
    });
  }
  function svgToBase64(svgDOMString) {
    if (!isWebKit()) {
      return "data:image/svg+xml;base64," + window.btoa(reEncode(svgDOMString));
    } else {
      return "data:image/svg+xml," + encodeURIComponent(svgDOMString);
    }
  }
}
const TILE_SIZE = 10000; // 16384
function iDiv(a, b) {
  return (a - (a % b)) / b;
}
function iMod(a, b) {
  return a % b;
}
function drawImage2Canvas(srcImg, sw, sh, destCanvas, dw, dh) {
  const destCanvasCtx = destCanvas.getContext("2d");
  const tileCanvas = document.createElement("canvas");
  const tileWidth = Math.min(TILE_SIZE, dw);
  const tileHeight = Math.min(TILE_SIZE, dh);
  tileCanvas.width = tileWidth;
  tileCanvas.height = tileHeight;
  const tileCanvasCtx = tileCanvas.getContext("2d");
  const xCount = iDiv(dw, tileWidth) + (iMod(dw, tileWidth) !== 0 ? 1 : 0);
  const yCount = iDiv(dh, tileHeight) + (iMod(dh, tileHeight) !== 0 ? 1 : 0);
  const tileSrcWidth = (sw / dw) * tileWidth;
  const tileSrcHeight = (sh / dh) * tileHeight;
  destCanvasCtx.clearRect(0, 0, dw, dh);
  for (let j = 0; j < yCount; j++) {
    for (let i = 0; i < xCount; i++) {
      tileCanvasCtx.clearRect(0, 0, tileWidth, tileHeight);
      tileCanvasCtx.drawImage(
        srcImg,
        i * tileSrcWidth,
        j * tileSrcHeight,
        tileSrcWidth,
        tileSrcHeight,
        0,
        0,
        tileWidth,
        tileHeight,
      );
      destCanvasCtx.drawImage(tileCanvas, i * tileWidth, j * tileHeight);
    }
  }
}
function svgAsPngUri(el, options: any = {}) {
  options.encoderType = options.encoderType || "image/png";
  options.encoderOptions = options.encoderOptions || 0.8;
  return new Promise((resolve) => {
    svgAsDataUri(el, options).then((svgDataUri) => {
      const image = new Image();
      image.onload = function () {
        //TODO fontLoaded => painted => use the svg image
        const convertToPng = function (src, w, h, hidpi) {
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          const contextScale = hidpi / 96;
          canvas.width = w * contextScale;
          canvas.height = h * contextScale;
          //context.scale(contextScale, contextScale)
          if (options.canvg) {
            options.canvg(canvas, src);
          } else {
            drawImage2Canvas(src, w, h, canvas, canvas.width, canvas.height);
          }
          if (options.backgroundColor) {
            context.globalCompositeOperation = "destination-over";
            context.fillStyle = options.backgroundColor;
            context.fillRect(0, 0, canvas.width, canvas.height);
          }
          let png;
          try {
            png = canvas.toDataURL(options.encoderType, options.encoderOptions);
          } catch (e) {
            /* global */
            if (e.name == "SecurityError") {
              config
                .get(constants.CONFIG.LOGGER)
                .error(
                  "Rendered SVG images cannot be downloaded in this browser.",
                );
              return;
            }
          } finally {
            resolve(png);
          }
        };
        setTimeout(
          () => convertToPng(image, image.width, image.height, options.hidpi),
          100,
        );
      };
      image.onerror = function () {
        config
          .get(constants.CONFIG.LOGGER)
          .error(
            "There was an error loading the data URI as an image on the following SVG\n",
            "Open the following link to see browser's diagnosis\n",
            svgDataUri,
          );
      };
      image.src = svgDataUri;
    });
  });
}
/* harmony default export */
export const svg2png = {
  newSvg,
  newSvgWithoutDoctype,
  svgAsDataUri,
  svgAsPngUri,
};

export default svg2png;
