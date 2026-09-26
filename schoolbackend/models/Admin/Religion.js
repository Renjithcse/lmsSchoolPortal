const mongoose = require('mongoose');

const religionSchema = new mongoose.Schema({
  religionName: { 
    type: String, 
    required: [true, 'Religion name is required'], 
    unique: true 
  },
  status: { 
    type: String, 
    required: [true, 'Status is required'] 
  }
}, { timestamps: true });

const Religion = mongoose.model('Religion', religionSchema);

module.exports = Religion;