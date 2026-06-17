import { TOPIC_TYPE, EXTENSION_PROVIDER } from "../../common/constants/index";

import underscore from "underscore";
/**
 * Created by nana on 16/4/12.
 */
export const parseTopic = (topicData, sheet) => {
  let boundary;
  let summary;
  const topic = sheet.createComponent("topic", topicData);
  Object(underscore.each)(
    topicData.children || {},
    (childrenTopicData, type) => {
      if (type !== TOPIC_TYPE.SUMMARY) {
        Object(underscore.each)(childrenTopicData, (childTopicData) => {
          if (!Object(underscore.isEmpty)(childTopicData)) {
            topic.addChildTopic(
              parseTopic(childTopicData, sheet),
              {
                type: type,
              },
              true,
            );
          }
        });
      }
    },
  );
  Object(underscore.each)(topicData.boundaries || {}, (boundaryData) => {
    if (!Object(underscore.isEmpty)(boundaryData)) {
      boundary = topic.addBoundary(boundaryData, true);
      if (
        boundary &&
        boundaryData.style &&
        !Object(underscore.isEmpty)(boundaryData.style)
      ) {
        boundary.initStyle(boundaryData.style);
      }
    }
  });
  Object(underscore.each)(topicData.summaries || {}, (summaryData) => {
    if (!Object(underscore.isEmpty)(summaryData)) {
      summary = topic.addSummary(summaryData, true);
      if (
        summary &&
        summaryData.style &&
        !Object(underscore.isEmpty)(summaryData.style)
      ) {
        summary.initStyle(summaryData.style);
      }
    }
  });
  //the reason why summary topic is special is that topic.addSummary may fail, so summary should not be added
  Object(underscore.each)(
    (topicData.children || {})[TOPIC_TYPE.SUMMARY],
    (childTopicData) => {
      if (!Object(underscore.isEmpty)(childTopicData)) {
        if (
          topic.summaries().some((summaryModel) => {
            return summaryModel.get("topicId") === childTopicData.id;
          })
        ) {
          topic.addChildTopic(
            parseTopic(childTopicData, sheet),
            {
              type: TOPIC_TYPE.SUMMARY,
            },
            true,
          );
        }
      }
    },
  );
  topic.initMarkersDataForLegend();
  let hasMathJaxData;
  if (topicData.extensions) {
    hasMathJaxData = topicData.extensions.some((extensionData) => {
      return (
        extensionData && extensionData.provider === EXTENSION_PROVIDER.MATH_JAX
      );
    });
  }
  if (
    !Object(underscore.isEmpty)(topicData.image) &&
    topicData.image.src &&
    !hasMathJaxData
  ) {
    topic.addImage(topicData.image, true);
  }
  //根据不同的provider做add
  const provider = {
    "org.xmind.ui.taskInfo": topic.addTaskInfo,
    "org.xmind.ui.audionotes": topic.addAudioNotes,
    "org.xmind.ui.map.unbalanced": topic.addMapUnbalanced,
    //todo more extension
  };
  Object(underscore.each)(topicData.extensions || [], (extensionData) => {
    if (
      !Object(underscore.isEmpty)(extensionData) &&
      extensionData.provider &&
      provider[extensionData.provider]
    ) {
      provider[extensionData.provider].bind(topic)(extensionData, true);
    }
  });
  if (topicData.style && !Object(underscore.isEmpty)(topicData.style)) {
    topic.initStyle(topicData.style);
  }
  return topic;
};

export default parseTopic;
