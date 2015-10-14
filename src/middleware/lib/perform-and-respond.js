/**
 * Takes an error object from a mongoose `save()` call and sends a digestable output to client
 */
function failedOperationResponse(err, res) {
    const statusCode = err.statusCode || 400;
    res.status(statusCode);

    let ret = {
        description: err.message,
    };

    if (err.errors) {
        let errors = {};
        for (let key in err.errors) {
            errors[key] = err.errors[key].message;
        }
        ret.errors = errors;
    }
    res.send(ret);
}


export default async function(promise, res) {
    try {
        let data = await promise;
        if (_.isUndefined(data)) {
            res.sendStatus(204);
        } else {
            res.send(data);
        }
    } catch (err) {
        failedOperationResponse(err, res);
    }
}
