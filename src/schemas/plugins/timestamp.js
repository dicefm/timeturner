export default function(schema, opts) {
    schema.add({
        'model.meta.created_at': { type: Date },
        'model.meta.updated_at': { type: Date },
    });

    schema.pre('save', function(next) {
        let now = new Date();

        this.model.meta.updated_at = now;
        if (!this.model.meta.created_at) {
            this.model.meta.created_at = now;
        }

        next();
    });
};
