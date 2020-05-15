const express = require('express');
const mongoose = require('mongoose');
const routes = require('./routes/route')
const { PORT, db_password} = require('./configs/config');


const app = express();


const port = PORT || 3000;
const url = `mongodb+srv://abraham-hanks:${db_password}@cluster0-f7rdy.mongodb.net/tutorial-app?retryWrites=true&w=majority`


mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true})
.then(
    result => { console.log('Database connected successfully') }
)
.catch(err =>{ console.log(err) });


app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/api.tutorialapp/v1', routes);


app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
