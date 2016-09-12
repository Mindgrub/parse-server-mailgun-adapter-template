var Mailgun = require('mailgun-js');
var mailcomposer = require('mailcomposer');

const yearInMilliseconds = 1000 * 60 * 60 * 24 * 365.25;

var SimpleMailgunAdapter = mailgunOptions => {
    if (!mailgunOptions || !mailgunOptions.apiKey || !mailgunOptions.domain || !mailgunOptions.fromAddress) {
        throw 'SimpleMailgunAdapter requires an API Key, domain, and fromAddress.';
    }

    mailgunOptions.verificationSubject =
        mailgunOptions.verificationSubject ||
        'Please verify your e-mail for %appname%';
    mailgunOptions.verificationBody =
        mailgunOptions.verificationBody ||
        'Hi,\n\nYou are being asked to confirm the e-mail address %email% ' +
        'with %appname%\n\nClick here to confirm it:\n%link%';
    mailgunOptions.passwordResetSubject =
        mailgunOptions.passwordResetSubject ||
        'Password Reset Request for %appname%';
    mailgunOptions.passwordResetBody =
        mailgunOptions.passwordResetBody ||
        'Hi,\n\nYou requested a password reset for %appname%.\n\nClick here ' +
        'to reset it:\n%link%';


    var mailgun = Mailgun(mailgunOptions);

    function fillVariables(text, options) {
        text = text.replace("%username%", options.user.get("username"));
        text = text.replace("%email%", options.user.get("email"));
        text = text.replace("%appname%", options.appName);
        text = text.replace("%link%", options.link);
        return text;
    }

    var sendVerificationEmail = options => {
        var age = 0;

        if (options.user.get("birthDate") != undefined) {
            var birthday = options.user.get("birthDate");

            var ageDiff = Date.now() - birthday.getTime();
            age = ageDiff / yearInMilliseconds;
        }

        if (age < 13) {
            if (mailgunOptions.verificationBodyHTML) {
                var mail = mailcomposer({
                    from: {name: options.appName, address: mailgunOptions.fromAddress},
                    to: options.user.get("email"),
                    subject: fillVariables(mailgunOptions.verificationSubject, options),
                    text: fillVariables(mailgunOptions.verificationBody, options),
                    html: fillVariables(mailgunOptions.verificationBodyHTML, options)
                });
                return new Promise((resolve, reject) => {
                    mail.build((mailBuildError, message) => {
                        if (mailBuildError) {
                            return reject(mailBuildError);
                        }
                        var dataToSend = {
                            to: options.user.get("email"),
                            message: message.toString('ascii')
                        };
                        mailgun.messages().sendMime(dataToSend, (err, body) => {
                            if (err) {
                                return reject(err);
                            }
                            resolve(body);
                        });
                    }).catch(err => {
                        reject(err);
                    });
                });
            } else {
                var data = {
                    from: mailgunOptions.fromAddress,
                    to: options.user.get("email"),
                    subject: fillVariables(mailgunOptions.verificationSubject, options),
                    text: fillVariables(mailgunOptions.verificationBody, options)
                };
                return new Promise((resolve, reject) => {
                    mailgun.messages().send(data, (err, body) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(body);
                    });
                });
            }
        } else {
            return new Promise.resolve();
        }
    };

    var sendPasswordResetEmail = options => {
        if (mailgunOptions.passwordResetBodyHTML) {
            var mail = mailcomposer({
                from: {name: options.appName, address: mailgunOptions.fromAddress},
                to: options.user.get("email"),
                subject: fillVariables(mailgunOptions.passwordResetSubject, options),
                text: fillVariables(mailgunOptions.passwordResetBody, options),
                html: fillVariables(mailgunOptions.passwordResetBodyHTML, options)
            });
            return new Promise((resolve, reject) => {
                mail.build((mailBuildError, message) => {
                    if (mailBuildError) {
                        return reject(mailBuildError);
                    }
                    var dataToSend = {
                        to: options.user.get("email"),
                        message: message.toString('ascii')
                    };
                    mailgun.messages().sendMime(dataToSend, (err, body) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve(body);
                    });
                }).catch(err => {
                    reject(err);
                });
            });
        } else {
            var data = {
                from: mailgunOptions.fromAddress,
                to: options.user.get("email"),
                subject: fillVariables(mailgunOptions.passwordResetSubject, options),
                text: fillVariables(mailgunOptions.passwordResetBody, options)
            };
            return new Promise((resolve, reject) => {
                mailgun.messages().send(data, (err, body) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(body);
                });
            });
        }
    };

    var sendMail = mail => {
        if (mail.html) {
            var mailC = mailcomposer({
                from: mailgunOptions.fromAddress,
                to: mail.to,
                subject: mail.subject,
                text: mail.text,
                html: mail.html
            });
            return new Promise((resolve, reject) => {
                mailC.build((mailBuildError, message) => {
                    if (mailBuildError) {
                        return reject(mailBuildError);
                    }
                    var dataToSend = {
                        to: mail.to,
                        message: message.toString('ascii')
                    };
                    mailgun.messages().sendMime(dataToSend, (err, body) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve(body);
                    });
                }).catch(err => {
                    reject(err);
                });
            });
        } else {
            var data = {
                from: mailgunOptions.fromAddress,
                to: mail.to,
                subject: mail.subject,
                text: mail.text
            }
            return new Promise((resolve, reject) => {
                mailgun.messages().send(data, (err, body) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(body);
                });
            });
        }
    };

    return Object.freeze({
        sendVerificationEmail: sendVerificationEmail,
        sendPasswordResetEmail: sendPasswordResetEmail,
        sendMail: sendMail
    });
};

module.exports = SimpleMailgunAdapter
