exports.init = function (loki, file) {
    var lokiDb = new loki(file, {env: 'NODEJS', autosave: true, autosaveInterval: 4000, autoload: true});

    return {
        loki: lokiDb,

        user: function () {
            return this.collection('user');
        },

        collection: function (name) {
            var collection = this.loki.getCollection(name);
            if (collection) {
                return collection;
            }

            return this.loki.addCollection(name);
        }
    };
};