const express = require('express');
const fs = require('fs');
const app = express();
const path = require('path');
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');
const { exit } = require('process');


const { MongoClient } = require('mongodb');
const uri= 'mongodb://localhost:27017';
const client = new MongoClient(uri);

app.use(express.urlencoded({ extended: true }));

const port = 8100;


async function connectToDb() {
    const connect = await client.connect();
    console.log('Connected to Database');
}
connectToDb();

app.get('/', (req, res) => {

    const indexHtml = path.join(__dirname, './');
    res.sendFile(indexHtml);

})


async function hashpassword(safe) {
    const saltRound = 10;
    const hashedPass = await bcrypt.hash(safe, saltRound);
    return hashedPass;
}

async function verifyPassword(safe,hashedPasswordWithSalt){
    const match = await bcrypt.compare(safe,hashedPasswordWithSalt);
    return match;
}


app.post('/home',async (req, res) => {
   

        //Connection to  the database and the collecitons 
        const db = client.db('Codeforces');
        const collection = db.collection('users');

        //Hashing of the password by calling the hashpassword funciotn 
        var hashed_password = await hashpassword(req.body.password);
        console.log(hashed_password);

        //Makin the obj variable which will store all the data of the current user
        var obj = {
            'name': req.body.name,
            'handle_name': req.body.handle_name,
            'email': req.body.email,
            'password': hashed_password
        }


        //Checking if the user is present or not 
        const existingUser = await collection.findOne({ email: req.body.email });  
        console.log(existingUser);

        if (existingUser) {
            const password = await verifyPassword(req.body.password,existingUser.password);
            console.log('User with email already exists:', req.body.email);

            console.log('User dont added ');

            if(password){
                return res.sendFile(homeHtml);
            }
            else{
                return res.send('Wrong password entered retry again');
            }
        }

        let result = collection.insertOne(obj);
        let user_collection = db.collection(req.body.handle_name);
        let insert = user_collection.insertOne({'name':req.body.name});
        console.log('User added to the database ');


        const homeHtml = path.join(__dirname, '../home_page/home.html');
        var data = {
            'name':req.body.name
        }
        let html = fs.readFile('homeHtml','utf-8',(err,htmlFile)=>{
            console.log('File read');
            const template = Handlebars.compile(htmlFile);
            const file = template(data);
            res.render(file);
        })

        
})

app.listen(port, () => {
    console.log('Server started at port no.: ' + `${port}`);
})

