const axios = require('axios');

const myRequest = (requestOptions) => {
    return axios(requestOptions);
};

exports.GET = (url, parameters) => {
    var requestOptions = {
        method: 'get',
        url: url,
        timeout: 0,
        params: parameters
    };

    return myRequest(requestOptions);
};

exports.POST = (url, requestBody) => {
    var requestOptions = {
        method: 'POST',
        url: url,
        timeout: 0,
        data: requestBody
    };

    return myRequest(requestOptions);
};

exports.POSTUseXML = (url, requestBody) => {
    var requestOptions = {
        method: 'POST',
        url: url,
        data: requestBody,
        timeout: 0,
        headers: { 'Content-Type': 'text/xml' }
    };

    return myRequest(requestOptions);
};