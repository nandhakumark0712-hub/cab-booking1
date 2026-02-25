const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const test = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('SUCCESS');
        process.exit(0);
    } catch (err) {
        console.log('ERROR_MSG:', err.message);
        console.log('ERROR_CODE:', err.code);
        process.exit(1);
    }
};

test();
