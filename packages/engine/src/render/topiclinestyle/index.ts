import { BRANCHCONNECTION, CONFIG } from "../../common/constants/index";
import config from "../../common/config";

import { bight } from "./bight";
import { brace } from "./brace";
import { brace2 } from "./brace2";
import { brace3 } from "./brace3";
import { brace4 } from "./brace4";
import { brace5 } from "./brace5";
import { calloutLine } from "./calloutline";
import { curve } from "./curve";
import { elbow } from "./elbow";
import { fold } from "./fold";
import { fold2 } from "./fold2";
import { horizontal } from "./horizontal";
import { none } from "./none";
import { roundedelbow } from "./roundedelbow";
import { roundedfold } from "./roundedfold";
import { straight } from "./straight";

const TopicLineStyle = {
  [BRANCHCONNECTION.CALLOUTLINE]: calloutLine,
  [BRANCHCONNECTION.HORIZONTAL]: horizontal,
  [BRANCHCONNECTION.STRAIGHT]: straight,
  [BRANCHCONNECTION.CURVE]: curve,
  [BRANCHCONNECTION.BIGHT]: bight,
  [BRANCHCONNECTION.BRACE]: brace,
  [BRANCHCONNECTION.BRACE2]: brace2,
  [BRANCHCONNECTION.BRACE3]: brace3,
  [BRANCHCONNECTION.BRACE4]: brace4,
  [BRANCHCONNECTION.BRACE5]: brace5,
  [BRANCHCONNECTION.ELBOW]: elbow,
  [BRANCHCONNECTION.FOLD]: fold,
  [BRANCHCONNECTION.FOLD2]: fold2,
  [BRANCHCONNECTION.NONE]: none,
  [BRANCHCONNECTION.ROUNDEDELBOW]: roundedelbow,
  [BRANCHCONNECTION.ROUNDEDFOLD]: roundedfold,
};
export const getTopicLineStyle = (key) => {
  if (!TopicLineStyle[key]) {
    config.get(CONFIG.LOGGER).warn(`Unsupported topic line style: ${key}`);
    return TopicLineStyle[BRANCHCONNECTION.CURVE];
  }
  return TopicLineStyle[key].bind(TopicLineStyle);
};
