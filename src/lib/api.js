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

    async function setState(id, {state, error}) {
        await RequestModel.updateAsync({
            _id: id,
        }, {
            $set: {
                state,
                error: getSafeObject(error),
            },
        });
    }

    return {
        create: create,
        read  : findAll,
        update: updateById,
        delete: deleteById,
        readId: findOneById,

        setState,
    };
}
