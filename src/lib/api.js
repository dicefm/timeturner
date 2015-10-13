import _ from 'lodash';

export default function(opts) {
    const {Request} = opts;

    async function updateRequest(request, data) {
        data = _.pick(data, Request.editableFields());
        _.assign(request, data);

        await request.saveAsync();

        return request;
    }

    async function create(data) {
        let request = new Request();

        await updateRequest(request, data);

        return request;
    }

    async function findAll(query) {
        const items = await Request.findAsync(query, {}, { sort: { date: 1 } });
        return items;
    }

    async function findOneById(id) {
        const item = await Request.findByIdAsync(id);

        if (!item) {
            let error = new Error(`Request with id '${id}' not found.`);
            error.statusCode = 404;
            throw error;
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

        await Request.removeAsync({_id: id});
    }

    async function setState(id, {state, error}) {
        await Request.updateAsync({
            _id: id,
        }, {
            $set: {
                state,
                error,
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
