export class LayoutCell {
  children: any[];
  position: { x: number; y: number };
  size: { width: number; height: number };
  layout: any;
  layoutData: any;
  prefSize: any;
  _parent: any;
  _testName: string;
  constructor() {
    this.children = [];
    this.position = {
      x: 0,
      y: 0,
    };
    this.size = {
      width: -1,
      height: -1,
    };
  }
  add(child) {
    this.children.push(child);
    child._parent = this;
  }
  remove(child) {
    this.children.splice(this.children.indexOf(child));
    child._parent = null;
  }
  removeAll() {
    this.children.forEach((child) => {
      child._parent = null;
      child.removeAll();
    });
    this.children.length = 0;
  }
  getChildren() {
    return [...this.children];
  }
  setLayout(layout) {
    this.layout = layout;
  }
  setLayoutData(layoutData) {
    this.layoutData = layoutData;
  }
  getLayout() {
    return this.layout;
  }
  getLayoutData() {
    return this.layoutData;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protectedCalcSize(wHint, hHint) {
    return {
      width: 0,
      height: 0,
    };
  }
  setSize(size) {
    // this.setPreferredSize(size)
    this.size = size;
  }
  getSize() {
    if (this.prefSize) {
      return this.prefSize;
    } else {
      return this.size;
    }
  }
  setPosition(position) {
    this.position = position;
  }
  getPosition() {
    return this.position;
  }
  getPreferredSize(wHint, hHint, flushCache) {
    if (this.prefSize) {
      return this.prefSize;
    } else if (this.layout) {
      return this.layout.computeSize(this, wHint, hHint, flushCache);
    } else {
      return this.protectedCalcSize(wHint, hHint);
    }
  }
  setPreferredSize(preferredSize) {
    if (
      this.prefSize &&
      Object(common_utils.isSameSize)(this.prefSize, preferredSize)
    ) {
      return;
    }
    this.prefSize = preferredSize;
  }
  invalidate(changed) {
    this.prefSize = null;
    if (this._parent && changed) {
      this._parent.invalidate(changed);
    }
  }
}
export class Layout {
  computeSize(cell, wHint, hHint, flushCache) {
    const clientArea = {
      x: 0,
      y: 0,
      width: wHint,
      height: hHint,
    };
    const size = this.protectedLayout(cell, true, clientArea, flushCache);
    if (wHint !== -1) {
      size.width = wHint;
    }
    if (hHint !== -1) {
      size.height = hHint;
    }
    return size;
  }
  layout(cell, flushCache = true) {
    const bounds = Object.assign(
      Object.assign({}, cell.getPosition()),
      cell.getSize(),
    );
    this.protectedLayout(cell, true, bounds, flushCache);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protectedLayout(cell, move, bounds, flushCache) {
    return {
      width: -1,
      height: -1,
    };
  }
  flushCache(cell) {
    const data = cell.getLayoutData();
    if (data) {
      data.flushCache();
    }
  }
}
export class LayoutData {
  widthHint: number;
  heightHint: number;
  cacheWidth: number;
  cacheHeight: number;
  defaultWhint: number;
  defaultHhint: number;
  defaultWidth: number;
  defaultHeight: number;
  currentWhint: number;
  currentHhint: number;
  currentWidth: number;
  currentHeight: number;
  constructor() {
    this.widthHint = -1;
    this.heightHint = -1;
    this.cacheWidth = -1;
    this.cacheHeight = -1;
    this.defaultWhint = -1;
    this.defaultHhint = -1;
    this.defaultWidth = -1;
    this.defaultHeight = -1;
    this.currentWhint = -1;
    this.currentHhint = -1;
    this.currentWidth = -1;
    this.currentHeight = -1;
  }
  computeSize(cell, wHint, hHint, flushCache) {
    if (this.cacheWidth !== -1 && this.cacheHeight !== -1) {
      return;
    }
    if (wHint === this.widthHint && hHint === this.heightHint) {
      if (
        this.defaultWidth === -1 ||
        this.defaultHeight === -1 ||
        wHint !== this.defaultWhint ||
        hHint !== this.defaultHhint
      ) {
        const size = cell.getPreferredSize(wHint, hHint, flushCache) || {
          width: -1,
          height: -1,
        };
        this.defaultWhint = wHint;
        this.defaultHhint = hHint;
        this.defaultWidth = size.width;
        this.defaultHeight = size.height;
      }
      this.cacheWidth = this.defaultWidth;
      this.cacheHeight = this.defaultHeight;
      return;
    }
    if (
      this.currentWidth === -1 ||
      this.currentHeight === -1 ||
      wHint !== this.currentWhint ||
      hHint !== this.currentHhint
    ) {
      const size = cell.getPreferredSize(wHint, hHint, flushCache);
      this.currentWhint = wHint;
      this.currentHhint = hHint;
      this.currentWidth = size.width;
      this.currentHeight = size.height;
    }
    this.cacheWidth = this.currentWidth;
    this.cacheHeight = this.currentHeight;
  }
  flushCache() {
    this.cacheWidth = this.cacheHeight = -1;
    this.defaultWidth = this.defaultHeight = -1;
    this.currentWidth = this.currentHeight = -1;
  }
}
