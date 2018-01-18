const request = require('request-promise-native');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.appaloosa-store.com';

const onError = (err) => {
    console.log(err);
};

const getUploadForm = (token) => request.get(`${BASE_URL}/api/upload_binary_form.json?token=${token}`).then(form => JSON.parse(form));

const uploadFile = (filepath, data) => {
    const url = data.url;

    const formData = {
        policy: data.policy,
        success_action_status: data.success_action_status,
        'Content-Type': data.content_type,
        signature: data.signature,
        'AWSAccessKeyId': data.access_key,
        key: data.key,
        acl: data.acl,
        file: fs.createReadStream(filepath)
    };

    const req = {
        url,
        formData
    };

    return request.post(req).then(() => ({
        filename: path.basename(filepath),
        key: formData.key
    }));
};

const notifyAppaloosa = (filename, token, key) => {
    key = key.replace('${filename}', filename);
    const body = { token, key };

    const options = {
        method: 'POST',
        uri: `${BASE_URL}/api/on_binary_upload`,
        body,
        json: true
    };

    return request(options).then((notification) => ({ filename, token, notification }));
};

const getNotificationUpdate = (id, token) => {
    const url = `${BASE_URL}/mobile_application_updates/${id}.json?token=${token}`;
    return request.get(url);
};

const handleUpdate = (update) => {
    const { filename, token, notification } = update;
    return new Promise((resolve, reject) => {

        if (notification.status > 4) {
            console.log('------------- Error -----------------');
            return reject(notification.status_message);
        }

        if (!notification.application_id) {
            setTimeout(() => {
                getNotificationUpdate(notification.id, token).then((notif) => {
                    if (!notif) {
                        console.log('------------- Error -----------------');
                        return notification.status_message;
                    }

                    console.log(notification.status_message);

                    return handleUpdate({
                        filename,
                        token,
                        notification: JSON.parse(notif)
                    }).then(resolve).catch(reject);

                });
            }, 2000);


        } else {
            return resolve(notification);
        }
    });
};

const publish = (notification, token, groups, changelog) => {
    // console.log(notification);
    // console.log(token);
    // console.log(changelog);
    // console.log(groups);

    const body = {
        id: notification.id,
        token,
        mobile_application_update: {
            changelog,
            group_names:groups
        }
    };

    const options = {
        method: 'POST',
        uri: `${BASE_URL}/api/publish_update.json`,
        body,
        json: true
    };

    return request.post(options);
};

const upload = (token, filepath, groups, changes) => {
    return getUploadForm(token)
        .then(uploadFile.bind(this, filepath))
        .then(metadata => notifyAppaloosa(metadata.filename, token, metadata.key))
        .then(handleUpdate)
        .then(notification => publish(notification, token, groups, changes))
        .then(result => console.log(result))
        .catch(onError);
};

module.exports = {
    upload
};

/**
 * TESTING
 * */

/*const token = '{APPALOOSA_TOKEN}';
const filepath = '{PATH_TO_YOUR_PACKAGE}/android/build/outputs/apk/release/android-release.apk';
const groups = [ '{APPALOOSA_GROUP}' ];
const changes = '{CHANGELOG}';
upload(token, filepath, groups, changes);*/
