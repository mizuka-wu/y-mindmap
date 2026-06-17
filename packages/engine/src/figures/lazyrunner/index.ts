import constants from "./constants";
import { LazyRunner } from "./lazyrunner";
// todo TreeTableLayoutInjector

export const lazyRunner = new LazyRunner();

export const runnerConstants = constants;
export default {
  lazyRunner: lazyRunner,
  runnerConstants: runnerConstants,
};
