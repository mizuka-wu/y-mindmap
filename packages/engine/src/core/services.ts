import jquery from 'jquery';

import { SERVICE_NAME, MODULE_NAME } from '../common/constants/index';

import type { WorkbookEditor, SheetEditor } from '../type.d';
import type { EditReceiver } from '../modules/editreceiver';

// const resolveStrNodes = (nodes, maxWidth = TOPIC_TITLE_MAX_WIDTH) => {
//   const flatten = (arr) => arr.reduce((a, b) => a.concat(b), [])
//   const getWidth = (nodes) => getNodesSize(nodes).width
//   // 寻找合适的 end，使得对于从 start 到 end 的 string 刚好小于 maxWidth
//   const findNext = (words, start, maxWidth) => {
//     let tmp = maxWidth
//     for (let i = start; i < words.length; i++) {
//       const width = words[i].getWidth()
//       tmp = tmp - width
//       if (tmp < 0) { return i }
//     }
//     return false
//   }
//   const scan = (words) => {
//     const scan1 = (words, start) => {
//       const word = words[start]
//       if (word.getWidth() > maxWidth) {
//         const sepWords = sepWord(word)
//         const lines = scan(sepWords)
//         const lastLine = lines.pop()  // a line is an arr of word
//         const restWord = combineWords(lastLine)
//         words.splice(start, 1, restWord)  // replace the origin word with restWord
//         return [start, lines]             // reScan in the start
//       } else {
//         const end = findNext(words, start, maxWidth) || words.length
//         const line = words.slice(start, end)
//         return [end, [line]]
//       }
//     }
//     let allLines = []
//     for (let i = 0; i < words.length;) {
//       const [newStart, lines] = scan1(words, i)
//       allLines = allLines.concat(lines)
//       i = newStart
//     }
//     return allLines
//   }
//   const newLine = (nodes) => {
//     const width = getWidth(nodes)
//     if (width < maxWidth) { return [nodes] } else {
//       const words = nodes2Words(nodes)
//       const lines = scan(words)
//       const nodesArr = lines.map((words) => {
//         return words.reduce((nodes, word) => nodes.concat(word.getNodes()), [])
//       })
//       return nodesArr
//     }
//   }
//   nodes = separateNodes(nodes)
//   const nodesArr = nodesSplit(nodes, ['\n'])
//   const linesArr = nodesArr.map((nodes) => newLine(nodes))
//   return flatten(linesArr)
// }

/**
 * @param {SheetEditor} context
 * */
export const coreService = (context: SheetEditor) => {
  return {
    [SERVICE_NAME.GET_SVG_DOM_SIZE]: (() => {
      let $svgDomContainer: JQuery<HTMLElement>;
      function initSizeGetterSVGDomContainer() {
        if ($svgDomContainer) {
          return;
        }
        $svgDomContainer = jquery(
          '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">'
        );
        $svgDomContainer.css('visibility', 'hidden');
        context.getAppToolsContainer().append($svgDomContainer);
      }
      return (svgDom: HTMLElement) => {
        initSizeGetterSVGDomContainer();
        const currentContext = (context.parent() as WorkbookEditor).getCurrentSheetEditor();
        if (currentContext !== context) {
          return currentContext.callService(SERVICE_NAME.GET_SVG_DOM_SIZE, svgDom);
        }
        $svgDomContainer[0].innerHTML = svgDom.innerHTML;
        $svgDomContainer.attr({
          width: svgDom.getAttribute('width'),
          height: svgDom.getAttribute('height'),
          viewBox: svgDom.getAttribute('viewBox'),
        });
        const boundingClientRect = $svgDomContainer[0].getBoundingClientRect();
        $svgDomContainer[0].innerHTML = '';
        return {
          width: boundingClientRect.width,
          height: boundingClientRect.height,
        };
      };
    })(),
    /**
     * @description 获取浏览器设定的最小 fontSize，主要用于 chrome 下的兼容
     */
    [SERVICE_NAME.GET_MINIMUM_FONT_SIZE]: (() => {
      const $span = jquery('<span>').css({
        display: 'none',
        fontSize: '1px',
      });
      context.getAppToolsContainer().append($span);
      const minFontSize = Number.parseInt($span.css('fontSize'));
      $span.remove();
      return () => minFontSize;
    })(),
    /**
     * @description 获取透明的遮罩，可以在上面应用样式，屏蔽元素的mouseup，mouseover等事件
     */
    [SERVICE_NAME.GET_VIEW_PORT_COVER]: (() => {
      let $div: JQuery<HTMLElement>;
      return () => {
        if (!$div) {
          $div = jquery('<div>').attr('name', 'viewport-cover').css({
            display: 'none',
          });
          $div.on('contextmenu', e => e.preventDefault());
          context.getAppToolsContainer().append($div);
          $div.on('touchmove', e => {
            e.stopPropagation();
            e.preventDefault();
          });
          $div.on('dragover', e => {
            e.preventDefault();
            e.originalEvent.dataTransfer.dropEffect = 'none';
          });
          $div.on('dragleave', () => $div.hide());
          $div.on('drop', () => false);
        }
        return $div;
      };
    })(),
    [SERVICE_NAME.COPY_TO_CLIPBOARD]: (() => {
      let textArea: HTMLTextAreaElement;
      function createFakeTextArea() {
        const fakeTextArea = document.createElement('textarea');
        context.getAppToolsContainer()[0].appendChild(fakeTextArea);
        fakeTextArea.style.position = 'fixed';
        fakeTextArea.style.top = '-9999px'; //make it focusable and unvisible
        fakeTextArea.setAttribute('readonly', 'true');
        return fakeTextArea;
      }
      function reFocus(e: FocusEvent) {
        context.el.removeEventListener('blur', reFocus);
        setTimeout(() => {
          (e.target as HTMLElement).focus();
        }, 0);
      }
      return (text: string) => {
        if (!textArea) {
          textArea = createFakeTextArea();
        }
        textArea.setAttribute(
          'style',
          context.getModule<EditReceiver>(MODULE_NAME.EDIT_RECEIVER).getInputDOM().getAttribute('style')
        );
        textArea.style.display = 'none';
        context.el.addEventListener('blur', reFocus); //to refocus true editReceiver
        textArea.value = text;
        textArea.focus();
        textArea.select();
        let result;
        try {
          result = document.execCommand('copy');
        } catch (e) {
          console.error(e);
          result = false;
        }
        return result;
      };
    })(),
  };
};

export default coreService;
