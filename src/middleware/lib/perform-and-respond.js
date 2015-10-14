import formatMongooseError from './format-mongoose-error';

export default async function(promise, res) {
    try {
        let data = await promise;
        if (_.isUndefined(data)) {
            res.sendStatus(204);
        } else {
            res.send(data);
        }
    } catch (err) {
        const {statusCode, payload} = formatMongooseError(err);
        res.status(statusCode);
        res.send(payload);
    }
}
