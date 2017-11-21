'use strict';

const METRIC_NAMES = [
  'critical-request-chains',
  'first-meaningful-paint',
  'speed-index-metric',
  'estimated-input-latency',
  'first-interactive',
  'consistently-interactive'
];

function replaceAll(str, search, replacement) {
  return str.replace(new RegExp(search, 'g'), replacement);
}

class Aggregator {
  constructor(statsHelpers) {
    this.statsHelpers = statsHelpers;
    this.stats = {};
    this.groups = {};
  }

  addToAggregate(data, group) {
    const stats = this.stats;
    const groups = this.groups;
    const statsHelpers = this.statsHelpers;

    if (groups[group] === undefined) {
      groups[group] = {};
    }

    METRIC_NAMES.forEach(function(metric) {
      if (metric == 'critical-request-chains') {
        statsHelpers.pushGroupStats(
          stats,
          groups[group],
          metric,
          parseInt(data[metric].displayValue)
        );
      } else {
        statsHelpers.pushGroupStats(
          stats,
          groups[group],
          metric,
          parseInt(data[metric].rawValue)
        );
      }
    });
  }

  summarize() {
    const statsHelpers = this.statsHelpers;

    if (
      Object.keys(this.stats).length === 0 ||
      Object.keys(this.groups).length === 0
    )
      return undefined;

    const summary = {
      groups: {}
    };
    const tmp = {};
    for (let group of Object.keys(this.groups)) {
      for (let stat of Object.keys(this.stats)) {
        statsHelpers.setStatsSummary(
          tmp,
          replaceAll(stat, '-', ''),
          this.stats[stat]
        );
      }
      summary.groups[group] = tmp;
    }

    return summary;
  }
}

module.exports = Aggregator;
