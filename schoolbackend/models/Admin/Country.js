const mongoose = require('mongoose');

const timezoneSchema = new mongoose.Schema({
    zoneName: String,
    gmtOffset: Number,
    gmtOffsetName: String,
    abbreviation: String,
    tzName: String,
});

const translationsSchema = new mongoose.Schema({
    kr: String,
    "pt-BR": String,
    pt: String,
    nl: String,
    hr: String,
    fa: String,
    de: String,
    es: String,
    fr: String,
    ja: String,
    it: String,
    cn: String,
    tr: String,
});

const countrySchema = new mongoose.Schema({
    _id: { type: Number, required: true },
    name: { type: String, required: true },
    iso3: { type: String, required: true, unique: true },
    iso2: { type: String, required: true, unique: true },
    numeric_code: String,
    phone_code: String,
    capital: String,
    currency: String,
    currency_name: String,
    currency_symbol: String,
    tld: String,
    native: String,
    region: String,
    region_id: String,
    subregion: String,
    subregion_id: String,
    nationality: String,
    timezones: [timezoneSchema],
    translations: translationsSchema,
    latitude: String,
    longitude: String,
    emoji: String,
    emojiU: String,
}, { timestamps: true, _id: false });


const Country = mongoose.model('Country', countrySchema);

module.exports = Country;
