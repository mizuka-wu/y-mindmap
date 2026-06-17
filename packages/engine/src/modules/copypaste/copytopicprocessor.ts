/* eslint-disable @typescript-eslint/no-unused-vars */

import { TOPIC_TYPE, STYLE_KEYS } from "../../common/constants/index";

import Util from "../../util";

export class CopyTopicProcessor {
  selectedBranchArray: any;
  generatedData: any;
  wrapedBranchesObj: any;
  groupedSelectedBranchArray: any;
  generatedDataForTopic: any[];
  generatedDataForBoundaryInParent: any[];
  generatedDataForSummaryInParent: any[];
  generatedDataForRelationship: any[];
  constructor(selectedBranchArray) {
    this.selectedBranchArray = selectedBranchArray
      .filter((item, index) => {
        if (item.type === "branch") {
          return true;
        }
      })
      .sort((item1, item2) => {
        const p1 = item1.parent();
        const p2 = item2.parent();
        if (p1 && p1 === p2 && p1.type === "branch") {
          const index1 = p1.model.getChildrenIndexById(item1.model.id);
          const index2 = p1.model.getChildrenIndexById(item2.model.id);
          return index1 - index2;
        }
        return 0;
      });
    this.generatedData = {};
  }
  _generateWrappedBranch(branch) {
    this.wrapedBranchesObj[branch.model.id] ||= {
      branch: branch,
    };
    if (branch.isDetachedBranch()) {
      return;
    }
    let parent = branch.parent();
    let count = 0;
    while (parent && parent.type === "branch" && !parent.isDetachedBranch()) {
      if (this.selectedBranchArray.indexOf(parent) >= 0) {
        const wrapedParentBranch = (this.wrapedBranchesObj[parent.model.id] ||=
          {
            branch: parent,
          });
        if (count === 0) {
          wrapedParentBranch.hasChild = true;
        } else {
          wrapedParentBranch.hasGrandChild = true;
        }
      }
      parent = parent.parent();
      count++;
    }
  }
  _generateMaterial() {
    this.wrapedBranchesObj = {};
    this.selectedBranchArray.forEach((branch) => {
      this._generateWrappedBranch(branch);
    });
    this.groupedSelectedBranchArray = this.selectedBranchArray.filter(
      (item, index) => {
        const parent = item.parent();
        let floating = false;
        if (parent && parent.getChildrenBranchesByType) {
          const fcs = parent.getChildrenBranchesByType(TOPIC_TYPE.DETACHED);
          if (fcs && fcs.length > 0) {
            floating = fcs.includes(item);
          }
        }
        return floating || !this.selectedBranchArray.includes(parent);
      },
    );
  }
  generateData() {
    this._generateMaterial();
    this.generatedDataForTopic = [];
    this.groupedSelectedBranchArray.forEach((branch) => {
      const result = {};
      this._generateDataForTopic(branch, result);
      this.generatedDataForTopic.push(JSON.parse(JSON.stringify(result)));
    });
    const parentBranches: any[] = [];
    this.groupedSelectedBranchArray.forEach((branch) => {
      const parent = branch.parent();
      if (!parentBranches.includes(parent) && parent.type === "branch") {
        parentBranches.push(parent);
      }
    });
    this.generatedDataForBoundaryInParent = [];
    this._generateDataForBoundaryInParent(parentBranches);
    this.generatedDataForSummaryInParent = [];
    this._generateDataForSummaryInParent(parentBranches);
    this.generatedDataForRelationship = [];
    this._generateDataForRelationship(
      this.generatedDataForTopic,
      this.generatedDataForSummaryInParent,
    );
    return {
      topic: this.generatedDataForTopic,
      boundary: this.generatedDataForBoundaryInParent,
      summary: this.generatedDataForSummaryInParent,
      relationship: this.generatedDataForRelationship,
    };
  }
  _generateDataForRelationship(
    generatedDataForTopic,
    generatedDataForSummaryInParent,
  ) {
    const allTopicIds: any[] = [];
    if (generatedDataForTopic) {
      generatedDataForTopic.forEach((branchJson) => {
        allTopicIds.push(...this._extractIds(branchJson, []));
      });
    }
    if (generatedDataForSummaryInParent) {
      generatedDataForSummaryInParent.forEach((summaryJson) => {
        allTopicIds.push(...this._extractIds(summaryJson.st, []));
      });
    }
    const relationships = this.selectedBranchArray[0]
      .getContext()
      .getSheetView().model.attributes.relationships;
    if (relationships) {
      relationships.forEach((relationship) => {
        if (relationship) {
          const end1 = relationship.end1Id;
          const end2 = relationship.end2Id;
          if (allTopicIds.includes(end1) && allTopicIds.includes(end2)) {
            this.generatedDataForRelationship.push(relationship);
          }
        }
      });
    }
  }
  _extractIds(branchJson: any, ids: any[] = []) {
    if (!branchJson) {
      return ids;
    }
    if (!ids.includes(branchJson.id)) {
      ids.push(branchJson.id);
    }
    if (branchJson.children) {
      const children: any[] = [];
      if (branchJson.children[TOPIC_TYPE.ATTACHED]) {
        children.push(...branchJson.children[TOPIC_TYPE.ATTACHED]);
      }
      if (branchJson.children[TOPIC_TYPE.DETACHED]) {
        children.push(...branchJson.children[TOPIC_TYPE.DETACHED]);
      }
      if (branchJson.children[TOPIC_TYPE.CALLOUT]) {
        children.push(...branchJson.children[TOPIC_TYPE.CALLOUT]);
      }
      if (branchJson.children[TOPIC_TYPE.SUMMARY]) {
        children.push(...branchJson.children[TOPIC_TYPE.SUMMARY]);
      }
      children.forEach((child) => {
        if (child) {
          this._extractIds(child, ids);
        }
      });
    }
    return ids;
  }
  _generateDataForBoundaryInParent(parentBranches) {
    parentBranches.forEach((branch) => {
      const children = branch.getChildrenBranchesByType(TOPIC_TYPE.ATTACHED);
      const boundaries = branch.model.attributes.boundaries;
      if (boundaries) {
        boundaries.forEach((b) => {
          if (b && b.range) {
            try {
              const r = b.range.substr(1, 4).split(",");
              const r1 = Number.parseInt(r[0]);
              const r2 = Number.parseInt(r[1]);
              if (r2 < children.length) {
                let boundaryTopics: any[] = [];
                for (let i = r1; i <= r2; i++) {
                  const child = children[i];
                  const selected = this.isAllSelected(child);
                  if (selected) {
                    boundaryTopics.push(child.model.id);
                  } else {
                    boundaryTopics = [];
                    break;
                  }
                }
                if (boundaryTopics.length > 0) {
                  this.generatedDataForBoundaryInParent.push({
                    title: b.title,
                    content: boundaryTopics,
                  });
                }
              }
            } catch (e) {
              //
            }
          }
        });
      }
    });
  }
  _generateDataForSummaryInParent(parentBranches) {
    parentBranches.forEach((branch) => {
      const children = branch.getChildrenBranchesByType(TOPIC_TYPE.ATTACHED);
      const summaries = branch.model.attributes.summaries;
      if (summaries) {
        summaries.forEach((s) => {
          if (s && s.range) {
            try {
              const r = s.range.substr(1, 4).split(",");
              const r1 = Number.parseInt(r[0]);
              const r2 = Number.parseInt(r[1]);
              if (r2 < children.length) {
                let sTopics: any[] = [];
                for (let i = r1; i <= r2; i++) {
                  const child = children[i];
                  const selected = this.isAllSelected(child);
                  if (selected) {
                    sTopics.push(child.model.id);
                  } else {
                    sTopics = [];
                    break;
                  }
                }
                let summaryTopics = branch.model.children(TOPIC_TYPE.SUMMARY);
                summaryTopics = summaryTopics.filter(
                  (st) => st.id === s.topicId,
                );
                if (summaryTopics.length === 1 && sTopics.length > 0) {
                  this.generatedDataForSummaryInParent.push({
                    title: s.title,
                    content: sTopics,
                    st: summaryTopics[0].toJSON(),
                  });
                }
              }
            } catch (e) {
              //
            }
          }
        });
      }
    });
  }
  _generateDataForTopic(branch, result) {
    let _a;
    result.id = branch.model.attributes.id;
    result.title = branch.model.attributes.title;
    result.style = branch.model.attributes.style;
    const attachedChildren = branch.getChildrenBranchesByType(
      TOPIC_TYPE.ATTACHED,
    );
    if (branch.model.attributes.boundaries) {
      result.boundaries = this._transRange(
        branch,
        attachedChildren,
        "boundaries",
      );
    }
    if (branch.model.attributes.summaries) {
      result.summaries = this._transRange(
        branch,
        attachedChildren,
        "summaries",
      );
    }
    const wrapedBranch = this.wrapedBranchesObj[branch.model.id];
    if (wrapedBranch.hasChild) {
      // hasChildMode 指的是: 如果你选中的两个 topic 是直接的父子关系,
      // 则只复制该父亲, 以及选中的子 topic 那棵树, 即包括子 topic 的子孙.
      // 相当于把没有选中的子 topic 树剪掉
      this._transBranchChildrenForHasChildMode(
        branch,
        result,
        TOPIC_TYPE.ATTACHED,
      );
      // this._transBranchChildrenForHasChildMode(branch, result, TOPIC_TYPE.DETACHED)
      this._transBranchChildrenForHasChildMode(
        branch,
        result,
        TOPIC_TYPE.CALLOUT,
      );
      if (result.summaries && result.summaries.length > 0) {
        this._transBranchChildrenForHasChildMode(
          branch,
          result,
          TOPIC_TYPE.SUMMARY,
        );
      }
    } else if (wrapedBranch.hasGrandChild) {
      // hasGrandChild 的情况下只复制自己, 不复制子孙
    } else {
      // 如果没有选中它的孩子和子孙, 就把它整棵树复制下来
      const bmj = branch.model.toJSON();
      for (const key in bmj) {
        if (key === "children") {
          const types = [
            TOPIC_TYPE.ATTACHED,
            TOPIC_TYPE.SUMMARY,
            TOPIC_TYPE.CALLOUT,
          ];
          const processTextTransform = (childMap) => {
            if (childMap) {
              types.forEach((type) => {
                let _a;
                if ((_a = childMap[type]) === null || _a === undefined) {
                  // do nothing
                } else {
                  _a.forEach((child) => {
                    let _a;
                    const transform =
                      (_a = child.style) === null || _a === undefined
                        ? undefined
                        : _a.properties[STYLE_KEYS.TEXT_TRANSFORM];
                    child.title = transform
                      ? Util.getTransformedText(child.title, transform)
                      : child.title;
                    processTextTransform(child[key]);
                  });
                }
              });
            }
          };
          const children = bmj[key];
          processTextTransform(children);
          result[key] = children;
        } else if (key === "title") {
          const transform =
            (_a = bmj.style) === null || _a === undefined
              ? undefined
              : _a.properties[STYLE_KEYS.TEXT_TRANSFORM];
          result[key] = transform
            ? Util.getTransformedText(result.title, transform)
            : bmj[key];
        } else {
          result[key] = bmj[key];
        }
      }
    }
  }
  _transBranchChildrenForHasChildMode(branch, result, type) {
    const children = branch.getChildrenBranchesByType(type);
    if (children && children.length > 0) {
      children.forEach((child) => {
        if (type === TOPIC_TYPE.SUMMARY) {
          // 这个 summary branch 是由 _transRange 得出的
          // 不在 selectedBranchArray 内, 所以尚未 generateWrappedBranch
          this._generateWrappedBranch(child);
        }
        if (this.wrapedBranchesObj[child.model.id]) {
          if (!result.children) {
            result.children = {};
          }
          if (!result.children[type]) {
            result.children[type] = [];
          }
          const itemModelJson = {};
          result.children[type].push(itemModelJson);
          this._generateDataForTopic(child, itemModelJson);
        }
      });
    }
  }
  isAllSelected(branch) {
    const wrapedBranch = this.wrapedBranchesObj[branch.model.id];
    return (
      wrapedBranch && !wrapedBranch.hasChild && !wrapedBranch.hasGrandChild
    );
  }
  _transRange(branch, attachedChildren, type) {
    const rangeModels = branch.model.attributes[type];
    return rangeModels.filter((b) => {
      if (b.range) {
        try {
          const r = b.range.substr(1, 4).split(",");
          const r1 = Number.parseInt(r[0]);
          const r2 = Number.parseInt(r[1]);
          for (let i = r1; i <= r2; i++) {
            const child = attachedChildren[i];
            if (!child || !this.isAllSelected(child)) {
              return false;
            }
          }
          return true;
        } catch (e) {
          //
        }
      }
      return false;
    });
  }
}

export default CopyTopicProcessor;
