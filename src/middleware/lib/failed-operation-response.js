/**
 * Takes an error object from a mongoose `save()` call and sends a digestable output to client
 */
export default function(err) {
    const statusCode = err.statusCode || 400;

    let payload = {
        description: err.message,
    };

    if (err.errors) {
        let errors = {};
        for (let key in err.errors) {
            errors[key] = err.errors[key].message;
        }
        payload.errors = errors;
    }

    return {
        payload,
        statusCode,
    };
}
