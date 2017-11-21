'use strict';

const fs = require('fs');
const path = require('path');
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const filterRegistry = require('../../lib/support/filterRegistry');
const aggregator = require('./aggregator');

const DEFAULT_SUMMARY_METRICS = [
  'criticalrequestchains',
  'firstmeaningfulpaint',
  'speedindexmetric',
  'estimatedinputlatency',
  'firstinteractive',
  'consistentlyinteractive'
];
const PORT = '9222';
const flags = {
  port: PORT,
  chromeFlags: [
    `--remote-debugging-port=${PORT}`,
    //‘--disable-web-security’,
    //‘--disable-device-discovery-notifications’,
    //‘--acceptSslCerts’,
    '--no-sandbox',
    //‘--ignore-certificate-errors’,
    '--headless',
    '--disable-gpu'
  ]
};

function launchChromeAndRunLighthouse(url, flags = {}, config = null) {
  return chromeLauncher.launch(flags).then(chrome => {
    return lighthouse(url, flags, config).then(results =>
      chrome.kill().then(() => results)
    );
  });
}

module.exports = {
  name() {
    return 'lighthouse';
  },
  open(context) {
    this.make = context.messageMaker('lighthouse').make;
    this.log = context.intel.getLogger('sitespeedio.plugin.lighthouse');
    filterRegistry.registerFilterForType(
      DEFAULT_SUMMARY_METRICS,
      'lighthouse.summary'
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
        queue.postMessage(
          make('html.pug', {
            id: 'lighthouse',
            name: 'Lighthouse',
            pug: this.pug,
            type: 'pageSummary'
          })
        );
        break;
      }
      case 'url': {
        const config = {
          passes: [
            {
              recordTrace: true,
              pauseAfterLoadMs: 5250,
              networkQuietThresholdMs: 5250,
              cpuQuietThresholdMs: 5250,
              useThrottling: true,
              gatherers: []
            }
          ],
          audits: [
            'critical-request-chains',
            'first-meaningful-paint',
            'speed-index-metric',
            'estimated-input-latency',
            'first-interactive',
            'consistently-interactive'
          ]
        };
        const url = message.url;
        const group = message.group;
        log.info('Collecting Lighthouse result');
        return launchChromeAndRunLighthouse(url, flags, config)
          .then(results => {
            aggregator.addToAggregate(results.audits, group);
            const summary = aggregator.summarize();
            if (summary) {
              for (let group of Object.keys(summary.groups)) {
                queue.postMessage(
                  make('lighthouse.pageSummary', summary.groups[group], {
                    url,
                    group
                  })
                );
              }
            }
            log.info('Finished collecting Lighthouse result');
          })
          .catch(err => {
            log.error('Error creating Lighthouse result ', err);
            queue.postMessage(
              make('error', err, {
                url
              })
            );
          });
      }
    }
  }
};
