import _ from 'lodash';
import stringifySafe from 'json-stringify-safe';

import HTTPError from '../errors/HTTPError';

export default function(opts) {
    const {RequestModel} = opts;

    /**
    * Gets an object, removes any circular references using json-stringify-safe and returns a
    * parsed object that can be safely stringified/stored in mongodb.
    *
    * @param {Object} a potentially unsafe object to serialize (may contain circular references)
    * @return {Object} a safely serializable object without circular references
    */
    function getSafeObject(obj) {
        if (typeof obj === 'undefined') {
            return obj;
        }
        return JSON.parse(stringifySafe(obj));
    }


    async function updateRequest(request, data) {
        data = _.pick(data, RequestModel.editableFields());

        const {state} = request;
        if (_.includes(['QUEING', 'QUEUED', 'RUNNING'], state)) {
            throw new HTTPError(403, `You can't change requests that are in a "${state}" state`);
        }
        _.assign(request, data);

        await request.saveAsync();

        return request;
    }

    async function create(data) {
        let request = new RequestModel();

        await updateRequest(request, data);

        return request;
    }

    async function findAll(query) {
        const items = await RequestModel.findAsync(query, {}, { sort: { date: 1 } });
        return items;
    }

    async function findOneById(id) {
        const item = await RequestModel.findByIdAsync(id);

        if (!item) {
            throw new HTTPError(404, `RequestModel with id '${id}' not found.`);
        }

        return item;
    }

    async function updateById(id, data) {
        let request = await findOneById(id);

        await updateRequest(request, data);

        return request;
    }

    async function deleteById(id) {
        // ensure it exists or throw error
        await findOneById(id);

        await RequestModel.removeAsync({_id: id});
    }

    async function scheduleNextAttempt({item, error}) {
        const nextAttempt = new Date();
        nextAttempt.setMilliseconds(nextAttempt.getMilliseconds() + item.attempts_delay);

        await RequestModel.updateAsync({
            _id: item._id,
        }, {
            $set: {
                state        : 'RETRYING',
                attempts_next: nextAttempt,
            },
            $push: {
                attempts_errors: getSafeObject(error),
            },
        });
    }

    async function setFailedOrRetrying(id, {error}) {
        const item = await findOneById(id);
        const safeError = getSafeObject(error);

        let nextAttempt = null;
        let nextState = 'FAILED';

        if (item.attempts_count < item.attempts_max) {
            nextState = 'RETRYING';
            nextAttempt = new Date();
            nextAttempt.setMilliseconds(nextAttempt.getMilliseconds() + item.attempts_delay);
        }

        await RequestModel.updateAsync({
            _id: id,
        }, {
            $set: {
                state        : nextState,
                error        : safeError,
                attempts_next: nextAttempt,
            },
            $push: {
                attempts_errors: safeError,
            },
        });
    }

    async function setSuccess(id) {
        await RequestModel.updateAsync({
            _id: id,
        }, {
            $set: {
                state: 'SUCCESS',
                error: null,
            },
        });
    }

    async function setRunning(id) {
        await RequestModel.updateAsync({
            _id: id,
        }, {
            $set: {
                state: 'RUNNING',
            },
            $inc: {
                attempts_count: 1,
            }
        });
    }

    return {
        create: create,
        read  : findAll,
        update: updateById,
        delete: deleteById,
        readId: findOneById,

        setRunning,
        setSuccess,
        setFailedOrRetrying,
    };
}
