const mongoose = require('mongoose');

const db = mongoose.connect('mongodb://localhost:27017/bhidu', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(()=> console.log('connected to database'))
.catch((err)=> console.log('custom error = '+ err));

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
module.exports = User;

