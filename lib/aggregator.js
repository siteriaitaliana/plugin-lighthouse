'use strict';

class Aggregator {
  constructor(statsHelpers) {
    this.statsHelpers = statsHelpers;
    this.statsPerType = {};
    this.total = {};
    this.groups = {};
  }

  addToAggregate(gpsiData, group) {
    if (this.groups[group] === undefined) {
      this.groups[group] = {};
    }
    this.statsHelpers.pushGroupStats(
      this.statsPerType,
      this.groups[group],
      'SPEED.score',
      gpsiData.ruleGroups['SPEED'].score
    );
    this.statsHelpers.pushStats(
      this.total,
      'SPEED.score',
      gpsiData.ruleGroups['SPEED'].score
    );
  }

  summarize() {
    if (!this.total.SPEED) return undefined;

    const summary = {};
    this.statsHelpers.setStatsSummary(
      summary,
      'groups.total.SPEED.score',
      this.total.SPEED.score
    );
    // TODO add GPSI score per group
    return summary;
  }
}

module.exports = Aggregator;
