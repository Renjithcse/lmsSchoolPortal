const mongoose = require("mongoose");

const auditPlugin = (schema) => {
    schema.add({
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    });

    schema.pre("save", function (next) {
        if (!this.createdBy) {
            this.createdBy = this.user;
        }
        this.updatedBy = this.user;
        next();
    });

    schema.pre(["findOneAndUpdate", "updateOne"], function (next) {
        const update = this.getUpdate();
        if (!update.$set) update.$set = {};
        update.$set.updatedBy = this.user;
        next();
    });
};

module.exports = { auditPlugin };