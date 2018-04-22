'use strict';

const request = require('request');
const _ = require('lodash');
const email = require("emailjs/email");

const user = process.env.EMAIL;
const password = process.env.PASSWORD;


const to = (process.env.TO || '').split(',');

const sites = (process.env.SITES || '').split(',');

var server = email.server.connect({user, password, host: "smtp.gmail.com", ssl: true});

const run = function (fn, timeout = 300) {

    async function loop() {
        try {
            await fn();
        } catch (err) {
            console.error(err);
        }

        setTimeout(loop, timeout * 1000)
    }

    loop();
};

function sendMail(url, err, httpResponse) {
    return server.send({
        text: `SITE PING ERROR\n HOST: ${url}\n STATUS: ${_.get(httpResponse, 'statusCode')}\n\n ${JSON.stringify(err)}`,
        from: `Desktop1 <${user}>`,
        to: _.join(_.map(to, (u) => {
            return `${u} <${u}>`
        }), ', '),
        subject: `Site ${url} didn't respond`
    }, function (err, message) {
        console.error(err || message);
    });
}

const ping = function (url) {

    return async function () {

        const time = Date.now();

        request({method: 'GET', url}, function (err, httpResponse, rawResponse) {

            if (err || _.get(httpResponse, 'statusCode') >= 400) {
                console.error(new Date(), url, 'STATUS:', httpResponse.statusCode, err);
                sendMail(url, err, httpResponse);
            }

            console.log(new Date(), url, 'STATUS: ' + httpResponse.statusCode + ' Response: ' + (Date.now() - time) + ' ms');
        });

    }
};

sites.forEach((site) => {
    run(ping(site));
});
