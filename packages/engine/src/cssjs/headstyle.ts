import jquery from "jquery";

import embeddedFonts from "../common/embeddedfonts"; //this file will be wrote to head tag

export const headCss = `
.workbook-item{
}

.sb-container {
}

.sb-container>.app-tools-container{
}

.sb-container>.mm-editor {
}

.sb-container>.mm-editor .wallpaper {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: -1;
}

.sb-container [name="viewport-cover"] {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  cursor: -webkit-grabbing;
  cursor: -moz-grabbing;
  cursor: grabbing;
}

.sb-container .edit-receiver {
  position : absolute;
  outline  : none;
  border   : none;
  padding  : 0;
  margin   : 0;
  z-index  : -1;
  resize   : none;
  overflow : hidden;
  -webkit-transform-origin: 0 0;
  transform-origin: 0 0;
  line-height: 1.34em;
  background: transparent;
}

.edit-receiver.bordered {
  box-sizing    : content-box;
  padding       : 6px 3px;
  background    : #fff !important;
  color         : #111 !important;
  outline       : none;
  border        : solid 2px #2ebdff;
  border-radius : 4px;
  margin-top    : -9px;
  margin-left   : -5px;
}

.edit-receiver.matrixlabel {
  box-sizing    : content-box;
  padding       : 6px 3px;
  background    : #fff;
  color         : #111;
  outline       : none;
  border        : none;
  border-radius : 4px;
  margin-top    : -7px;
  margin-left   : -3px;
}

.edit-receiver.boundary {
  box-sizing    : content-box;
  padding       : 6px 3px;
  background    : #fff;
  color         : #111;
  outline       : none;
  border        : solid 2px #2ebdff;
  border-radius : 4px;
  margin-top    : -9px;
  margin-left   : -5px;
}

.sb-container .text-size {
  position: fixed;
  visibility: hidden;
  line-height: 1em;
  margin: 0;
  padding-right: 3px;
  font-family: Helvetica, Arial, sans-serif;
}

.sb-container .text-width {
  position: fixed;
  visibility: hidden;
  padding-right: 3px;
  margin: 0;
}

${embeddedFonts["information-iconfont"]}

.icon-information {
  /* use !important to prevent issues with browser extensions that change fonts */
  font-family: 'information-iconfont' !important;
  speak: none;
  font-style: normal;
  font-weight: normal;
  font-variant: normal;
  text-transform: none;
  line-height: 1;

  /* Better Font Rendering =========== */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* SVG.Text 不支持 css 插入 content, 所以在 informationiconview.js 手动写 */

.icon-href:before {
  content: "\\e900";
}
.icon-file:before {
  content: "\\e901";
}
.icon-jump:before {
  content: "\\e902";
}
.icon-attachment:before {
  content: "\\e903";
}
.icon-audio:before {
  content: "\\e904";
}
.icon-comment:before {
  content: "\\e905";
}
.icon-info_more:before {
  content: "\\e906";
}
.icon-note:before {
  content: "\\e907";
}
.icon-task:before {
  content: "\\e908";
}

`;
export const appendHeadCSS = () => {
  jquery("head").append(
    jquery("<style id='snowbrush_style' type='text/css'></style>").html(
      headCss,
    ),
  );
};

export default appendHeadCSS;
