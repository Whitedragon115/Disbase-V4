const axios = require('axios');
const fs = require('fs');
const path = require('path');
const logger = require('../function/log.js');

const { CloudreveApiUrl, CloudreveUploadUri, CloudrevePolicyId, UploadStorageSystem } = require('../config.json');
const { readConfig } = require('./json');
const { unixTimeStamp } = require('./time.js');
const { newImage } = require('./prisma.js');
const { uuid } = require('./tool.js');
require('dotenv').config();

const cloudreveUser = process.env.CLOUDREVE_USER;
const cloudrevePass = process.env.CLOUDREVE_PASSWORD;

let accessToken = "";
let refreshToken = "";

async function refresh() {
    const response = await axios.post(`${CloudreveApiUrl}/session/refresh`, {
        refresh_token: refreshToken
    })

    accessToken = response.data.token.access_token;
    refreshToken = response.data.token.refresh_token;
}

function token(data) {
    return {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            ...data
        }
    }
}

async function upload(filepath, att, uuidStr) {

    const uri = `${CloudreveUploadUri}${uuidStr}${path.extname(att.name)}`;
    const fileSize = fs.statSync(filepath).size;

    const createUpload = await axios.put(`${CloudreveApiUrl}/file/upload`, {
        uri: uri,
        policy_id: CloudrevePolicyId,
        size: fileSize,
    }, token()).catch(err => logger.error(`Cloudreve create upload session failed: ${err}`));

    const fileData = fs.createReadStream(filepath);

    await axios.post(`${CloudreveApiUrl}/file/upload/${createUpload.data.data.session_id}/0`, fileData, token({
        'Content-Type': 'application/octet-stream',
        'Content-Length': fileSize
    })).catch(err => logger.error(`Cloudreve file upload failed: ${err}`));

    return {
        success: true,
        uri: uri
    }
}

async function getDirectLink(uriArr) {
    const createDirectLink = await axios.put(`${CloudreveApiUrl}/file/source`, {
        uris: uriArr
    }, token()).catch(err => logger.error(`Cloudreve create direct link failed: ${err}`));
    return createDirectLink.data.data;
}

async function init() {

    if(UploadStorageSystem !== "cloudreve") return { code: true }

    logger.box('Cloudreve Initialization');

    // Validate Environment Variables
    if (!cloudreveUser || !cloudrevePass) {
        logger.error('Cloudreve credentials are not set in environment variables.');
        return { code: false }
    }

    // Check Cloudreve API Reachability
    const checkAlive = await axios.get(`${CloudreveApiUrl}/site/ping`).catch(() => logger.error('Cloudreve API is unreachable.'));
    if (checkAlive.status != 200) return { code: false }
    logger.success('Cloudreve API is reachable.');

    // Authenticate and Retrieve Tokens
    const getToken = await axios.post(`${CloudreveApiUrl}/session/token`, {
        email: cloudreveUser,
        password: cloudrevePass
    }).catch(() => logger.error('Cloudreve authentication failed'));

    accessToken = getToken.data.data.token.access_token;
    refreshToken = getToken.data.data.token.refresh_token;

    logger.success('Cloudreve authentication successful.');

    // Validate Cloudreve Policy ID
    const policyList = await axios.get(`${CloudreveApiUrl}/user/setting/policies`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    })

    if (!readConfig('CloudrevePolicyId')) {
        logger.warn('CloudrevePolicyId is not set in config.json, below is the list of available policy IDs:')
        policyList.data.data.forEach(dt => {
            logger.info(`Policy Name: ${dt.name} | Policy ID: ${dt.id} | Policy Type: ${dt.type} | Max Size: ${dt.max_size}`);
        })
        return { code: false }
    }

    if (!policyList.data.data.find(dt => dt.id === readConfig('CloudrevePolicyId'))) {
        logger.error('CloudrevePolicyId set in config.json is invalid. Please check the available policy IDs above.');
        return { code: false }
    }

    logger.success('CloudrevePolicyId is set in config.json.');

    return { code: true }
}

module.exports = {
    upload,
    refresh,
    getDirectLink,
    cloudreveInit: init,
}