const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    roomId: { type: String, required: true }, // Can be 'global' or specific room ID
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true }, // Cache name to avoid lookups
    content: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);
