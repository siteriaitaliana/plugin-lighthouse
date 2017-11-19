'use strict';

const fs = require('fs');
const path = require('path');
const analyzer = require('./analyzer');

const DEFAULT_METRICS_PAGESUMMARY = ['ruleGroups.SPEED.score'];

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

    // Register a logger for this plugin, a unique name so we can filter the log
    this.log = context.intel.getLogger('sitespeedio.plugin.gpsi');

    // Register which metrics we want to send to data storage
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
    switch (message.type) {
      case 'sitespeedio.setup': {
        // Tell the HTML plugin that this plugin got a pug of the type
        // pageSummary = it will be shown on the page summary pahe
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
            // The HTML plugin will pickup every message names *.pageSummary
            // and publish the data under pageInfo.data.*.pageSummary
            // in this case pageInfo.data.gpsi.pageSummary
            make('gpsi.pageSummary', result, {
              url,
              group
            })
          );
        });
      }
    }
  }
};
