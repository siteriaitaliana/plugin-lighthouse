'use strict';

const Aggregator = require('./aggregator');
const analyzer = require('./analyzer');
const path = require('path');
const DEFAULT_METRICS_PAGESUMMARY = ['ruleGroups.SPEED.score'];
const fs = require('fs');

module.exports = {
  name() {
    return 'gpsi';
  },
  open(context, options) {
    this.make = context.messageMaker('gpsi').make;
    this.options = {
      gpsi: options.gpsi,
      mobile: options.mobile
    };

    this.log = context.intel.getLogger('sitespeedio.plugin.gpsi');
    this.aggregator = new Aggregator(context.statsHelpers);
    context.filterRegistry.registerFilterForType(
      DEFAULT_METRICS_PAGESUMMARY,
      'gpsi.pageSummary'
    );

    this.pug = fs.readFileSync(
      path.resolve(__dirname, 'pug', 'index.pug'),
      'utf8'
    );
  },
  processMessage(message, queue) {
    const make = this.make;
    const log = this.log;
    const aggregator = this.aggregator;
    switch (message.type) {
      case 'sitespeedio.setup': {
        queue.postMessage(
          make('html.pug', {
            id: 'gpsi',
            name: 'GPSI',
            pug: this.pug,
            type: 'pageSummary'
          })
        );
        break;
      }

      case 'url': {
        const url = message.url;
        const group = message.group;
        return analyzer.analyzeUrl(url, log, this.options).then(result => {
          log.info('Got ' + url + ' analysed from Google Page Speed Insights');
          log.verbose('Result from Google Page Speed Insights:%:2j', result);
          queue.postMessage(
            make('gpsi.pageSummary', result, {
              url,
              group
            })
          );
          aggregator.addToAggregate(result, group);
        });
      }

      case 'sitespeedio.summarize': {
        const summary = aggregator.summarize();
        if (summary) {
          queue.postMessage(
            make('gpsi.summary', summary.groups.total, { group: 'total' })
          );
        }
      }
    }
  }
};
