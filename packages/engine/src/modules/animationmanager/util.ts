import anime from "animejs/lib/anime.es";

export function executeHighLightSelectBoxProcess(selectBox, options: any = {}) {
  const animation = anime({
    targets: [selectBox],
    duration: 400,
    easing: "easeOutQuad",
    strokeWidth: options.toStrokeWidth || 3,
    stroke: "#ef3420",
  });
  animation.finished.then(() => {
    animation.reverse();
    animation.play();
  });
  return {
    reverse: () => {},
    kill: () => {
      animation.seek(0);
      // animation.remove(selectBox);
    },
  };
}
