'use strict';

const gpagespeed = require('gpagespeed');

module.exports = {
  analyzeUrl: function(url, log, options) {
    log.info('Sending url ' + url + ' to test on Page Speed Insights');
    const args = { url };

    if (options.gpsi.key) {
      args.key = options.gpsi.key;
    } else {
      args.nokey = true;
    }

    args.strategy = 'desktop';

    if (options.mobile) {
      args.strategy = 'mobile';
    }

    return gpagespeed(args);
  }
};
