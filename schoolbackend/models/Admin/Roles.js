const mongoose = require('mongoose');
const { default: slugify } = require('slugify');

const rolesSchema = new mongoose.Schema({
    roleName: {
        type: String,
        index: true,
        unique: true,
        required: [true, "Please provide an academic year"]
    },
    permissions: [
        {
            action: {
                type: String,
                required: [true, 'Please provide an action']
            },
            subject: {
                type: String,
                required: [true, 'Please provide a subject']
            }
        }
    ],
    slug: {
        type: String,
        unique: true,
    },
}, { timestamps: true });

rolesSchema.pre('save', function (next) {
    if (!this.isModified('roleName')) {
        return next();
    }

    // Generate slug using slugify
    this.slug = slugify(this.roleName, { lower: true, strict: true });
    next();
});

const Roles = mongoose.model('Roles', rolesSchema);



module.exports = Roles;
