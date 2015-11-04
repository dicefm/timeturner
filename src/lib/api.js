import _ from 'lodash';

export default function(opts) {
    const {RequestModel} = opts;

    async function updateRequest(request, data) {
        data = _.pick(data, RequestModel.editableFields());
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
        if (query && query.search) {
            return await findByURL(query.search);
        }
        const items = await RequestModel.findAsync(query, {}, { sort: { date: 1 } });
        return items;
    }

    async function findOneById(id) {
        const item = await RequestModel.findByIdAsync(id);

        if (!item) {
            let error = new Error(`RequestModel with id '${id}' not found.`);
            error.statusCode = 404;
            throw error;
        }

        return item;
    }

    async function findByURL(url) {
        // escaping regex (http://stackoverflow.com/a/3561711)
        url = url.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`.*${url}.*`, 'i');
        return RequestModel.findAsync({ 'url': regex });
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
                error,
            },
        });
    }

    return {
        create: create,
        read  : findAll,
        search: findByURL,
        update: updateById,
        delete: deleteById,
        readId: findOneById,

        setState,
    };
}
